import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import { FlashcardService, FlashcardDto } from '../../services/student-services/flashcard.service';

interface SessionCard extends FlashcardDto {
    incorrectStep: number;
    availableAt: number;
}

@Component({
    selector: 'app-flashcard-study-mode',
    standalone: true,
    imports: [CommonModule, ButtonModule, TagModule, RouterModule],
    templateUrl: './flashcard-study-mode.component.html',
    styleUrls: ['./flashcard-study-mode.component.scss']
})
export class FlashcardStudyModeComponent implements OnInit {
    private flashcardService = inject(FlashcardService);
    private destroyRef = inject(DestroyRef);

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
                text: '1 Day Streak - Great start!',
                bgClass: 'bg-amber-500/10 dark:bg-amber-500/20',
                borderClass: 'border-amber-500/30',
                textClass: 'text-amber-600 dark:text-amber-400',
                iconClass: 'text-amber-500'
            };
        }
        if (s < 7) {
            return {
                icon: 'pi-bolt',
                text: `${s} Day Streak - Keep it up!`,
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
                text: `${s} Day Streak - On fire!`,
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

    private cardStartTime: number = 0; 
    private activeTimeout: any = null;

    private readonly INCORRECT_DELAYS_MS = [
        3  * 60 * 1000,
        6  * 60 * 1000,
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
        const step = Math.min(card.incorrectStep, this.INCORRECT_DELAYS_MS.length - 1);
        return `${this.INCORRECT_DELAYS_MS[step] / 60000} min`;
    });

    totalInSession = computed(() => {
        return this.queue().length + this.pendingQueue().length + (this.currentCard() ? 1 : 0);
    });

    activeCategoryPriority = computed(() => this.flashcardService.categoryPriorityOrder());
    activeCategoryPrioritySummary = computed(() => this.flashcardService.categoryPriorityOrder().join(' > '));

    ngOnInit() {
        this.flashcardService.flashcards.reload();

        this.flashcardService.getStreak().subscribe({
            next: (res) => {
                this.streak.set(res.streak);
                this.studiedToday.set(res.studiedToday);
            },
            error: (err) => console.error('Failed to load streak:', err)
        });

        const interval = setInterval(() => {
            const cards = this.flashcardService.flashcards.value();
            if (cards !== undefined) {
                clearInterval(interval);
                this.initializeSession(cards);
                this.loading.set(false);
            }
        }, 100);
    }

    private readonly STORAGE_KEY = 'flashcards_pending_queue';

    private savePendingQueue(cards: SessionCard[]) {
        try {
            if (cards.length === 0) {
                sessionStorage.removeItem(this.STORAGE_KEY);
            } else {
                const data = cards.map(c => ({
                    id: c.id,
                    incorrectStep: c.incorrectStep,
                    availableAt: c.availableAt
                }));
                sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            }
        } catch (e) {
            console.error('Failed to save pending queue to sessionStorage:', e);
        }
    }

    private initializeSession(allCards: FlashcardDto[]) {
        const today = new Intl.DateTimeFormat('sv-SE').format(new Date());
        const now = Date.now();

        let storedPendingMap = new Map<number, { incorrectStep: number; availableAt: number }>();
        try {
            const raw = sessionStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                const parsed: { id: number; incorrectStep: number; availableAt: number }[] = JSON.parse(raw);
                parsed.forEach(item => {
                    if (item.availableAt > now) {
                        storedPendingMap.set(item.id, { incorrectStep: item.incorrectStep, availableAt: item.availableAt });
                    }
                });
            }
        } catch (e) {
            console.error('Failed to restore pending queue:', e);
        }

        let restoredPending: SessionCard[] = [];
        let toReview: SessionCard[] = [];

        for (const c of allCards) {
            if (c.nextReviewDate <= today) {
                const pendingInfo = storedPendingMap.get(c.id);
                if (pendingInfo) {
                    restoredPending.push({
                        ...c,
                        incorrectStep: pendingInfo.incorrectStep,
                        availableAt: pendingInfo.availableAt
                    });
                } else {
                    toReview.push({
                        ...c,
                        incorrectStep: 0,
                        availableAt: 0
                    });
                }
            }
        }

        this.savePendingQueue(restoredPending);

        const priorityOrder = this.flashcardService.categoryPriorityOrder();
        if (priorityOrder.length > 0) {
            toReview.sort((a, b) => {
                const catA = a.category ?? '';
                const catB = b.category ?? '';

                const idxA = priorityOrder.indexOf(catA);
                const idxB = priorityOrder.indexOf(catB);

                const pA = idxA !== -1 ? idxA : 999;
                const pB = idxB !== -1 ? idxB : 999;

                return pA - pB;
            });
        }

        this.pendingQueue.set(restoredPending);

        if (toReview.length > 0 || restoredPending.length > 0) {
            this.queue.set(toReview);
            this.isFinished.set(false);
            this.nextCard();
        } else {
            this.queue.set([]);
            this.currentCard.set(null);
            this.isFinished.set(true);
        }
    }

    nextCard() {
        if (this.activeTimeout) clearTimeout(this.activeTimeout);
        this.showBack.set(false);
        const now = Date.now();

        const ready = this.pendingQueue().filter(c => c.availableAt <= now);
        const stillWaiting = this.pendingQueue().filter(c => c.availableAt > now);

        if (ready.length > 0) {
            this.pendingQueue.set(stillWaiting);
            this.savePendingQueue(stillWaiting);
            this.queue.update(q => [...ready, ...q]);
        }

        const current = this.queue();

        if (current.length > 0) {
            this.currentCard.set(current[0]);
            this.queue.set(current.slice(1));
            
            this.cardStartTime = Date.now(); 

        } else if (stillWaiting.length > 0) {
            this.currentCard.set(null);
            const nextAvailableAt = Math.min(...stillWaiting.map(c => c.availableAt));
            const delay = Math.max(nextAvailableAt - now, 1000);
            this.activeTimeout = setTimeout(() => this.nextCard(), delay);
        } else {
            this.currentCard.set(null);
            this.isFinished.set(true);
            this.savePendingQueue([]);
        }
    }

    handleReview(type: 'again_1m' | 'incorrect' | 'hard' | 'easy') {
        const card = this.currentCard();
        if (!card) return;

        if (!this.studiedToday()) {
            this.studiedToday.set(true);
            this.streak.update(s => s + 1);
        }

        const duration = Math.round((Date.now() - this.cardStartTime) / 1000);
        const timeSpentSeconds = Math.min(duration, 60); 

        if (type === 'again_1m') {
            const updatedCard: SessionCard = {
                ...card,
                availableAt: Date.now() + (60 * 1000)
            };
            this.pendingQueue.update(q => {
                const nextQ = [...q, updatedCard];
                this.savePendingQueue(nextQ);
                return nextQ;
            });
        } else if (type === 'incorrect') {
            const step = Math.min(card.incorrectStep, this.INCORRECT_DELAYS_MS.length - 1);
            const delayMs = this.INCORRECT_DELAYS_MS[step];
            const updatedCard: SessionCard = {
                ...card,
                incorrectStep: card.incorrectStep + 1,
                availableAt: Date.now() + delayMs
            };
            this.pendingQueue.update(q => {
                const nextQ = [...q, updatedCard];
                this.savePendingQueue(nextQ);
                return nextQ;
            });
        }

        const backendType = type === 'again_1m' ? 'incorrect' : type;

        this.flashcardService.reviewCard(card.id, backendType, timeSpentSeconds)
            .pipe(
                take(1),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe({
                error: (err) => console.error('Failed to save review:', err)
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
        if (!text) return 'text-xl sm:text-3xl md:text-4xl';
        const len = text.length;
        const words = text.trim().split(/\s+/);
        const maxWordLen = Math.max(...words.map(w => w.length), 0);

        if (maxWordLen >= 13) {
            return 'text-base sm:text-2xl md:text-3xl lg:text-4xl';
        }
        if (maxWordLen >= 8) {
            return 'text-lg sm:text-3xl md:text-4xl lg:text-5xl';
        }

        if (len <= 15) return 'text-xl sm:text-3xl md:text-4xl lg:text-5xl';
        if (len <= 30) return 'text-lg sm:text-2xl md:text-3xl lg:text-4xl';
        if (len <= 50) return 'text-base sm:text-xl md:text-2xl lg:text-3xl';
        if (len <= 80) return 'text-sm sm:text-lg md:text-xl lg:text-2xl';
        if (len <= 120) return 'text-xs sm:text-base md:text-lg';
        return 'text-xs sm:text-sm md:text-base';
    }
}