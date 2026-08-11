import { Component, inject, signal, computed, OnInit } from '@angular/core';
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
import { AvatarComponent } from '../../other/avatar/avatar.component';
import { PaginatorModule } from 'primeng/paginator';

type SeverityType = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

@Component({
    selector: 'app-report-listening',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule,
        SelectModule, InputNumberModule, TableModule, TagModule, ToastModule, AvatarComponent, PaginatorModule],
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

    rows = 10;
    first = signal(0);

    pagedReports = computed(() => {
        const start = this.first();
        return this.reports().slice(start, start + this.rows);
    });

    mediaTypes = [
        { label: 'Movie',    value: 'Movie' },
        { label: 'YouTube',  value: 'YouTube' },
        { label: 'TV Series', value: 'TV Series' },
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
            next: (d) => { 
                this.reports.set(d); 
                this.first.set(0);
                this.loading.set(false); 
            },
            error: () => this.loading.set(false)
        });
    }

    onPageChange(event: any) {
        this.first.set(event.first);
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

    mediaTypeSeverity(type: string): SeverityType {
        const map: Record<string, SeverityType> = {
            Movie: 'info', 'TV Series': 'info', TvSeries: 'info', YouTube: 'danger', Podcast: 'warn',
            Video: 'info', Book: 'success', Article: 'secondary', Other: 'secondary'
        };
        return map[type] ?? 'info';
    }

    goToSwitchClient() {
        this.router.navigate(['/lesson/switch-client']);
    }
}