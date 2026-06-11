import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService, ConfirmationService } from 'primeng/api';
import { LessonContextService } from '../../services/lesson-context.service';
import { SentenceService, AnswerResultDto, CompletedSentenceModuleDto } from '../../services/sentence.service';
import { AvatarComponent } from '../../other/avatar/avatar.component';

@Component({
    selector: 'app-lesson-sentence-answers',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, TagModule,
        ToastModule, ConfirmDialogModule, DialogModule,
        TextareaModule, DatePickerModule, AvatarComponent
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './lesson-sentence-answers.component.html'
})
export class LessonSentenceAnswersComponent implements OnInit {
    private lessonContext   = inject(LessonContextService);
    private sentenceService = inject(SentenceService);
    private messageService  = inject(MessageService);
    private router          = inject(Router);

    activeStudent = this.lessonContext.activeStudent;

    dateFrom = signal<Date | null>(null);
    dateTo   = signal<Date | null>(null);

    completedModules  = signal<CompletedSentenceModuleDto[]>([]);
    loadingModules    = signal(false);

    selectedModule    = signal<CompletedSentenceModuleDto | null>(null);
    answers           = signal<AnswerResultDto[]>([]);
    loadingAnswers    = signal(false);

    overriding   = signal<number | null>(null);
    overrideForm = signal<{ answerId: number; result: string; explanation: string } | null>(null);

    downloadingPdf  = signal(false);
    downloadingDocx = signal(false);

    correctCount  = computed(() =>
        this.answers().filter(a => (a.teacherOverride || a.aiResult) === 'Correct').length);
    partialCount  = computed(() =>
        this.answers().filter(a => (a.teacherOverride || a.aiResult) === 'Partial').length);
    incorrectCount = computed(() =>
        this.answers().filter(a => (a.teacherOverride || a.aiResult) === 'Incorrect').length);

    ngOnInit() {}

    loadModules() {
        const studentId = this.lessonContext.studentId;
        const from      = this.dateFrom();
        const to        = this.dateTo();
        if (!studentId || !from || !to) return;

        this.loadingModules.set(true);
        this.completedModules.set([]);
        this.selectedModule.set(null);
        this.answers.set([]);

        const fromStr = this.toDateStr(from);
        const toStr   = this.toDateStr(to);

        this.sentenceService.getCompletedModules(studentId, fromStr, toStr).subscribe({
            next: (d) => { this.completedModules.set(d); this.loadingModules.set(false); },
            error: () => this.loadingModules.set(false)
        });
    }

    selectModule(m: CompletedSentenceModuleDto) {
        this.selectedModule.set(m);
        this.loadAnswers(m.moduleId);
    }

    loadAnswers(moduleId: number) {
        const studentId = this.lessonContext.studentId;
        if (!studentId) return;
        this.loadingAnswers.set(true);
        this.answers.set([]);
        this.sentenceService.getAnswersForStudent(moduleId, studentId).subscribe({
            next: (d) => { this.answers.set(d); this.loadingAnswers.set(false); },
            error: () => this.loadingAnswers.set(false)
        });
    }

    openOverride(answer: AnswerResultDto) {
        this.overrideForm.set({
            answerId:    answer.id,
            result:      answer.teacherOverride ?? answer.aiResult,
            explanation: answer.teacherExplanation ?? ''
        });
    }

    updateFormResult(r: string) {
        this.overrideForm.update(x => x ? { ...x, result: r } : x);
    }

    updateFormExplanation(v: string) {
        this.overrideForm.update(x => x ? { ...x, explanation: v } : x);
    }

    saveOverride() {
        const form = this.overrideForm();
        if (!form) return;
        this.overriding.set(form.answerId);
        this.sentenceService.overrideAnswer(form.answerId, form.result, form.explanation)
            .subscribe({
                next: () => {
                    this.answers.update(list =>
                        list.map(a => a.id === form.answerId
                            ? { ...a, teacherOverride: form.result,
                                teacherExplanation: form.explanation,
                                teacherReviewed: true, aiResult: form.result }
                            : a)
                    );
                    this.messageService.add({
                        severity: 'success', summary: 'Saved', life: 3000 });
                    this.overrideForm.set(null);
                    this.overriding.set(null);
                },
                error: () => this.overriding.set(null)
            });
    }

    downloadRangePdf() {
        const studentId = this.lessonContext.studentId;
        const from = this.dateFrom();
        const to   = this.dateTo();
        if (!studentId || !from || !to) return;

        this.downloadingPdf.set(true);
        this.sentenceService.downloadRangeReportPdf(
            studentId, this.toDateStr(from), this.toDateStr(to)
        ).subscribe({
            next: (blob) => {
                this.triggerDownload(blob,
                    `report_${this.toDateStr(from)}_${this.toDateStr(to)}.pdf`);
                this.downloadingPdf.set(false);
            },
            error: () => this.downloadingPdf.set(false)
        });
    }

    downloadRangeDocx() {
        const studentId = this.lessonContext.studentId;
        const from = this.dateFrom();
        const to   = this.dateTo();
        if (!studentId || !from || !to) return;

        this.downloadingDocx.set(true);
        this.sentenceService.downloadRangeReportDocx(
            studentId, this.toDateStr(from), this.toDateStr(to)
        ).subscribe({
            next: (blob) => {
                this.triggerDownload(blob,
                    `report_${this.toDateStr(from)}_${this.toDateStr(to)}.docx`);
                this.downloadingDocx.set(false);
            },
            error: () => this.downloadingDocx.set(false)
        });
    }

    resultSeverity(result: string): 'success' | 'warn' | 'danger' {
        if (result === 'Correct') return 'success';
        if (result === 'Partial') return 'warn';
        return 'danger';
    }

    goToSwitchClient() { this.router.navigate(['/lesson/switch-client']); }

    private toDateStr(d: Date): string {
        return d.toLocaleDateString('sv-SE');
    }

    private triggerDownload(blob: Blob, filename: string) {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href    = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
}