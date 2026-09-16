import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ContentService, AssignmentStudentDto } from '../../services/student-services/content.service';
import { StudentService } from '../../services/student-services/student.service';
type View = 'active' | 'history';
type SeverityType = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;
@Component({
    selector: 'app-assignments',
    standalone: true,
    imports: [CommonModule, TableModule, TagModule, ToastModule, ButtonModule],
    providers: [MessageService],
    templateUrl: './assignments.component.html'
})
export class AssignmentsComponent implements OnInit {
    private contentService = inject(ContentService);
    private studentService = inject(StudentService);
    private messageService = inject(MessageService);
    private router         = inject(Router);
    activeView        = signal<View>('active');
    activeAssignments = this.contentService.assignments;
    history           = signal<AssignmentStudentDto[]>([]);
    loadingHistory    = signal(false);
    completingId      = signal<number | null>(null);
    completeAssignment(a: AssignmentStudentDto, event?: Event) {
        event?.stopPropagation();
        this.completingId.set(a.id);
        const action = a.isFromMatrix
            ? this.studentService.completeModule(a.id)
            : this.studentService.completeSingleModule(a.id);
        action.subscribe({
            next: () => {
                this.completingId.set(null);
                this.messageService.add({
                    severity: 'success', summary: 'Success',
                    detail: 'Assignment marked as done!', life: 3000
                });
                this.contentService.assignments.reload();
            },
            error: (err: any) => {
                this.completingId.set(null);
                const detail = err?.error?.message || 'Failed to complete assignment.';
                this.messageService.add({
                    severity: 'error', summary: 'Error',
                    detail, life: 3000
                });
            }
        });
    }
    expandedDescriptions = signal<Set<number>>(new Set());
    toggleDescription(id: number, event?: Event) {
        event?.stopPropagation();
        this.expandedDescriptions.update(set => {
            const next = new Set(set);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }
    isDescriptionExpanded(id: number): boolean {
        return this.expandedDescriptions().has(id);
    }
    isDescriptionLong(desc: string | null | undefined): boolean {
        return !!desc && desc.trim().length > 45;
    }
    isManualTask(a: AssignmentStudentDto): boolean {
        const interactiveCategories = [
            'Watching', 'Sentences', 'SentenceFlashcards',
            'Presentation', 'Flashcards', 'Memories',
            'Pronunciation', 'Essay'
        ];
        return !interactiveCategories.includes(a.category);
    }
    onCardTileClick(a: AssignmentStudentDto, event?: Event) {
        if (this.isDescriptionLong(a.moduleDescription)) {
            this.toggleDescription(a.id, event);
        }
    }
    overdueAssignments = computed(() =>
        (this.activeAssignments.value() ?? []).filter(a => a.isOverdue)
    );
    pendingAssignments = computed(() =>
        (this.activeAssignments.value() ?? []).filter(a => !a.isOverdue)
    );
    ngOnInit() {
        this.contentService.assignments.reload();
    }
    showHistory() {
        this.activeView.set('history');
        if (!this.history().length) {
            this.loadingHistory.set(true);
            this.contentService.getAssignmentHistory().subscribe({
                next: (d) => { this.history.set(d); this.loadingHistory.set(false); },
                error: () => this.loadingHistory.set(false)
            });
        }
    }
    openModule(a: AssignmentStudentDto) {
        if (a.isFromMatrix && a.matrixId) {
            this.router.navigate(['/courses'], { queryParams: { matrixId: a.matrixId, returnUrl: '/assignments' } });
        } else {
            this.router.navigate(['/courses'], { queryParams: { singleModuleId: a.id, moduleId: a.moduleId, returnUrl: '/assignments' } });
        }
    }
    dueLabel(a: AssignmentStudentDto): string {
        if (a.isCompleted) return 'Done';
        if (a.isOverdue) return 'Overdue';
        const days = this.daysUntil(a.dueDate);
        if (days < 0) return 'Overdue';
        if (days === 0) return 'Today';
        if (days === 1) return 'Tomorrow';
        return `In ${days} days`;
    }
    dueSeverity(a: AssignmentStudentDto): SeverityType {
        if (a.isCompleted)  return 'success';
        if (a.isOverdue)    return 'danger';
        const days = this.daysUntil(a.dueDate);
        if (days < 0)       return 'danger';
        if (days <= 1)      return 'warn';
        return 'info';
    }
    private daysUntil(dateStr: string): number {
        const polishTimeStr = new Date().toLocaleString('en-US', { timeZone: 'Europe/Warsaw' });
        const today = new Date(polishTimeStr); 
        today.setHours(0, 0, 0, 0);
        const due = new Date(dateStr); 
        due.setHours(0, 0, 0, 0);
        return Math.round((due.getTime() - today.getTime()) / 86400000);
    }
    historyStatusSeverity(a: AssignmentStudentDto): SeverityType {
        return a.isCompleted ? 'success' : 'danger';
    }
    historyStatusLabel(a: AssignmentStudentDto): string {
        return a.isCompleted ? 'Completed' : 'Overdue';
    }
}
