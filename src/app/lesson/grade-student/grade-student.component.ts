import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { LessonService, GradeListDto } from '../../services/lesson.service';
import { LessonContextService } from '../../services/lesson-context.service';

@Component({
    selector: 'app-grade-student',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule,
        SelectModule, InputNumberModule, TableModule, TagModule,
        ToastModule, ConfirmDialogModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './grade-student.component.html'
})
export class GradeStudentComponent implements OnInit {
    private lessonService = inject(LessonService);
    private lessonContext = inject(LessonContextService);
    private router = inject(Router);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    activeStudent = this.lessonContext.activeStudent;
    grades = signal<GradeListDto[]>([]);
    loading = signal(true);
    saving = signal(false);
    submitted = false;

    percentage = signal<number>(0);
    category = signal('Vocabulary');
    notes = signal('');

    categories = [
        { label: 'Vocabulary',    value: 'Vocabulary' },
        { label: 'Sentences',     value: 'Sentences' },
        { label: 'Memories',      value: 'Memories' },
        { label: 'Pronunciation', value: 'Pronunciation' }
    ];

    ngOnInit() {
        const studentId = this.lessonContext.studentId;
        if (!studentId) return;
        this.loadGrades(studentId);
    }

    loadGrades(studentId: number) {
        this.lessonService.getGrades(studentId).subscribe({
            next: (d) => { this.grades.set(d); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    addGrade() {
        this.submitted = true;
        const studentId = this.lessonContext.studentId;
        if (!studentId || this.percentage() < 0 || this.percentage() > 100) return;

        this.saving.set(true);
        this.lessonService.addGrade(
            studentId, this.percentage(), this.category(), this.notes() || undefined
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Grade added',
                    detail: `${this.percentage()}% — ${this.category()}`, life: 3000
                });
                this.percentage.set(0);
                this.notes.set('');
                this.submitted = false;
                this.saving.set(false);
                this.loadGrades(studentId);
            },
            error: () => this.saving.set(false)
        });
    }

    confirmRemove(grade: GradeListDto) {
        this.confirmationService.confirm({
            message: `Remove grade ${grade.percentage}% (${grade.category})?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.lessonService.removeGrade(grade.id).subscribe({
                    next: () => {
                        this.grades.update(list => list.filter(g => g.id !== grade.id));
                        this.messageService.add({
                            severity: 'success', summary: 'Removed', life: 3000
                        });
                    }
                });
            }
        });
    }

    gradeSeverity(p: number): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
        if (p >= 80) return 'success';
        if (p >= 60) return 'warn';
        return 'danger';
    }

    goToSwitchClient() {
        this.router.navigate(['/lesson/switch-client']);
    }
}