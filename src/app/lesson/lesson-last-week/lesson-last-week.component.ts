import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LessonPanelService, LessonLastWeekDto } from '../../services/lesson-panel.service';
import { LessonContextService } from '../../services/lesson-context.service';
import { ButtonModule } from 'primeng/button';
import { AvatarComponent } from "../../other/avatar/avatar.component";

type SeverityType = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

@Component({
    selector: 'app-lesson-last-week',
    standalone: true,
    imports: [CommonModule, TableModule, TagModule, ToastModule, ButtonModule, AvatarComponent],
    providers: [MessageService],
    templateUrl: './lesson-last-week.component.html'
})
export class LessonLastWeekComponent implements OnInit {
    private service = inject(LessonPanelService);
    private lessonContext = inject(LessonContextService);
    private router = inject(Router);

    activeStudent = this.lessonContext.activeStudent;
    data = signal<LessonLastWeekDto | null>(null);
    loading = signal(true);

    ngOnInit() {
        const id = this.lessonContext.studentId;
        if (!id) return;
        this.service.getLastWeek(id).subscribe({
            next: (d) => { this.data.set(d); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    formatTime(seconds: number): string {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    }

    gradeSeverity(p: number): SeverityType {
        if (p >= 80) return 'success';
        if (p >= 60) return 'warn';
        return 'danger';
    }

    goToSwitchClient() { this.router.navigate(['/lesson/switch-client']); }
}