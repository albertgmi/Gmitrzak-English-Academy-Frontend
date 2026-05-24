import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import {
    StudentService,
    StudentAssignmentDto,
    StudentModuleDto
} from '../../services/student-services/student.service';
import confetti from 'canvas-confetti';

type View = 'active' | 'history';

@Component({
    selector: 'app-user-course',
    standalone: true,
    imports: [
        CommonModule, ToastModule, ProgressBarModule,
        TooltipModule, ButtonModule, TagModule, SkeletonModule
    ],
    providers: [MessageService],
    templateUrl: './user-course.component.html',
    styleUrls: ['./user-course.component.scss']
})
export class UserCourseComponent implements OnInit {
    private studentService = inject(StudentService);
    private messageService = inject(MessageService);
    private router         = inject(Router);

    courses          = this.studentService.courses;
    singleModules    = this.studentService.singleModules;
    selectedMatrixId = signal<number | null>(null);
    activeView       = signal<View>('active');

    activeMatrices = computed(() => {
        const all = this.courses.value() ?? [];
        return all.filter(c => this.progress(c) < 100);
    });

    historyMatrices = computed(() => {
        const all = this.courses.value() ?? [];
        return all.filter(c => this.progress(c) >= 100);
    });

    historySingleModules = signal<StudentModuleDto[]>([]);

    selectedAssignment = computed(() => {
        const matrixId   = this.selectedMatrixId();
        const allCourses = this.courses.value();
        if (!matrixId || !allCourses) return null;
        return allCourses.find(c => c.matrixId === matrixId) ?? null;
    });

    ngOnInit() {
        this.studentService.reloadCourses();
        this.studentService.reloadSingleModules();
        this.loadHistory();
    }

    selectAssignment(assignment: StudentAssignmentDto) {
        this.selectedMatrixId.set(assignment.matrixId);
    }

    backToList() {
        this.selectedMatrixId.set(null);
    }

    handleModuleClick(module: StudentModuleDto) {
        if (!module.isUnlocked) return;

        if (module.category === 'Sentences') {
            this.router.navigate(['/modules', module.moduleId, 'sentences']);
        } else {
            this.toggleComplete(module);
        }
    }

    handleSingleModuleClick(module: StudentModuleDto) {
        if (!module.isUnlocked) return;

        if (module.category === 'Sentences') {
            this.router.navigate(['/modules', module.moduleId, 'sentences']);
        } else {
            this.toggleSingleModule(module);
        }
    }

    toggleComplete(module: StudentModuleDto) {
        const action = module.isCompleted
            ? this.studentService.uncompleteModule(module.id)
            : this.studentService.completeModule(module.id);

        action.subscribe({
            next: () => this.studentService.reloadCourses(),
            error: () => this.messageService.add({
                severity: 'error', summary: 'Error',
                detail: 'Failed to update module status.', life: 3000
            })
        });
    }

    toggleSingleModule(module: StudentModuleDto) {
        const checkingAsCompleted = !module.isCompleted;

        const action = module.isCompleted
            ? this.studentService.uncompleteSingleModule(module.id)
            : this.studentService.completeSingleModule(module.id);

        action.subscribe({
            next: () => {
                if (checkingAsCompleted) this.triggerTeamsCelebration();
                this.studentService.reloadSingleModules();
            },
            error: () => this.messageService.add({
                severity: 'error', summary: 'Error',
                detail: 'Failed to update module status.', life: 3000
            })
        });
    }

    progress(assignment: StudentAssignmentDto): number {
        if (!assignment.modules?.length) return 0;
        const completed = assignment.modules.filter(m => m.isCompleted).length;
        return Math.round((completed / assignment.modules.length) * 100);
    }

    unlockedCount(assignment: StudentAssignmentDto): number {
        return assignment.modules?.filter(m => m.isUnlocked).length ?? 0;
    }

    getCompletedCount(assignment: StudentAssignmentDto): number {
        return assignment.modules?.filter(m => m.isCompleted).length ?? 0;
    }

    moduleTooltip(module: StudentModuleDto): string {
        if (!module.isUnlocked) return `Locked until ${module.unlockDate}`;
        if (module.category === 'Sentences') return `${module.name} — click to translate`;
        if (module.isCompleted) return `${module.name} — completed ✓`;
        return `${module.name} — click to mark as done`;
    }

    dayLabel(day: number): string {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return days[day - 1] ?? '';
    }

    isSentences(module: StudentModuleDto): boolean {
        return module.category === 'Sentences';
    }

    loadHistory() {
        this.studentService.getCompletedSingleModules().subscribe(data => {
            this.historySingleModules.set(data);
        });
    }

    setHistoryView() {
        this.activeView.set('history');
        
        if (this.historySingleModules().length === 0) {
            this.studentService.getCompletedSingleModules().subscribe({
                next: (data) => this.historySingleModules.set(data),
                error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load history' })
            });
        }
    }

    private triggerTeamsCelebration() {
        const scalar     = 4.5;
        const discoBall  = confetti.shapeFromText({ text: '🪩', scalar });
        const partyPopper = confetti.shapeFromText({ text: '🎉', scalar });
        const star       = confetti.shapeFromText({ text: '⭐', scalar });
        const duration   = 3500;
        const animationEnd = Date.now() + duration;
        const defaults     = {
            startVelocity: 35, spread: 360, ticks: 80, gravity: 1.0,
            shapes: [discoBall, partyPopper, star], scalar
        };
        const rand = (min: number, max: number) => Math.random() * (max - min) + min;
        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 25 * (timeLeft / duration);
            confetti({ ...defaults, particleCount,
                origin: { x: rand(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount,
                origin: { x: rand(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 200);
    }
}