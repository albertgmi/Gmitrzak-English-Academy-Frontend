import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { StudentService, StudentAssignmentDto, StudentModuleDto } from '../../services/student-services/student.service';

@Component({
    selector: 'app-user-course',
    standalone: true,
    imports: [
        CommonModule,
        ToastModule,
        ProgressBarModule,
        TooltipModule,
        ButtonModule,
        TagModule,
        SkeletonModule
    ],
    providers: [MessageService],
    templateUrl: './user-course.component.html',
    styleUrls: ['./user-course.component.scss']
})
export class UserCourseComponent implements OnInit {
    private studentService = inject(StudentService);
    private messageService = inject(MessageService);

    courses = this.studentService.courses;
    selectedMatrixId = signal<number | null>(null);

    selectedAssignment = computed(() => {
        const matrixId = this.selectedMatrixId();
        const allCourses = this.courses.value();
        
        if (!matrixId || !allCourses) return null;
        
        return allCourses.find(c => c.matrixId === matrixId) ?? null;
    });

    singleModules = this.studentService.singleModules;

    ngOnInit() {
        this.studentService.reloadCourses();
        this.studentService.reloadCourses();
        this.studentService.reloadSingleModules();
    }

    selectAssignment(assignment: StudentAssignmentDto) {
        this.selectedMatrixId.set(assignment.matrixId);
    }

    backToList() {
        this.selectedMatrixId.set(null);
    }

    progress(assignment: StudentAssignmentDto): number {
        if (!assignment.modules?.length) return 0;
        const completed = assignment.modules.filter(m => m.isCompleted).length;
        return Math.round((completed / assignment.modules.length) * 100);
    }

    unlockedCount(assignment: StudentAssignmentDto): number {
        return assignment.modules?.filter(m => m.isUnlocked).length ?? 0;
    }

    toggleComplete(module: StudentModuleDto) {
        if (!module.isUnlocked) return;

        const action = module.isCompleted
            ? this.studentService.uncompleteModule(module.id)
            : this.studentService.completeModule(module.id);

        action.subscribe({
            next: () => {
                this.studentService.reloadCourses();
            },
            error: () => this.messageService.add({
                severity: 'error', summary: 'Error',
                detail: 'Failed to update module status.', life: 3000
            })
        });
    }

    moduleTooltip(module: StudentModuleDto): string {
        if (!module.isUnlocked) return `Locked until ${module.unlockDate}`;
        if (module.isCompleted) return `${module.name} - completed ✓`;
        return `${module.name} - click to mark as done`;
    }

    dayLabel(day: number): string {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return days[day - 1] ?? '';
    }

    getCompletedCount(assignment: StudentAssignmentDto): number {
        return assignment.modules?.filter(m => m.isCompleted).length ?? 0;
    }

    toggleSingleModule(module: StudentModuleDto) {
        if (!module.isUnlocked) return;
        
        const action = module.isCompleted
            ? this.studentService.uncompleteSingleModule(module.id)
            : this.studentService.completeSingleModule(module.id);
        
        action.subscribe({
            next: () => {
                this.studentService.reloadSingleModules();
            },
            error: () => this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to update module status.',
                life: 3000
            })
        });
    }
}