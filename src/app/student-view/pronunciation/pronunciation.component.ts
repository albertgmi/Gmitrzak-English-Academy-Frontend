import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { ContentService, CorrectPronunciationDto, PronunciationAttemptDto } from '../../services/student-services/content.service';
import { SectionActivityService } from '../../services/section-activity.service';

type PronunciationView = 'practice' | 'mastered';

@Component({
    selector: 'app-pronunciation',
    standalone: true,
    imports: [CommonModule, ToastModule, ButtonModule, TagModule, TooltipModule, DialogModule, CheckboxModule, FormsModule],
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

    podcastDialogVisible = signal(false);
    selectedGroups       = signal<string[]>(['incorrect', 'pending']);
    podcastQueue         = signal<any[]>([]);
    podcastIndex         = signal(0);
    podcastPlaying       = signal(false);
    podcastPaused        = signal(false);

    private podcastGeneration = 0;

    availableGroups = [
        { id: 'incorrect', label: 'Needs more practice (Incorrect)' },
        { id: 'pending',   label: 'To practice (Pending)' },
        { id: 'mastered',  label: 'Mastered words' }
    ];

    incorrectEntries = computed(() =>
        (this.entries.value() ?? []).filter(e => e.status === 'Incorrect')
    );

    pendingEntries = computed(() =>
        (this.entries.value() ?? []).filter(e => e.status === 'Pending')
    );

    sessionCount = computed(() =>
        (this.entries.value() ?? []).length
    );

    podcastCurrentCard = computed<any | null>(() => {
        const q = this.podcastQueue();
        return q[this.podcastIndex()] ?? null;
    });

    podcastProgressLabel = computed(() => {
        const total = this.podcastQueue().length;
        return total ? `${this.podcastIndex() + 1} / ${total}` : '';
    });

    ngOnInit() {
        this.activityService.logActivity('pronunciation').subscribe();
        this.contentService.pronunciation.reload();

        if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
        }
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

    private expandAbbreviations(text: string): string {
        return text
            .replace(/\bsb\b/gi, 'somebody')
            .replace(/\bsth\b/gi, 'something');
    }

    private getBestVoice(lang: string): SpeechSynthesisVoice | null {
        if (typeof speechSynthesis === 'undefined') return null;
        const voices = speechSynthesis.getVoices();
        if (!voices.length) return null;

        const prefix = lang.substring(0, 2);
        const langVoices = voices.filter(v => v.lang.startsWith(prefix) || v.lang.replace('_', '-').startsWith(prefix));
        if (!langVoices.length) return null;

        const naturalVoice = langVoices.find(v =>
            v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Online') ||
            v.name.includes('Neural')
        );

        return naturalVoice || langVoices[0];
    }

    speak(word: string) {
        speechSynthesis.cancel();
        const processedWord = this.expandAbbreviations(word);
        
        const u = new SpeechSynthesisUtterance(processedWord);
        u.lang  = 'en-US';
        u.rate  = 0.9;
        u.pitch = 1;

        const voice = this.getBestVoice('en-US');
        if (voice) u.voice = voice;

        speechSynthesis.speak(u);
    }

    private speakAsync(text: string, lang: string = 'en-US'): Promise<void> {
        return new Promise((resolve) => {
            const processedText = lang === 'en-US' ? this.expandAbbreviations(text) : text;

            const u = new SpeechSynthesisUtterance(processedText);
            u.lang  = lang;
            u.rate  = 0.9;
            u.pitch = 1;

            const voice = this.getBestVoice(lang);
            if (voice) u.voice = voice;

            u.onend = () => resolve();
            u.onerror = () => resolve();
            speechSynthesis.speak(u);
        });
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    openPodcastDialog() {
        if (!this.correctEntries().length) {
            this.loadMastered();
        }
        this.podcastDialogVisible.set(true);
    }

    toggleGroup(groupId: string, checked: boolean) {
        this.selectedGroups.update(list =>
            checked ? [...list, groupId] : list.filter(g => g !== groupId)
        );
    }

    selectAllGroups() {
        this.selectedGroups.set(['incorrect', 'pending', 'mastered']);
    }

    clearGroups() {
        this.selectedGroups.set([]);
    }

    startPodcast() {
        let cards: any[] = [];
        const selected = this.selectedGroups();

        if (selected.includes('incorrect')) {
            cards = cards.concat(this.incorrectEntries());
        }
        if (selected.includes('pending')) {
            cards = cards.concat(this.pendingEntries());
        }
        if (selected.includes('mastered')) {
            cards = cards.concat(this.correctEntries());
        }

        if (!cards.length) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No words selected',
                detail: 'Select at least one group with words.'
            });
            return;
        }

        this.podcastQueue.set(cards);
        this.podcastIndex.set(0);
        this.podcastDialogVisible.set(false);
        this.podcastPlaying.set(true);
        this.podcastPaused.set(false);
        this.runPodcastLoop();
    }

    private async runPodcastLoop() {
        const gen = ++this.podcastGeneration;

        while (this.podcastPlaying() && gen === this.podcastGeneration && this.podcastIndex() < this.podcastQueue().length) {
            const card = this.podcastCurrentCard();
            if (!card) break;

            const wordToSpeak = card.word;

            await this.speakAsync(wordToSpeak, 'en-US');
            if (gen !== this.podcastGeneration || !this.podcastPlaying()) return;
            await this.delay(600);

            if (gen !== this.podcastGeneration || !this.podcastPlaying()) return;

            await this.speakAsync(wordToSpeak, 'en-US');
            if (gen !== this.podcastGeneration || !this.podcastPlaying()) return;
            await this.delay(1200);

            if (gen !== this.podcastGeneration || !this.podcastPlaying()) return;
            if (this.podcastIndex() < this.podcastQueue().length - 1) {
                this.podcastIndex.update(i => i + 1);
            } else {
                break;
            }
        }

        if (gen === this.podcastGeneration) this.podcastPlaying.set(false);
    }

    togglePausePodcast() {
        if (this.podcastPaused()) {
            speechSynthesis.resume();
            this.podcastPaused.set(false);
        } else {
            speechSynthesis.pause();
            this.podcastPaused.set(true);
        }
    }

    skipPodcast(direction: 1 | -1) {
        speechSynthesis.cancel();
        const newIndex = this.podcastIndex() + direction;
        if (newIndex < 0 || newIndex >= this.podcastQueue().length) return;
        this.podcastIndex.set(newIndex);
        this.podcastPlaying.set(true);
        this.podcastPaused.set(false);
        this.runPodcastLoop();
    }

    stopPodcast() {
        this.podcastGeneration++;
        speechSynthesis.cancel();
        this.podcastPlaying.set(false);
        this.podcastPaused.set(false);
        this.podcastQueue.set([]);
        this.podcastIndex.set(0);
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

        this.contentService.getAttempts(entryId).subscribe({
            next: (attempts) => {
                this.historyCache.update(s => ({ ...s, [entryId]: attempts }));
                this.historyLoading.update(s => ({ ...s, [entryId]: false }));
            },
            error: () => {
                this.historyLoading.update(s => ({ ...s, [entryId]: false }));
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
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audioFile', blob, 'recording.webm');

        this.contentService.submitAttempt(entryId, formData).subscribe({
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
                    [entryId]: [newAttempt, ...(s[entryId] ?? [])]
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