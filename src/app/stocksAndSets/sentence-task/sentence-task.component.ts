import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import {SentenceService, ModuleSentenceSessionDto, ModuleSentenceItemDto, AnswerResultDto} from '../../services/sentence.service';

interface SentenceState extends ModuleSentenceItemDto {
    userAnswer: string;
    result: AnswerResultDto | null;
    loading: boolean;
    submitted: boolean;
}

type SeverityType = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

@Component({
    selector: 'app-sentence-task',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule, ButtonModule,
        InputTextModule, TextareaModule, TagModule, ToastModule,
        TooltipModule
    ],
    providers: [MessageService],
    templateUrl: './sentence-task.component.html',
    styleUrls: ['./sentence-task.component.scss']
})
export class SentenceTaskComponent implements OnInit {
    private route          = inject(ActivatedRoute);
    private sentenceService = inject(SentenceService);
    private messageService  = inject(MessageService);

    session  = signal<ModuleSentenceSessionDto | null>(null);
    sentences = signal<SentenceState[]>([]);
    loading  = signal(true);
    isFinished = signal(false);

    currentIndex = signal(0);

    current = computed(() => this.sentences()[this.currentIndex()] ?? null);

    progress = computed(() => {
        const total = this.sentences().length;
        if (!total) return 0;
        const done = this.sentences().filter(s => s.result !== null).length;
        return Math.round((done / total) * 100);
    });

    ngOnInit() {
        const moduleId = Number(this.route.snapshot.paramMap.get('moduleId'));
        this.sentenceService.getModuleSentences(moduleId).subscribe({
            next: (session) => {
                this.session.set(session);
                this.sentences.set(session.sentences.map(s => ({
                    ...s,
                    userAnswer: '',
                    result: null,
                    loading: false,
                    submitted: false
                })));
                this.loading.set(false);

                if (!session.sentences.length) {
                    this.isFinished.set(true);
                }
            },
            error: () => this.loading.set(false)
        });
    }

    handleEnter(event: Event): void {
        const keyboardEvent = event as KeyboardEvent;
        if (keyboardEvent.shiftKey) {
            return;
        }
        keyboardEvent.preventDefault();
        this.submit();
    }

    submit() {
        const s = this.current();
        const session = this.session();
        if (!s || !s.userAnswer.trim() || !session) return;

        this.sentences.update(list =>
            list.map((x, i) => i === this.currentIndex()
                ? { ...x, loading: true, submitted: true } : x)
        );

        this.sentenceService.submitAnswer(
            session.assignmentId,
            s.sentenceStockId,
            s.userAnswer
        ).subscribe({
            next: (result) => {
                this.sentences.update(list =>
                    list.map((x, i) => i === this.currentIndex()
                        ? { ...x, result, loading: false } : x)
                );
            },
            error: () => {
                this.sentences.update(list =>
                    list.map((x, i) => i === this.currentIndex()
                        ? { ...x, loading: false } : x)
                );
                this.messageService.add({
                    severity: 'error', summary: 'Error',
                    detail: 'Could not check answer', life: 3000
                });
            }
        });
    }

    next() {
        const idx = this.currentIndex();
        if (idx < this.sentences().length - 1) {
            this.currentIndex.set(idx + 1);
        } else {
            this.isFinished.set(true);
        }
    }

    prev() {
        const idx = this.currentIndex();
        if (idx > 0) this.currentIndex.set(idx - 1);
    }

    resultSeverity(result: string): SeverityType {
        if (result === 'Correct') return 'success';
        if (result === 'Partial') return 'warn';
        return 'danger';
    }

    resultIcon(result: string): string {
        if (result === 'Correct') return 'pi-check-circle';
        if (result === 'Partial') return 'pi-info-circle';
        return 'pi-times-circle';
    }

    doneCount = computed(() =>
        this.sentences().filter(s => s.result !== null).length
    );
}