import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { StudentService, GradeDto } from '../../services/student-services/student.service';

type SeverityType = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

@Component({
    selector: 'app-grades',
    standalone: true,
    imports: [CommonModule, TableModule, ToastModule, TagModule],
    providers: [MessageService],
    templateUrl: './grades.component.html'
})
export class GradesComponent implements OnInit {
    private studentService = inject(StudentService);
    private messageService = inject(MessageService);

    grades = signal<GradeDto[]>([]);
    loading = signal(true);

    ngOnInit() {
        this.studentService.getGrades().subscribe({
            next: (d) => { this.grades.set(d); this.loading.set(false); },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load grades.' });
                this.loading.set(false);
            }
        });
    }

    gradeSeverity(percentage: number): SeverityType {
        if (percentage >= 80) return 'success';
        if (percentage >= 60) return 'warn';
        return 'danger';
    }
}