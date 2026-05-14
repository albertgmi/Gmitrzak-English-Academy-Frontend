import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { FlashcardService, FlashcardDto, FlashcardStudyLogDto } from '../../services/student-services/flashcard.service';
import { FlashcardStudyModeComponent } from '../flashcard-study-mode/flashcard-study-mode.component';

type Tab = 'all' | 'today' | 'leeches' | 'search' | 'logs';

@Component({
    selector: 'app-flashcard-panel',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule,
        InputTextModule, IconFieldModule, InputIconModule,
        TagModule, ToastModule, TooltipModule, FlashcardStudyModeComponent,
        FlashcardStudyModeComponent],
    providers: [MessageService],
    templateUrl: './flashcard-panel.component.html'
})
export class FlashcardPanelComponent implements OnInit {
    private flashcardService = inject(FlashcardService);
    private messageService = inject(MessageService);

    activeTab = signal<Tab>('all');
    studyModeVisible = signal(false);

    allFlashcards = this.flashcardService.flashcards;
    studiedToday = signal<FlashcardDto[]>([]);
    leeches = signal<FlashcardDto[]>([]);
    searchResults = signal<FlashcardDto[]>([]);
    studyLogs = signal<FlashcardStudyLogDto[]>([]);

    searchQuery = signal('');
    loadingTab = signal(false);

    ngOnInit() {
        this.flashcardService.flashcards.reload();
    }

    startStudySession() {
        if (!this.allFlashcards.value()?.length) return;
        this.studyModeVisible.set(true);
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
}