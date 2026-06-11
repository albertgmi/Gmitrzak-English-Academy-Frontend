import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LessonPanelService, LessonGradeDto } from '../../services/lesson-panel.service';
import { LessonContextService } from '../../services/lesson-context.service';
import { ButtonModule } from 'primeng/button';
import { AvatarComponent } from '../../other/avatar/avatar.component';

type SeverityType = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

@Component({
    selector: 'app-lesson-grades',
    standalone: true,
    imports: [CommonModule, TableModule, TagModule, ToastModule, ButtonModule, AvatarComponent],
    providers: [MessageService],
    templateUrl: './lesson-grades.component.html'
})
export class LessonGradesComponent implements OnInit {
    private service = inject(LessonPanelService);
    private lessonContext = inject(LessonContextService);
    private router = inject(Router);

    activeStudent = this.lessonContext.activeStudent;
    grades = signal<LessonGradeDto[]>([]);
    loading = signal(true);

    ngOnInit() {
        const id = this.lessonContext.studentId;
        if (!id) return;
        this.service.getGrades(id).subscribe({
            next: (d) => { this.grades.set(d); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    gradeSeverity(p: number): SeverityType {
        if (p >= 80) return 'success';
        if (p >= 60) return 'warn';
        return 'danger';
    }

    goToSwitchClient() { this.router.navigate(['/lesson/switch-client']); }
}