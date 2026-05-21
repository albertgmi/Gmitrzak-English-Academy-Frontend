import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import {
    SentenceService,
    ModuleSentenceSessionDto,
    ModuleSentenceItemDto,
    AnswerResultDto
} from '../../services/sentence.service';
import confetti from 'canvas-confetti';

interface SentenceState extends ModuleSentenceItemDto {
    userAnswer: string;
    result: AnswerResultDto | null;
    loading: boolean;
    isRestored: boolean;
}

type SeverityType = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

@Component({
    selector: 'app-sentence-task',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule, ButtonModule,
        TextareaModule, TagModule, ToastModule
    ],
    providers: [MessageService],
    templateUrl: './sentence-task.component.html',
    styleUrls: ['./sentence-task.component.scss']
})
export class SentenceTaskComponent implements OnInit {
    private route           = inject(ActivatedRoute);
    private sentenceService = inject(SentenceService);
    private messageService  = inject(MessageService);

    session       = signal<ModuleSentenceSessionDto | null>(null);
    sentences     = signal<SentenceState[]>([]);
    loading       = signal(true);
    currentIndex = signal(0);
    isFinished   = signal(false);

    correctCount  = computed(() =>
        this.sentences().filter(s => s.result?.aiResult === 'Correct').length);
    partialCount  = computed(() =>
        this.sentences().filter(s => s.result?.aiResult === 'Partial').length);
    incorrectCount = computed(() =>
        this.sentences().filter(s => s.result?.aiResult === 'Incorrect').length);

    current = computed(() => this.sentences()[this.currentIndex()] ?? null);

    progress = computed(() => {
        const total = this.sentences().length;
        if (!total) return 0;
        const done = this.sentences().filter(s => s.result !== null).length;
        return Math.round((done / total) * 100);
    });

    answeredCount = computed(() =>
        this.sentences().filter(s => s.result !== null).length
    );

    ngOnInit() {
        const moduleId = Number(this.route.snapshot.paramMap.get('moduleId'));

        this.sentenceService.getModuleSentences(moduleId).subscribe({
            next: (session) => {
                this.session.set(session);
                this.sentences.set(session.sentences.map(s => {
                    const isRestored = !!s.previousResult;
                    const restoredResult: AnswerResultDto | null = isRestored ? {
                        id:                s.previousAnswerId ?? 0,
                        polish:              s.polish,
                        expectedTranslation: '',
                        userAnswer:          s.previousAnswer ?? '',
                        aiResult:            s.previousResult ?? '',
                        aiExplanation:       s.previousExplanation ?? '',
                        teacherReviewed:     false
                    } : null;

                    return {
                        ...s,
                        userAnswer: s.previousAnswer ?? '',
                        result:     restoredResult,
                        loading:    false,
                        isRestored
                    };
                }));
                this.loading.set(false);

                const firstUnanswered = this.sentences()
                    .findIndex(s => !s.result);
                this.currentIndex.set(
                    firstUnanswered !== -1 ? firstUnanswered : 0
                );

                if (session.sentences.length === 0 ||
                    this.sentences().every(s => s.result !== null)) {
                    this.isFinished.set(true);
                }
            },
            error: () => this.loading.set(false)
        });
    }

    handleTextAreaKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.submit();
        }
    }

    submit() {
        const s       = this.current();
        const session = this.session();
        const idx     = this.currentIndex();
        if (!s || !s.userAnswer.trim() || !session || s.loading) return;

        this.sentences.update(list =>
            list.map((x, i) => i === idx ? { ...x, loading: true } : x)
        );

        this.sentenceService.submitAnswer(
            session.moduleId,
            s.sentenceStockId,
            s.userAnswer
        ).subscribe({
            next: (result) => {
                this.sentences.update(list =>
                    list.map((x, i) => i === idx
                        ? { ...x, result, loading: false, isRestored: false } : x)
                );
                const allDone = this.sentences().every(s => s.result !== null);
                if (allDone) {
                    setTimeout(() => {
                        this.isFinished.set(true);
                        this.triggerConfetti();
                    }, 600);
                }
            },
            error: () => {
                this.sentences.update(list =>
                    list.map((x, i) => i === idx ? { ...x, loading: false } : x)
                );
                this.messageService.add({
                    severity: 'error', summary: 'Error',
                    detail: 'Could not check answer', life: 3000
                });
            }
        });
    }

    next() {
        if (this.currentIndex() < this.sentences().length - 1) {
            this.currentIndex.update(n => n + 1);
        }
    }

    prev() {
        if (this.currentIndex() > 0) {
            this.currentIndex.update(n => n - 1);
        }
    }

    resultSeverity(result: string): SeverityType {
        if (result === 'Correct')  return 'success';
        if (result === 'Partial')  return 'warn';
        return 'danger';
    }

    finalResult(s: SentenceState): string {
        return s.result?.teacherOverride ?? s.result?.aiResult ?? '';
    }

    private triggerConfetti() {
        const duration    = 3000;
        const animEnd     = Date.now() + duration;
        const scalar      = 3;
        const star        = (confetti as any).shapeFromText({ text: '⭐', scalar });
        const check       = (confetti as any).shapeFromText({ text: '✅', scalar });
        const rand        = (a: number, b: number) => Math.random() * (b - a) + a;
        const defaults    = { spread: 360, ticks: 70, gravity: 0.8,
            startVelocity: 30, shapes: [star, check], scalar };

        const interval = setInterval(() => {
            const timeLeft = animEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const count = 20 * (timeLeft / duration);
            confetti({ ...defaults, particleCount: count,
                origin: { x: rand(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount: count,
                origin: { x: rand(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    }
}