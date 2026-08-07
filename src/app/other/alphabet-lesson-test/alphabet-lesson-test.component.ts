import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LessonService, AlphabetTestItemDto, AlphabetAttemptDto } from '../../services/lesson.service';
import { LessonContextService } from '../../services/lesson-context.service';
import { AvatarComponent } from '../../other/avatar/avatar.component';

@Component({
    selector: 'app-alphabet-lesson-test',
    standalone: true,
    imports: [CommonModule, ButtonModule, TagModule, ToastModule, AvatarComponent],
    providers: [MessageService],
    templateUrl: './alphabet-lesson-test.component.html'
})
export class AlphabetLessonTestComponent implements OnInit {
    private lessonService = inject(LessonService);
    private lessonContext = inject(LessonContextService);
    private router = inject(Router);
    private messageService = inject(MessageService);

    activeStudent = this.lessonContext.activeStudent;
    entries = signal<AlphabetTestItemDto[]>([]);
    loading = signal(true);
    markingId = signal<number | null>(null);
    expandedId = signal<number | null>(null);
    attemptsCache = signal<Record<number, AlphabetAttemptDto[]>>({});
    attemptsLoading = signal<Record<number, boolean>>({});

    letterEntries = computed(() => this.entries().filter(e => e.type === 'Letters'));
    spellingEntries = computed(() => this.entries().filter(e => e.type === 'Abbreviation'));
    remaining = computed(() => this.entries().filter(e => e.status !== 'Correct').length);

    ngOnInit() {
        const studentId = this.lessonContext.studentId;
        if (!studentId) return;
        this.load(studentId);
    }

    load(studentId: number) {
        this.loading.set(true);
        this.lessonService.getAlphabetTest(studentId).subscribe({
            next: (d) => { this.entries.set(d); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    toggleExpand(entryId: number) {
        if (this.expandedId() === entryId) {
            this.expandedId.set(null);
            return;
        }
        this.expandedId.set(entryId);
        if (!this.attemptsCache()[entryId]) {
            this.attemptsLoading.update(s => ({ ...s, [entryId]: true }));
            this.lessonService.getAlphabetEntryAttempts(entryId).subscribe({
                next: (attempts) => {
                    this.attemptsCache.update(s => ({ ...s, [entryId]: attempts }));
                    this.attemptsLoading.update(s => ({ ...s, [entryId]: false }));
                },
                error: () => this.attemptsLoading.update(s => ({ ...s, [entryId]: false }))
            });
        }
    }

    getAttempts(entryId: number): AlphabetAttemptDto[] {
        return this.attemptsCache()[entryId] ?? [];
    }

    isAttemptsLoading(entryId: number): boolean {
        return this.attemptsLoading()[entryId] ?? false;
    }

    problemLetterList(problemLetters: string): string[] {
        return problemLetters ? problemLetters.split(',').filter(Boolean) : [];
    }

    mark(entry: AlphabetTestItemDto, result: 'correct' | 'incorrect') {
        this.markingId.set(entry.id);
        this.lessonService.markAlphabetResult(entry.id, result).subscribe({
            next: () => {
                this.entries.update(list =>
                    list.map(e => e.id === entry.id
                        ? { ...e, status: result === 'correct' ? 'Correct' : 'Incorrect' } : e)
                );
                this.markingId.set(null);
            },
            error: () => {
                this.markingId.set(null);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update', life: 3000 });
            }
        });
    }

    goToSwitchClient() {
        this.router.navigate(['/lesson/switch-client']);
    }
}