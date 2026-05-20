import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { CheckboxModule, CheckboxChangeEvent } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { ContentService, SentenceDto } from '../../services/student-services/content.service';
import { FormsModule } from '@angular/forms';

interface SentenceCard extends SentenceDto {
    isReviewed: boolean;
}

@Component({
    selector: 'app-sentences-cards',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ButtonModule,
        TagModule,
        ToastModule,
        SelectModule,
        CheckboxModule,
        FormsModule
    ],
    providers: [MessageService],
    templateUrl: './sentences-cards.component.html',
    styleUrls: ['./sentences-cards.component.scss']
})
export class SentencesCardsComponent implements OnInit {
    private contentService = inject(ContentService);
    private messageService = inject(MessageService);

    cards = signal<SentenceCard[]>([]);
    loading = signal(true);
    mode = signal<'browse' | 'study'>('browse');
    current = signal(0);
    revealed = signal(false);
    finished = signal(false);
    studyCards = signal<SentenceCard[]>([]);
    selectedIds = new Set<number>();

    selectedFilter = signal<'all' | 'new' | 'reviewed'>('all');

    filterOptions = [
        { label: 'All sentences', value: 'all' },
        { label: 'Only new', value: 'new' },
        { label: 'Only reviewed', value: 'reviewed' }
    ];

    newCount = computed(() => this.cards().filter(c => !c.isReviewed).length);
    reviewedCount = computed(() => this.cards().filter(c => c.isReviewed).length);

    currentCard = computed(() => this.studyCards()[this.current()] ?? null);

    progress = computed(() => {
        const total = this.studyCards().length;
        if (!total) return 0;
        return Math.round(((this.current() + 1) / total) * 100);
    });

    constructor() {
        // Automatyczny reset revealed przy zmianie karty
        effect(() => {
            this.current();
            this.revealed.set(false);
        });
    }

    ngOnInit() {
        this.loadSentences();
    }

    loadSentences() {
        this.loading.set(true);
        this.contentService.sentences.reload();

        const interval = setInterval(() => {
            const data = this.contentService.sentences.value();

            if (data !== undefined) {
                clearInterval(interval);

                this.cards.set(
                    data.map(s => ({
                        ...s,
                        isReviewed: s.isReviewed
                    }))
                );

                this.loading.set(false);
            }
        }, 100);
    }

    toggleSelect(id: number, checked?: boolean) {
        const isChecked = checked ?? !this.selectedIds.has(id);

        if (isChecked) {
            this.selectedIds.add(id);
        } else {
            this.selectedIds.delete(id);
        }
    }

    toggleSelectAll(event: CheckboxChangeEvent) {
        const isChecked = event.checked;
        const visible = this.getFilteredCards();

        if (isChecked) {
            visible.forEach(c => this.selectedIds.add(c.id));
        } else {
            visible.forEach(c => this.selectedIds.delete(c.id));
        }
    }

    isCardSelected(id: number) {
        return this.selectedIds.has(id);
    }

    areAllVisibleSelected() {
        const visible = this.getFilteredCards();
        if (!visible.length) return false;
        return visible.every(c => this.selectedIds.has(c.id));
    }

    private getFilteredCards() {
        const f = this.selectedFilter();

        if (f === 'new') return this.cards().filter(c => !c.isReviewed);
        if (f === 'reviewed') return this.cards().filter(c => c.isReviewed);

        return this.cards();
    }

    startStudy() {
        const visible = this.getFilteredCards();
        const newItems = visible.filter(c => !c.isReviewed);
        const hasSelection = this.selectedIds.size > 0;

        if (newItems.length === 0 && !hasSelection) {
            this.messageService.add({
                severity: 'error',
                summary: 'Action required',
                detail: 'Select items or add new sentences first'
            });
            return;
        }

        let pool: SentenceCard[] = [];

        if (hasSelection) {
            pool = visible.filter(c => this.selectedIds.has(c.id));

            newItems.forEach(n => {
                if (!pool.some(p => p.id === n.id)) {
                    pool.push(n);
                }
            });
        } else {
            pool = newItems;
        }

        this.studyCards.set([...pool]);
        this.current.set(0);
        this.revealed.set(false);
        this.finished.set(false);
        this.mode.set('study');
    }

    toggleReveal() {
        this.revealed.update(v => !v);
    }

    reveal() {
        this.revealed.set(true);
    }

    next() {
        const card = this.currentCard();
        if (card) {
            this.contentService.reviewSentence(card.id)
                .subscribe({
                    next: () => this.moveNext(),
                    error: () => this.moveNext()
                });
        } else {
            this.moveNext();
        }
    }

    private moveNext() {
        this.revealed.set(false);

        setTimeout(() => {
            if (this.current() < this.studyCards().length - 1) {
                this.current.update(n => n + 1);
            } else {
                this.finished.set(true);
            }
        }, 150);
    }

    prev() {
        if (this.current() > 0) {
            this.current.update(n => n - 1);
            // revealed resetuje się automatycznie przez effect
        }
    }

    backToBrowse() {
        this.mode.set('browse');
        this.finished.set(false);
        this.current.set(0);
        this.revealed.set(false);
        this.selectedIds.clear();
        this.loadSentences();
    }
}