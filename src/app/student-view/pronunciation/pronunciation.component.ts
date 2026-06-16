import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import {
    ContentService,
    CorrectPronunciationDto
} from '../../services/student-services/content.service';
import { SectionActivityService } from '../../services/section-activity.service';
import { PronunciationAttemptDto} from '../../services/student-services/content.service';

type PronunciationView = 'practice' | 'mastered';

@Component({
    selector: 'app-pronunciation',
    standalone: true,
    imports: [CommonModule, ToastModule, ButtonModule, TagModule, TooltipModule],
    providers: [MessageService],
    templateUrl: './pronunciation.component.html'
})
export class PronunciationComponent implements OnInit {
    private contentService  = inject(ContentService);
    private messageService  = inject(MessageService);
    private activityService = inject(SectionActivityService);

    entries         = this.contentService.pronunciation;
    correctEntries  = signal<CorrectPronunciationDto[]>([]);
    loadingCorrect  = signal(false);
    activeView      = signal<PronunciationView>('practice');
    expandedEntryId = signal<number | null>(null);
    historyCache    = signal<Record<number, PronunciationAttemptDto[]>>({});
    historyLoading  = signal<Record<number, boolean>>({});
    isRecording     = signal(false);
    recordingEntryId = signal<number | null>(null);
    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];

    incorrectEntries = computed(() =>
        (this.entries.value() ?? []).filter(e => e.status === 'Incorrect')
    );

    pendingEntries = computed(() =>
        (this.entries.value() ?? []).filter(e => e.status === 'Pending')
    );

    sessionCount = computed(() =>
        (this.entries.value() ?? []).length
    );

    ngOnInit() {
        this.activityService.logActivity('pronunciation').subscribe();
        this.contentService.pronunciation.reload();
    }

    loadMastered() {
        this.loadingCorrect.set(true);
        this.contentService.getCorrectPronunciation().subscribe({
            next: (res) => {
                this.correctEntries.set(res ?? []);
                this.loadingCorrect.set(false);
            },
            error: () => this.loadingCorrect.set(false)
        });
    }

    setView(view: PronunciationView) {
        this.activeView.set(view);
        if (view === 'mastered' && !this.correctEntries().length) {
            this.loadMastered();
        }
    }

    speak(word: string) {
        speechSynthesis.cancel();
        const u  = new SpeechSynthesisUtterance(word);
        u.lang   = 'en-US';
        u.rate   = 0.9;
        u.pitch  = 1;
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

        this.historyLoading.update(s => ({
            ...s,
            [entryId]: true
        }));

        this.contentService.getAttempts(entryId).subscribe({
            next: (attempts) => {
                this.historyCache.update(s => ({
                    ...s,
                    [entryId]: attempts
                }));

                this.historyLoading.update(s => ({
                    ...s,
                    [entryId]: false
                }));
            },

            error: () => {
                this.historyLoading.update(s => ({
                    ...s,
                    [entryId]: false
                }));
            }
        });
    }

    getHistory(entryId: number): PronunciationAttemptDto[] {
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
            this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) this.audioChunks.push(e.data);
            };

            this.mediaRecorder.onstop = () => {
                stream.getTracks().forEach(t => t.stop());
                this.submitRecording(entryId);
            };

            this.mediaRecorder.start();
            this.isRecording.set(true);
            this.recordingEntryId.set(entryId);
        } catch {
            this.messageService.add({
                severity: 'error',
                summary: 'Microphone error',
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
        const blob = new Blob(this.audioChunks, {
            type: 'audio/webm'
        });
    
        const formData = new FormData();
    
        formData.append('audioFile', blob, 'recording.webm');

        this.contentService.submitAttempt(entryId, formData)
            .subscribe({
                next: (result) => {
                
                    const isGreat = result.result === 'Great';
                
                    this.messageService.add({
                        severity: isGreat ? 'success' : 'warn',
                        summary: isGreat ? 'Great job!' : 'Not quite yet',
                        detail: `Score: ${result.score}% · ${result.feedback}`,
                        life: 5000
                    });

                    const newAttempt: PronunciationAttemptDto = {
                        id: Date.now(),
                        feedback: result.feedback,
                        result: result.result,
                        score: result.score,
                        createdAt: new Date().toISOString()
                    };
                
                    this.historyCache.update(s => ({
                        ...s,
                        [entryId]: [
                            newAttempt,
                            ...(s[entryId] ?? [])
                        ]
                    }));
                },
            
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Could not process your recording. Please try again.'
                    });
                }
            });
    }
}