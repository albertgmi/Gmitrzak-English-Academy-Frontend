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
import { MessageService } from 'primeng/api';
import { LessonService, ListeningReportDto } from '../../services/lesson.service';
import { LessonContextService } from '../../services/lesson-context.service';

@Component({
    selector: 'app-report-listening',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule,
        SelectModule, InputNumberModule, TableModule, TagModule, ToastModule],
    providers: [MessageService],
    templateUrl: './report-listening.component.html'
})
export class ReportListeningComponent implements OnInit {
    private lessonService = inject(LessonService);
    private lessonContext = inject(LessonContextService);
    private router = inject(Router);
    private messageService = inject(MessageService);

    activeStudent = this.lessonContext.activeStudent;
    reports = signal<ListeningReportDto[]>([]);
    loading = signal(true);
    saving = signal(false);
    submitted = false;

    title = signal('');
    mediaType = signal('Movie');
    episodeCount = signal(1);

    mediaTypes = [
        { label: 'Movie',    value: 'Movie' },
        { label: 'YouTube',  value: 'YouTube' },
        { label: 'Podcast',  value: 'Podcast' },
        { label: 'Video',    value: 'Video' },
        { label: 'Book',     value: 'Book' },
        { label: 'Article',  value: 'Article' },
        { label: 'Other',    value: 'Other' }
    ];

    ngOnInit() {
        const studentId = this.lessonContext.studentId;
        if (!studentId) return;
        this.loadReports(studentId);
    }

    loadReports(studentId: number) {
        this.lessonService.getListeningReports(studentId).subscribe({
            next: (d) => { this.reports.set(d); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    addReport() {
        this.submitted = true;
        const studentId = this.lessonContext.studentId;
        if (!this.title().trim() || !studentId) return;

        this.saving.set(true);
        this.lessonService.addListeningReport(
            studentId, this.title(), this.mediaType(), this.episodeCount()
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Reported',
                    detail: `"${this.title()}" added`, life: 3000
                });
                this.title.set('');
                this.episodeCount.set(1);
                this.submitted = false;
                this.saving.set(false);
                this.loadReports(studentId);
            },
            error: () => this.saving.set(false)
        });
    }

    mediaTypeSeverity(type: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
        const map: Record<string, "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined> = {
            Movie: 'info', YouTube: 'danger', Podcast: 'warn',
            Video: 'info', Book: 'success', Article: 'secondary', Other: 'secondary'
        };
        return map[type] ?? 'info';
    }

    goToSwitchClient() {
        this.router.navigate(['/lesson/switch-client']);
    }
}