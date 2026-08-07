import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import {
    ContentService,
    AlphabetAttemptDto
} from '../../services/student-services/content.service';
import { SectionActivityService } from '../../services/section-activity.service';

type AlphabetTab = 'letters' | 'spelling';

function getMondayIso(date: Date): string {
    const d = new Date(date);
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    return d.toISOString().slice(0, 10);
}

@Component({
    selector: 'app-alphabet-test',
    standalone: true,
    imports: [CommonModule, ToastModule, ButtonModule, TagModule, TooltipModule],
    providers: [MessageService],
    templateUrl: './alphabet-test.component.html'
})
export class AlphabetTestComponent implements OnInit {
    private contentService = inject(ContentService);
    private messageService = inject(MessageService);
    private activityService = inject(SectionActivityService);

    entries = this.contentService.alphabet;
    activeTab = signal<AlphabetTab>('letters');
    expandedEntryId = signal<number | null>(null);
    historyCache = signal<Record<number, AlphabetAttemptDto[]>>({});
    historyLoading = signal<Record<number, boolean>>({});
    isRecording = signal(false);
    recordingEntryId = signal<number | null>(null);
    submitting = signal<number | null>(null);
    generating = signal(false);

    private audioContext: AudioContext | null = null;
    private mediaStream: MediaStream | null = null;
    private audioProcessor: ScriptProcessorNode | null = null;
    private pcmBuffers: Float32Array[] = [];

    letterEntries = computed(() =>
        (this.entries.value() ?? []).filter(e => e.type === 'Letters')
    );

    spellingEntries = computed(() =>
        (this.entries.value() ?? []).filter(e => e.type === 'Abbreviation')
    );

    isCurrentWeekGenerated = computed(() => {
        const list = this.entries.value() ?? [];
        if (!list.length) return false;
        return list[0].weekStartDate === getMondayIso(new Date());
    });

    ngOnInit() {
        this.activityService.logActivity('pronunciation').subscribe();
        this.contentService.alphabet.reload();
    }

    setTab(tab: AlphabetTab) {
        this.activeTab.set(tab);
        this.expandedEntryId.set(null);
    }

    generate() {
        this.generating.set(true);
        this.contentService.generateAlphabetProgram().subscribe({
            next: () => {
                this.generating.set(false);
                this.contentService.alphabet.reload();
                this.messageService.add({
                    severity: 'success', summary: 'Ready!',
                    detail: 'Your alphabet program for this week is ready.', life: 3000
                });
            },
            error: (err) => {
                this.generating.set(false);
                this.messageService.add({
                    severity: 'error', summary: 'Could not generate',
                    detail: err?.error?.message ?? 'Please try again later.', life: 4000
                });
            }
        });
    }

    speakSpelled(text: string) {
        speechSynthesis.cancel();
        const letters = text.split('').filter(c => /[a-zA-Z0-9]/.test(c));
        const u = new SpeechSynthesisUtterance(letters.join(', '));
        u.lang = 'en-US';
        u.rate = 0.75;
        speechSynthesis.speak(u);
    }

    toggleEntry(entryId: number) {
        if (this.expandedEntryId() === entryId) {
            this.expandedEntryId.set(null);
        } else {
            this.expandedEntryId.set(entryId);
            this.loadHistory(entryId);
        }
    }

    loadHistory(entryId: number) {
        if (this.historyCache()[entryId]) return;
        this.historyLoading.update(s => ({ ...s, [entryId]: true }));

        this.contentService.getAlphabetAttempts(entryId).subscribe({
            next: (attempts) => {
                this.historyCache.update(s => ({ ...s, [entryId]: attempts }));
                this.historyLoading.update(s => ({ ...s, [entryId]: false }));
            },
            error: () => this.historyLoading.update(s => ({ ...s, [entryId]: false }))
        });
    }

    getHistory(entryId: number): AlphabetAttemptDto[] {
        return this.historyCache()[entryId] ?? [];
    }

    isHistoryLoading(entryId: number): boolean {
        return this.historyLoading()[entryId] ?? false;
    }

    async startRecording(entryId: number) {
        if (this.isRecording()) return;

        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            this.audioContext = new AudioCtx({ sampleRate: 16000 });

            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.audioProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
            this.pcmBuffers = [];

            this.audioProcessor.onaudioprocess = (e) => {
                if (this.isRecording()) {
                    const inputData = e.inputBuffer.getChannelData(0);
                    this.pcmBuffers.push(new Float32Array(inputData));
                }
            };

            source.connect(this.audioProcessor);
            this.audioProcessor.connect(this.audioContext.destination);

            this.isRecording.set(true);
            this.recordingEntryId.set(entryId);
        } catch {
            this.messageService.add({
                severity: 'error', summary: 'Microphone error',
                detail: 'Could not access microphone. Please check your permissions.'
            });
        }
    }

    stopRecording() {
        if (this.isRecording()) {
            this.isRecording.set(false);
            const entryId = this.recordingEntryId();
            this.recordingEntryId.set(null);

            if (this.audioProcessor) {
                this.audioProcessor.disconnect();
                this.audioProcessor = null;
            }

            if (this.mediaStream) {
                this.mediaStream.getTracks().forEach(t => t.stop());
                this.mediaStream = null;
            }

            if (this.audioContext) {
                const sampleRate = this.audioContext.sampleRate;
                this.audioContext.close().then(() => {
                    this.audioContext = null;
                    if (entryId !== null && this.pcmBuffers.length > 0) {
                        const wavBlob = this.encodeWAV(this.pcmBuffers, sampleRate);
                        this.submitRecording(entryId, wavBlob);
                    }
                });
            }
        }
    }

    private encodeWAV(samples: Float32Array[], sampleRate: number): Blob {
        let totalLength = 0;
        for (const buffer of samples) totalLength += buffer.length;

        const mergedSamples = new Float32Array(totalLength);
        let offset = 0;
        for (const buffer of samples) {
            mergedSamples.set(buffer, offset);
            offset += buffer.length;
        }

        const buffer = new ArrayBuffer(44 + mergedSamples.length * 2);
        const view = new DataView(buffer);

        const writeString = (view: DataView, offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + mergedSamples.length * 2, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(view, 36, 'data');
        view.setUint32(40, mergedSamples.length * 2, true);

        let index = 44;
        for (let i = 0; i < mergedSamples.length; i++) {
            const s = Math.max(-1, Math.min(1, mergedSamples[i]));
            view.setInt16(index, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            index += 2;
        }

        return new Blob([view], { type: 'audio/wav' });
    }

    private submitRecording(entryId: number, wavBlob: Blob) {
        const formData = new FormData();
        formData.append('audioFile', wavBlob, 'recording.wav');

        this.submitting.set(entryId);

        this.contentService.submitAlphabetAttempt(entryId, formData).subscribe({
            next: (result) => {
                this.submitting.set(null);
                const hasProblems = !!result.problemLetters?.trim();

                this.messageService.add({
                    severity: hasProblems ? 'warn' : 'success',
                    summary: hasProblems ? 'Almost there' : 'Great job!',
                    detail: result.feedback,
                    life: 5000
                });

                const newAttempt: AlphabetAttemptDto = {
                    id: Date.now(),
                    problemLetters: result.problemLetters,
                    feedback: result.feedback,
                    createdAt: new Date().toISOString()
                };

                this.historyCache.update(s => ({
                    ...s,
                    [entryId]: [newAttempt, ...(s[entryId] ?? [])]
                }));
            },
            error: () => {
                this.submitting.set(null);
                this.messageService.add({
                    severity: 'error', summary: 'Error',
                    detail: 'Could not process your recording. Please try again.'
                });
            }
        });
    }

    problemLetterList(problemLetters: string): string[] {
        return problemLetters ? problemLetters.split(',').filter(Boolean) : [];
    }
}