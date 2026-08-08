import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import { ContentService, SentenceDto } from '../../services/student-services/content.service';
import { SectionActivityService } from '../../services/section-activity.service';

interface SessionCard extends SentenceDto {
    incorrectStep: number;
    availableAt: number;
}

@Component({
    selector: 'app-sentences-cards',
    standalone: true,
    imports: [CommonModule, ButtonModule, TagModule, RouterModule],
    templateUrl: './sentences-cards.component.html',
    styleUrls: ['./sentences-cards.component.scss']
})
export class SentencesCardsComponent implements OnInit {
    private contentService = inject(ContentService);
    private destroyRef = inject(DestroyRef);
    private activityService = inject(SectionActivityService);

    queue = signal<SessionCard[]>([]);
    pendingQueue = signal<SessionCard[]>([]);
    currentCard = signal<SessionCard | null>(null);
    showBack = signal(false);
    isFinished = signal(false);
    loading = signal(true);
    streak = signal<number>(0);
    studiedToday = signal<boolean>(false);

    streakInfo = computed(() => {
        const s = this.streak();
        if (s === 0) {
            return {
                icon: 'pi-calendar-plus',
                text: '0 Day Streak - Start today!',
                bgClass: 'bg-surface-100 dark:bg-surface-800/60',
                borderClass: 'border-surface-300 dark:border-surface-700',
                textClass: 'text-surface-600 dark:text-surface-400',
                iconClass: 'text-surface-400 dark:text-surface-500'
            };
        }
        if (s === 1) {
            return {
                icon: 'pi-bolt',
                text: '1 Day Streak - Keep it up tomorrow!',
                bgClass: 'bg-amber-500/10 dark:bg-amber-500/20',
                borderClass: 'border-amber-500/30',
                textClass: 'text-amber-600 dark:text-amber-400',
                iconClass: 'text-amber-500'
            };
        }
        if (s < 7) {
            return {
                icon: 'pi-bolt',
                text: `${s} Day Streak - Great job!`,
                bgClass: 'bg-orange-500/10 dark:bg-orange-500/20',
                borderClass: 'border-orange-500/30',
                textClass: 'text-orange-600 dark:text-orange-400',
                iconClass: 'text-orange-500'
            };
        }
        if (s < 14) {
            return {
                icon: 'pi-star-fill',
                text: `${s} Day Streak - Outstanding!`,
                bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/20',
                borderClass: 'border-emerald-500/30',
                textClass: 'text-emerald-600 dark:text-emerald-400',
                iconClass: 'text-emerald-500'
            };
        }
        if (s < 30) {
            return {
                icon: 'pi-star-fill',
                text: `${s} Day Streak - Master of consistency!`,
                bgClass: 'bg-purple-500/10 dark:bg-purple-500/20',
                borderClass: 'border-purple-500/30',
                textClass: 'text-purple-600 dark:text-purple-400',
                iconClass: 'text-purple-500'
            };
        }
        return {
            icon: 'pi-trophy',
            text: `${s} Day Streak - Absolute dedication!`,
            bgClass: 'bg-cyan-500/10 dark:bg-cyan-500/20',
            borderClass: 'border-cyan-500/40',
            textClass: 'text-cyan-600 dark:text-cyan-400',
            iconClass: 'text-cyan-500'
        };
    });

    private cardStartTime = 0;
    private activeTimeout: any = null;

    private readonly INCORRECT_DELAYS_MS = [
        3 * 60 * 1000,
        6 * 60 * 1000,
        10 * 60 * 1000,
        15 * 60 * 1000
    ];

    nextEasyInterval = computed(() => {
        const card = this.currentCard();
        if (!card) return 2;
        return card.interval === 0 ? 2 : card.interval * 2;
    });

    currentIncorrectLabel = computed(() => {
        const card = this.currentCard();
        if (!card) return '3 min';

        const step = Math.min(
            card.incorrectStep,
            this.INCORRECT_DELAYS_MS.length - 1
        );

        return `${this.INCORRECT_DELAYS_MS[step] / 60000} min`;
    });

    totalInSession = computed(() => {
        return (
            this.queue().length +
            this.pendingQueue().length +
            (this.currentCard() ? 1 : 0)
        );
    });

    ngOnInit() {
        this.loadStreak();
        this.loadCards();
    }

    loadStreak() {
        this.contentService.getSentenceStreak().subscribe({
            next: (res) => {
                this.streak.set(res.streak);
                this.studiedToday.set(res.studiedToday);
            },
            error: (err) => console.error('Failed to load sentence streak:', err)
        });
    }

    loadCards() {
        this.loading.set(true);

        this.contentService.sentences.reload();

        const interval = setInterval(() => {
            const cards = this.contentService.sentences.value();

            if (cards !== undefined) {
                clearInterval(interval);
                this.initializeSession(cards);
                this.loading.set(false);
            }
        }, 100);
    }

    private initializeSession(allCards: SentenceDto[]) {
        const today = new Intl.DateTimeFormat('sv-SE').format(new Date());

        const toReview: SessionCard[] = allCards
            .filter(c => c.nextReviewDate <= today)
            .map(c => ({
                ...c,
                incorrectStep: 0,
                availableAt: 0
            }));

        if (toReview.length > 0) {
            this.queue.set(toReview);
            this.pendingQueue.set([]);
            this.isFinished.set(false);
            this.nextCard();
        } else {
            this.currentCard.set(null);
            this.queue.set([]);
            this.pendingQueue.set([]);
            this.isFinished.set(true);
        }
    }

    nextCard() {
        if (this.activeTimeout) {
            clearTimeout(this.activeTimeout);
        }

        this.showBack.set(false);

        const now = Date.now();

        const ready = this.pendingQueue().filter(
            c => c.availableAt <= now
        );

        const stillWaiting = this.pendingQueue().filter(
            c => c.availableAt > now
        );

        if (ready.length > 0) {
            this.pendingQueue.set(stillWaiting);
            this.queue.update(q => [...q, ...ready]);
        }

        const current = this.queue();

        if (current.length > 0) {
            this.currentCard.set(current[0]);
            this.queue.set(current.slice(1));
            this.cardStartTime = Date.now();
        } else if (stillWaiting.length > 0) {
            this.currentCard.set(null);

            const nextAvailableAt = Math.min(
                ...stillWaiting.map(c => c.availableAt)
            );

            const delay = Math.max(nextAvailableAt - now, 1000);

            this.activeTimeout = setTimeout(() => {
                this.nextCard();
            }, delay);
        } else {
            this.currentCard.set(null);
            this.isFinished.set(true);
        }
    }

    handleReview(type: 'incorrect' | 'hard' | 'easy') {
        const card = this.currentCard();

        if (!card) return;

        if (!this.studiedToday()) {
            this.studiedToday.set(true);
            this.streak.update(s => s + 1);
        }

        this.activityService.logActivity('sentenceflashcards' as any).subscribe();

        if (type === 'incorrect') {
            const step = Math.min(
                card.incorrectStep,
                this.INCORRECT_DELAYS_MS.length - 1
            );

            const delayMs = this.INCORRECT_DELAYS_MS[step];

            const updatedCard: SessionCard = {
                ...card,
                incorrectStep: card.incorrectStep + 1,
                availableAt: Date.now() + delayMs
            };

            this.pendingQueue.update(q => [...q, updatedCard]);
        }

        this.contentService.reviewSentence(card.id, type)
            .pipe(
                take(1),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe({
                error: (err) => {
                    console.error('Failed to save sentence review:', err);
                }
            });

        this.showBack.set(false);

        setTimeout(() => {
            this.nextCard();
        }, 200);
    }

    toggleCard() {
        this.showBack.set(!this.showBack());
    }

    speak(text: string) {
        speechSynthesis.cancel();

        const processedWord = text
            .replace(/\bsb\b/gi, 'somebody')
            .replace(/\bsth\b/gi, 'something');

        const u = new SpeechSynthesisUtterance(processedWord);
        u.lang = 'en-US';
        u.rate = 0.9;
        u.pitch = 1;
        speechSynthesis.speak(u);
    }

    getFontSizeClass(text: string | undefined | null): string {
        const len = text?.length ?? 0;
        
        if (len <= 20) return 'text-3xl md:text-4xl';
        if (len <= 40) return 'text-2xl md:text-3xl';
        if (len <= 60) return 'text-xl md:text-2xl';
        if (len <= 90) return 'text-lg md:text-xl';
        if (len <= 130) return 'text-base md:text-lg';
        return 'text-sm md:text-base';
    }
}