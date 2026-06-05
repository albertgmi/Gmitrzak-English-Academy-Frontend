import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { LessonContextService } from '../../services/lesson-context.service';
import { ExaminationService, ExaminationDto } from '../../services/examination.service';
import { AvatarComponent } from '../../other/avatar/avatar.component';

type ExamTab = 'flashcards' | 'sentences' | 'memories';

@Component({
    selector: 'app-examination-mode',
    standalone: true,
    imports: [
        CommonModule, ButtonModule, TagModule,
        ToastModule, TooltipModule, AvatarComponent
    ],
    providers: [MessageService],
    templateUrl: './examination-mode.component.html'
})
export class ExaminationModeComponent implements OnInit {
    private lessonContext     = inject(LessonContextService);
    private examinationService = inject(ExaminationService);
    private messageService    = inject(MessageService);
    private router            = inject(Router);

    activeStudent = this.lessonContext.activeStudent;
    activeTab     = signal<ExamTab>('flashcards');
    loading       = signal(false);
    examination   = signal<ExaminationDto | null>(null);

    flashcards = computed(() => this.examination()?.flashcards ?? []);
    sentences  = computed(() => this.examination()?.sentences ?? []);
    memories   = computed(() => this.examination()?.memories ?? []);

    ngOnInit() {
        const studentId = this.lessonContext.studentId;
        if (!studentId) return;
        
        this.loadExamination();
    }

    loadExamination() {
        const studentId = this.lessonContext.studentId;
        if (!studentId) return;

        this.loading.set(true);

        this.examinationService.getExamination(studentId).subscribe({
            next: (data) => {
                this.examination.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error', summary: 'Error',
                    detail: 'Could not load examination data.', life: 3000
                });
                this.loading.set(false);
            }
        });
    }

    intervalLabel(interval: number): string {
        if (interval === 0) return 'New';
        if (interval === 1) return '1 day';
        return `${interval} days`;
    }

    easeLabel(easeFactor: number): string {
        if (easeFactor >= 250) return 'Easy';
        if (easeFactor >= 180) return 'Medium';
        return 'Hard';
    }

    easeSeverity(easeFactor: number): "success" | "info" | "warn" | "danger" | undefined {
        if (easeFactor >= 250) return 'success';
        if (easeFactor >= 180) return 'warn';
        return 'danger';
    }

    goToSwitchClient() {
        this.router.navigate(['/lesson/switch-client']);
    }
}