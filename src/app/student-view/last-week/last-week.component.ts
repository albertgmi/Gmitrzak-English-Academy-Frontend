import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { StudentService, LastWeekDto } from '../../services/student-services/student.service';

@Component({
    selector: 'app-last-week',
    standalone: true,
    imports: [CommonModule, ToastModule, TagModule, ProgressBarModule, TableModule],
    providers: [MessageService],
    templateUrl: './last-week.component.html'
})
export class LastWeekComponent implements OnInit {
    private studentService = inject(StudentService);
    private messageService = inject(MessageService);

    data = signal<LastWeekDto | null>(null);
    loading = signal(true);

    ngOnInit() {
        this.studentService.getLastWeek().subscribe({
            next: (d) => { this.data.set(d); this.loading.set(false); },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load data.' });
                this.loading.set(false);
            }
        });
    }

    formatTime(seconds: number): string {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    }
}