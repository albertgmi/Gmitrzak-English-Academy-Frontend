import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LessonService, PronunciationTestItemDto } from '../services/lesson.service';
import { LessonContextService } from '../services/lesson-context.service';

@Component({
    selector: 'app-pronunciation-test',
    standalone: true,
    imports: [CommonModule, ButtonModule, ToastModule],
    providers: [MessageService],
    templateUrl: './pronunciation-test.component.html'
})
export class PronunciationTestComponent implements OnInit {
    private lessonService = inject(LessonService);
    private lessonContext = inject(LessonContextService);
    private router = inject(Router);
    private messageService = inject(MessageService);

    activeStudent = this.lessonContext.activeStudent;
    entries = signal<PronunciationTestItemDto[]>([]);
    loading = signal(true);

    unchecked = computed(() => this.entries().filter(e => !e.isChecked));
    checked   = computed(() => this.entries().filter(e => e.isChecked));

    ngOnInit() {
        const studentId = this.lessonContext.studentId;
        if (!studentId) return;
        this.load(studentId);
    }

    load(studentId: number) {
        this.lessonService.getPronunciationTest(studentId).subscribe({
            next: (d) => { this.entries.set(d); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    markCorrect(entry: PronunciationTestItemDto) {
        this.lessonService.checkWord(entry.id).subscribe({
            next: () => {
                // remove from list — odhaczone znikają
                this.entries.update(list => list.filter(e => e.id !== entry.id));
            },
            error: () => this.messageService.add({
                severity: 'error', summary: 'Error', detail: 'Failed to update', life: 3000
            })
        });
    }

    markIncorrect(entry: PronunciationTestItemDto) {
        // incorrect — idzie na górę listy
        this.entries.update(list => {
            const rest = list.filter(e => e.id !== entry.id);
            return [entry, ...rest];
        });
    }

    goToSwitchClient() {
        this.router.navigate(['/lesson/switch-client']);
    }
}