import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { MessageService, ConfirmationService } from 'primeng/api';
import { LessonContextService } from '../../services/lesson-context.service';
import { SentenceService, AnswerResultDto } from '../../services/sentence.service';
import { ModuleItemService } from '../../services/module.service';
import { HttpClient } from '@angular/common/http';
import { AvatarComponent } from '../../other/avatar/avatar.component';

@Component({
    selector: 'app-lesson-sentence-answers',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule,
        SelectModule, TagModule, ToastModule, ConfirmDialogModule,
        DialogModule, TextareaModule, AvatarComponent
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './lesson-sentence-answers.component.html'
})
export class LessonSentenceAnswersComponent implements OnInit {
    private lessonContext = inject(LessonContextService);
    private sentenceService = inject(SentenceService);
    private moduleItemService = inject(ModuleItemService);
    private messageService = inject(MessageService);
    private router = inject(Router);
    private http = inject(HttpClient);

    activeStudent = this.lessonContext.activeStudent;
    answers = signal<AnswerResultDto[]>([]);
    loading = signal(false);
    selectedModule = signal<{ id: number; label: string } | null>(null);
    overriding = signal<number | null>(null);
    overrideForm = signal<{ answerId: number; result: string; explanation: string } | null>(null);
    downloadingPdf = signal(false);
    downloadingDocx = signal(false);
    sentenceModules = signal<{ id: number; label: string }[]>([]);

    correctCount = () => this.answers().filter(a => a.aiResult === 'Correct').length;
    partialCount = () => this.answers().filter(a => a.aiResult === 'Partial').length;
    incorrectCount = () => this.answers().filter(a => a.aiResult === 'Incorrect').length;

    async ngOnInit() {
        await this.loadSentenceModules();
    }

    loadAnswers() {
        const studentId = this.lessonContext.studentId;
        const moduleId = this.selectedModule()?.id;
        if (!studentId || !moduleId) return;
        this.loading.set(true);
        this.sentenceService.getAnswersForStudent(moduleId, studentId).subscribe({
            next: (d) => { this.answers.set(d); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    updateFormResult(newResult: string) {
        this.overrideForm.update(x => x ? { ...x, result: newResult } : x);
    }

    updateFormExplanation(value: string) {
        this.overrideForm.update(x => x ? { ...x, explanation: value } : x);
    }

    resultSeverity(result: string): 'success' | 'warn' | 'danger' {
        if (result === 'Correct') return 'success';
        if (result === 'Partial') return 'warn';
        return 'danger';
    }

    goToSwitchClient() {
        this.router.navigate(['/lesson/switch-client']);
    }

    openOverride(answer: AnswerResultDto) {
        this.overrideForm.set({
            answerId: answer.id,
            result: answer.teacherOverride ?? answer.aiResult,
            explanation: answer.teacherExplanation ?? ''
        });
    }

    saveOverride() {
        const form = this.overrideForm();
        if (!form) return;
        this.overriding.set(form.answerId);
        this.sentenceService.overrideAnswer(form.answerId, form.result, form.explanation).subscribe({
            next: () => {
                this.answers.update(list =>
                    list.map(a => a.id === form.answerId
                        ? { ...a, teacherOverride: form.result, teacherExplanation: form.explanation, teacherReviewed: true, aiResult: form.result }
                        : a)
                );
                this.messageService.add({ severity: 'success', summary: 'Saved', life: 3000 });
                this.overrideForm.set(null);
                this.overriding.set(null);
            },
            error: () => this.overriding.set(null)
        });
    }

    downloadPdf() {
        const studentId = this.lessonContext.studentId;
        const moduleId = this.selectedModule()?.id;
        if (!studentId || !moduleId) return;
        this.downloadingPdf.set(true);
        this.sentenceService.downloadReportPdf(moduleId, studentId).subscribe({
            next: (blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `report_module_${moduleId}_student_${studentId}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
                this.downloadingPdf.set(false);
            },
            error: () => this.downloadingPdf.set(false)
        });
    }

    downloadDocx() {
        const studentId = this.lessonContext.studentId;
        const moduleId = this.selectedModule()?.id;
        
        if (!studentId || !moduleId) return;
        
        this.downloadingDocx.set(true);
        
        this.sentenceService.downloadReportDocx(moduleId, studentId).subscribe({
            next: (blob) => {
                const url = URL.createObjectURL(blob);
            
                const a = document.createElement('a');
                a.href = url;
                a.download = `report_module_${moduleId}_student_${studentId}.docx`;
            
                a.click();
            
                URL.revokeObjectURL(url);
            
                this.downloadingDocx.set(false);
            },
            error: () => this.downloadingDocx.set(false)
        });
    }

    private async loadSentenceModules() {
        const studentId = this.lessonContext.studentId;
        if (!studentId) return;

        const mods = await this.moduleItemService.getSentenceModulesForStudent(studentId);

        this.sentenceModules.set(
            mods.map(m => ({
                id: m.id,
                label: m.name
            }))
        );
    }
}