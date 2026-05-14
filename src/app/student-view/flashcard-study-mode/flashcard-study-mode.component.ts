import { Component, inject, signal, computed, effect, OnInit, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { RouterModule } from '@angular/router';
import { FlashcardService, FlashcardDto } from '../../services/student-services/flashcard.service';

interface SessionCard extends FlashcardDto {
  incorrectStep: number;
}

@Component({
  selector: 'app-flashcard-study-mode',
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule, CardModule, RouterModule],
  templateUrl: './flashcard-study-mode.component.html',
  styleUrls: ['./flashcard-study-mode.component.scss']
})
export class FlashcardStudyModeComponent implements OnInit {
  private flashcardService = inject(FlashcardService);
  
  queue = signal<SessionCard[]>([]);
  currentCard = signal<SessionCard | null>(null);
  showBack = signal(false);
  isFinished = signal(false);

  // Zabezpieczenie przed wielokrotnym resetem sesji (oraz infinite-loop)
  private sessionInitialized = false;

  private readonly INCORRECT_STEPS = [3, 6, 10, 15];

  nextEasyInterval = computed(() => {
    const card = this.currentCard();
    if (!card) return 2;
    return (card.interval ?? 0) === 0 ? 2 : card.interval * 2;
  });

  currentIncorrectLabel = computed(() => {
    const card = this.currentCard();
    if (!card) return '3 min';
    const step = Math.min(card.incorrectStep, this.INCORRECT_STEPS.length - 1);
    return `${this.INCORRECT_STEPS[step]} min`;
  });

  constructor() {
    effect(() => {
      // Ten sygnał JEST śledzony przez effect
      const allFlashcards = this.flashcardService.flashcards.value();
      
      if (allFlashcards && !this.sessionInitialized) {
        // untracked odcina śledzenie wszystkich sygnałów wewnątrz funkcji.
        // Dzięki temu odczyt this.queue() w nextCard() NIE zapętli aplikacji.
        untracked(() => {
          this.sessionInitialized = true;
          this.initializeSession(allFlashcards);
        });
      }
    });
  }

  ngOnInit() {
    this.flashcardService.flashcards.reload();
  }

  private initializeSession(allCards: FlashcardDto[]) {
    const today = new Date().toISOString().split('T')[0];
    
    const toReview: SessionCard[] = allCards
      .filter(c => c.nextReviewDate <= today)
      .map(c => ({ ...c, incorrectStep: 0 }));

    if (toReview.length > 0) {
      this.queue.set(toReview);
      this.nextCard();
    } else {
      this.isFinished.set(true);
    }
  }

  nextCard() {
    this.showBack.set(false);
    const currentQueue = this.queue(); 
    
    if (currentQueue.length > 0) {
      this.currentCard.set(currentQueue[0]);
      this.queue.set(currentQueue.slice(1));
    } else {
      this.currentCard.set(null);
      this.isFinished.set(true);
    }
  }

  handleReview(type: 'incorrect' | 'hard' | 'easy') {
    const card = this.currentCard();
    if (!card) return;

    if (type === 'incorrect') {
      const updatedCard = { ...card, incorrectStep: card.incorrectStep + 1 };
      this.queue.update(q => [...q, updatedCard]);
    }

    this.flashcardService.reviewCard(card.id, type).subscribe({
      error: (err) => console.error('Failed to save review:', err)
    });

    this.nextCard();
  }

  toggleCard() {
    this.showBack.set(!this.showBack());
  }
}