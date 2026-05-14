import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { StudentService, ActivityPointsHistoryDto } from '../../services/student-services/student.service';

@Component({
    selector: 'app-activity-points',
    standalone: true,
    imports: [CommonModule, TableModule, ToastModule],
    providers: [MessageService],
    templateUrl: './activity-points.component.html'
})
export class ActivityPointsComponent implements OnInit {
    private studentService = inject(StudentService);
    private messageService = inject(MessageService);

    data = signal<ActivityPointsHistoryDto | null>(null);
    loading = signal(true);

    ngOnInit() {
        this.studentService.getActivityPoints().subscribe({
            next: (d) => { this.data.set(d); this.loading.set(false); },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load data.' });
                this.loading.set(false);
            }
        });
    }
}