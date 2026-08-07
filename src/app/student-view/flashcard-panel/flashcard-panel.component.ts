import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { FlashcardService, FlashcardDto, FlashcardStudyLogDto } from '../../services/student-services/flashcard.service';

type Tab = 'all' | 'today' | 'leeches' | 'search' | 'logs';

@Component({
    selector: 'app-flashcard-panel',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule,
        InputTextModule, IconFieldModule, InputIconModule,
        TagModule, ToastModule, TooltipModule, DialogModule, CheckboxModule, RouterModule],
    providers: [MessageService],
    templateUrl: './flashcard-panel.component.html'
})
export class FlashcardPanelComponent implements OnInit {
    private flashcardService = inject(FlashcardService);
    private messageService = inject(MessageService);

    activeTab = signal<Tab>('all');

    allFlashcards = this.flashcardService.flashcards;
    studiedToday = signal<FlashcardDto[]>([]);
    leeches = signal<FlashcardDto[]>([]);
    searchResults = signal<FlashcardDto[]>([]);
    studyLogs = signal<FlashcardStudyLogDto[]>([]);

    searchQuery = signal('');
    loadingTab = signal(false);
    tabs = [
        { id: 'all',     label: 'All cards',     icon: 'pi pi-clone' },
        { id: 'today',   label: 'Studied today', icon: 'pi pi-calendar' },
        { id: 'leeches', label: 'Leeches',       icon: 'pi pi-exclamation-triangle' },
        { id: 'search',  label: 'Search',        icon: 'pi pi-search' },
        { id: 'logs',    label: 'Study logs',    icon: 'pi pi-history' },
    ];

    podcastDialogVisible = signal(false);
    selectedCategories = signal<string[]>([]);
    podcastQueue = signal<FlashcardDto[]>([]);
    podcastIndex = signal(0);
    podcastPlaying = signal(false);
    podcastPaused = signal(false);

    private podcastGeneration = 0;

    availableCategories = computed(() => {
        const cards = this.allFlashcards.value() ?? [];
        return [...new Set(cards.map(c => c.category))].sort();
    });

    podcastCurrentCard = computed<FlashcardDto | null>(() => {
        const q = this.podcastQueue();
        return q[this.podcastIndex()] ?? null;
    });

    podcastProgressLabel = computed(() => {
        const total = this.podcastQueue().length;
        return total ? `${this.podcastIndex() + 1} / ${total}` : '';
    });

    ngOnInit() {
        this.flashcardService.flashcards.reload();

        if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
        }
    }

    setTab(tabId: string) {
        const tab = tabId as Tab;
        this.activeTab.set(tab);
        if (tab === 'today' && !this.studiedToday().length) this.fetchTabData(this.flashcardService.getStudiedToday(), this.studiedToday, 'today\'s reviews');
        if (tab === 'leeches' && !this.leeches().length) this.fetchTabData(this.flashcardService.getLeeches(), this.leeches, 'leeches');
        if (tab === 'logs' && !this.studyLogs().length) this.fetchTabData(this.flashcardService.getStudyLogs(), this.studyLogs, 'study history');
    }

    private fetchTabData(observable: any, targetSignal: any, label: string) {
        this.loadingTab.set(true);
        observable.subscribe({
            next: (d: any) => {
                targetSignal.set(d);
                this.loadingTab.set(false);
            },
            error: () => this.loadingHistoryError(label)
        });
    }

    search() {
        const q = this.searchQuery().trim();
        if (!q) return;
        this.loadingTab.set(true);
        this.flashcardService.searchFlashcards(q).subscribe({
            next: (d) => {
                this.searchResults.set(d);
                this.loadingTab.set(false);
            },
            error: () => this.loadingHistoryError('search results')
        });
    }

    private loadingHistoryError(label: string) {
        this.loadingTab.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: `Failed to load: ${label}` });
    }

    formatTime(seconds: number): string {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    }

    onGlobalFilter(table: any, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    private expandAbbreviations(text: string): string {
        return text
            .replace(/\bsb\b/gi, 'somebody')
            .replace(/\bsth\b/gi, 'something');
    }

    private getBestPolishVoice(): SpeechSynthesisVoice | null {
        if (typeof speechSynthesis === 'undefined') return null;
        const voices = speechSynthesis.getVoices();
        if (!voices.length) return null;

        const plVoices = voices.filter(v => v.lang.startsWith('pl'));
        if (!plVoices.length) return null;

        const naturalVoice = plVoices.find(v =>
            v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Online') ||
            v.name.includes('Neural')
        );

        return naturalVoice || plVoices[0];
    }
    
    speak(text: string, event?: Event) {
        event?.stopPropagation();
        speechSynthesis.cancel();
    
        const u = new SpeechSynthesisUtterance(this.expandAbbreviations(text));
        u.lang = 'en-US';
        u.rate = 0.9;
        u.pitch = 1;
        speechSynthesis.speak(u);
    }
    
    private speakAsync(text: string, lang: string = 'en-US'): Promise<void> {
        return new Promise((resolve) => {
            const processedText = lang === 'en-US' ? this.expandAbbreviations(text) : text;
        
            const u = new SpeechSynthesisUtterance(processedText);
            u.lang = lang;
            u.rate = 0.9;
            u.pitch = 1;

            if (lang.startsWith('pl')) {
                const voice = this.getBestPolishVoice();
                if (voice) u.voice = voice;
            }

            u.onend = () => resolve();
            u.onerror = () => resolve();
            speechSynthesis.speak(u);
        });
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    openPodcastDialog() {
        this.selectedCategories.set([...this.availableCategories()]);
        this.podcastDialogVisible.set(true);
    }

    toggleCategory(cat: string, checked: boolean) {
        this.selectedCategories.update(list =>
            checked ? [...list, cat] : list.filter(c => c !== cat)
        );
    }

    selectAllCategories() {
        this.selectedCategories.set([...this.availableCategories()]);
    }

    clearCategories() {
        this.selectedCategories.set([]);
    }

    startPodcast() {
        const cards = (this.allFlashcards.value() ?? [])
            .filter(c => this.selectedCategories().includes(c.category));

        if (!cards.length) {
            this.messageService.add({ severity: 'warn', summary: 'No flashcards', detail: 'Select at least one category with flashcards.' });
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

            await this.speakAsync(card.front, 'en-US');
            if (gen !== this.podcastGeneration || !this.podcastPlaying()) return;
            await this.delay(500);

            if (gen !== this.podcastGeneration || !this.podcastPlaying()) return;
            await this.speakAsync(card.back, 'pl-PL');
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
}