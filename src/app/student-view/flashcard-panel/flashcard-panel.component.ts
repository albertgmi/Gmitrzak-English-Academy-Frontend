import { Component, inject, signal, OnInit } from '@angular/core';
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
import { MessageService } from 'primeng/api';
import { FlashcardService, FlashcardDto, FlashcardStudyLogDto } from '../../services/student-services/flashcard.service';

type Tab = 'all' | 'today' | 'leeches' | 'search' | 'logs';

@Component({
    selector: 'app-flashcard-panel',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule,
        InputTextModule, IconFieldModule, InputIconModule,
        TagModule, ToastModule, TooltipModule, RouterModule],
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

    ngOnInit() {
        this.flashcardService.flashcards.reload();
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