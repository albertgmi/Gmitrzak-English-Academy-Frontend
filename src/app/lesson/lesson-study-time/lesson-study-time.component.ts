import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LessonPanelService, StudentStudyTimeDto } from '../../services/lesson-panel.service';
import { LessonContextService } from '../../services/lesson-context.service';
import { ButtonModule } from 'primeng/button';
import { AvatarComponent } from '../../other/avatar/avatar.component';

@Component({
    selector: 'app-lesson-study-time',
    standalone: true,
    imports: [CommonModule, TableModule, ChartModule, ToastModule, ButtonModule, AvatarComponent],
    providers: [MessageService],
    templateUrl: './lesson-study-time.component.html'
})
export class LessonStudyTimeComponent implements OnInit {
    private service = inject(LessonPanelService);
    private lessonContext = inject(LessonContextService);
    private router = inject(Router);

    activeStudent = this.lessonContext.activeStudent;
    data = signal<StudentStudyTimeDto | null>(null);
    loading = signal(true);

    ngOnInit() {
        const id = this.lessonContext.studentId;
        if (!id) return;
        this.service.getStudyTime(id).subscribe({
            next: (d) => { this.data.set(d); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    get chartData() {
        const d = this.data();
        if (!d?.dailyBreakdown.length) return null;
        return {
            labels: d.dailyBreakdown.map(x => x.studyDate),
            datasets: [{
                label: 'Cards done',
                data: d.dailyBreakdown.map(x => x.flashcardsDone),
                backgroundColor: '#6366f1',
                borderRadius: 4
            }]
        };
    }

    get chartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true }
            }
        };
    }

    formatTime(seconds: number): string {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    }

    goToSwitchClient() { this.router.navigate(['/lesson/switch-client']); }
}