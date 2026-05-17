import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { LessonService, HomeworkItemDto } from '../../services/lesson.service';
import { LessonContextService } from '../../services/lesson-context.service';

type SeverityType = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

@Component({
    selector: 'app-homework-check',
    standalone: true,
    imports: [CommonModule, ButtonModule, TagModule, ToastModule, TooltipModule],
    providers: [MessageService],
    templateUrl: './homework-check.component.html'
})
export class HomeworkCheckComponent implements OnInit {
    private lessonService = inject(LessonService);
    private lessonContext = inject(LessonContextService);
    private router = inject(Router);
    private messageService = inject(MessageService);

    activeStudent = this.lessonContext.activeStudent;
    homework = signal<HomeworkItemDto[]>([]);
    loading = signal(true);

    pending = computed(() => this.homework().filter(h => !h.isCompleted));
    completed = computed(() => this.homework().filter(h => h.isCompleted));

    ngOnInit() {
        const studentId = this.lessonContext.studentId;
        if (!studentId) return;

        this.lessonService.getHomework(studentId).subscribe({
            next: (d) => { this.homework.set(d); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    toggle(item: HomeworkItemDto) {
        const action = item.isCompleted
            ? this.lessonService.uncheckHomework(item.id)
            : this.lessonService.checkHomework(item.id);

        action.subscribe({
            next: () => {
                this.homework.update(list =>
                    list.map(h => h.id === item.id
                        ? { ...h, isCompleted: !h.isCompleted }
                        : h
                    )
                );
            },
            error: () => this.messageService.add({
                severity: 'error', summary: 'Error',
                detail: 'Failed to update homework status', life: 3000
            })
        });
    }

    dueSeverity(item: HomeworkItemDto): SeverityType {
        if (item.isCompleted) return 'success';
        if (item.isOverdue) return 'danger';
        return 'info';
    }

    dueLabel(item: HomeworkItemDto): string {
        if (item.isCompleted) return 'Done';
        if (item.isOverdue) return 'Overdue';
        return item.dueDate;
    }

    goToSwitchClient() {
        this.router.navigate(['/lesson/switch-client']);
    }
}