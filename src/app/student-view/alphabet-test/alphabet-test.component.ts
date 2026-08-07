import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import {
    ContentService,
    AlphabetEntryDto,
    AlphabetAttemptDto
} from '../../services/student-services/content.service';
import { SectionActivityService } from '../../services/section-activity.service';

type AlphabetTab = 'letters' | 'spelling';

function getMondayIso(date: Date): string {
    const d = new Date(date);
    const day = (d.getDay() + 6) % 7; // 0 = poniedziałek
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

    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];
    private recordStartedAt = 0;
    private readonly MIN_RECORD_MS = 500;

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
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioChunks = [];

            const mimeType = MediaRecorder.isTypeSupported('audio/webm')
                ? 'audio/webm'
                : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';

            this.mediaRecorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream);

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) this.audioChunks.push(e.data);
            };

            this.mediaRecorder.onstop = () => {
                stream.getTracks().forEach(t => t.stop());
                const duration = Date.now() - this.recordStartedAt;
                if (duration < this.MIN_RECORD_MS) {
                    this.messageService.add({
                        severity: 'warn', summary: 'Too short',
                        detail: 'Hold the button a bit longer while speaking.', life: 3000
                    });
                    return;
                }
                this.submitRecording(entryId);
            };

            this.recordStartedAt = Date.now();
            this.mediaRecorder.start();
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
        if (this.mediaRecorder && this.isRecording()) {
            this.mediaRecorder.stop();
            this.isRecording.set(false);
            this.recordingEntryId.set(null);
        }
    }

    private submitRecording(entryId: number) {
        const blob = new Blob(this.audioChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
        const formData = new FormData();
        formData.append('audioFile', blob, 'recording.webm');

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