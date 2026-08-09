import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { DividerModule } from 'primeng/divider';
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
        TooltipModule, ButtonModule, TagModule,
        SkeletonModule, DividerModule
    ],
    providers: [MessageService],
    templateUrl: './user-course.component.html',
    styleUrls: ['./user-course.component.scss']
})
export class UserCourseComponent implements OnInit {
    private studentService = inject(StudentService);
    private messageService = inject(MessageService);
    private router         = inject(Router);
    private route          = inject(ActivatedRoute);

    courses          = this.studentService.courses;
    singleModules    = this.studentService.singleModules;
    selectedMatrixId = signal<number | null>(null);
    activeView       = signal<View>('active');
    expandedDescriptions = signal<Set<number>>(new Set());
    private hasProcessedSingleModule = false;

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

    constructor() {
        effect(() => {
            const modules = this.singleModules.value();
            const params = this.route.snapshot.queryParams;
            const smId = params['singleModuleId'] ? Number(params['singleModuleId']) : null;
            const mId = params['moduleId'] ? Number(params['moduleId']) : null;

            if (modules && modules.length > 0 && (smId || mId) && !this.hasProcessedSingleModule) {
                const matched = modules.find(m => (smId && m.id === smId) || (mId && m.moduleId === mId));
                if (matched) {
                    this.hasProcessedSingleModule = true;
                    this.handleSingleModuleClick(matched);
                }
            }
        });
    }

    activeMatrices = computed(() =>
        (this.courses.value() ?? []).filter(c => this.progress(c) < 100)
    );

    historyMatrices = computed(() =>
        (this.courses.value() ?? []).filter(c => this.progress(c) >= 100)
    );

    historySingleModules = signal<StudentModuleDto[]>([]);

    selectedAssignment = computed(() => {
        const matrixId   = this.selectedMatrixId();
        const allCourses = this.courses.value();
        if (!matrixId || !allCourses) return null;
        return allCourses.find(c => c.matrixId === matrixId) ?? null;
    });

    overdueModules = computed(() =>
        (this.selectedAssignment()?.modules ?? [])
            .filter(m => m.isOverdue && !m.isCompleted)
            .sort((a, b) => a.unlockDate < b.unlockDate ? -1 : 1)
    );

    currentWeekModules = computed(() =>
        (this.selectedAssignment()?.modules ?? [])
            .filter(m => m.isUnlocked && !m.isCompleted && !m.isOverdue)
            .sort((a, b) => a.unlockDate < b.unlockDate ? -1 : 1)
    );

    futureModules = computed(() =>
        (this.selectedAssignment()?.modules ?? [])
            .filter(m => !m.isUnlocked && !m.isCompleted)
            .sort((a, b) => a.unlockDate < b.unlockDate ? -1 : 1)
    );

    completedModules = computed(() =>
        (this.selectedAssignment()?.modules ?? [])
            .filter(m => m.isCompleted)
            .sort((a, b) => a.unlockDate < b.unlockDate ? -1 : 1)
    );

    ngOnInit() {
        this.studentService.reloadCourses();
        this.studentService.reloadSingleModules();
        this.loadHistory();

        this.route.queryParams.subscribe(params => {
            if (params['matrixId']) {
                const matrixId = Number(params['matrixId']);
                if (matrixId) {
                    this.selectedMatrixId.set(matrixId);
                }
            }
        });
    }

    selectAssignment(assignment: StudentAssignmentDto) {
        this.selectedMatrixId.set(assignment.matrixId);
        this.router.navigate([], { relativeTo: this.route, queryParams: { matrixId: assignment.matrixId } });
    }

    backToList() {
        this.selectedMatrixId.set(null);
        this.router.navigate([], { relativeTo: this.route, queryParams: {} });
    }

    isManualTask(m: StudentModuleDto): boolean {
        const interactiveCategories = [
            'Watching', 'Sentences', 'SentenceFlashcards',
            'Presentation', 'Flashcards', 'Memories',
            'Pronunciation', 'Essay'
        ];
        return !interactiveCategories.includes(m.category);
    }

    onCardTileClick(module: StudentModuleDto, event?: Event) {
        if (this.isDescriptionLong(module.description)) {
            this.toggleDescription(module.id, event);
        }
    }

    handleModuleClick(module: StudentModuleDto) {
        if (!module.isUnlocked) return;

        switch (module.category) {
            case 'Watching':
                this.router.navigate(['/modules', module.id, 'player'],
                    { queryParams: { isSingle: false } });
                return;
            case 'Sentences':
                this.router.navigate(['/modules', module.moduleId, 'sentences']);
                return;
            case 'SentenceFlashcards':
                if (!module.isCompleted && !module.canComplete)
                    this.router.navigate(['/sentences-cards']);
                else if (!module.isCompleted && module.canComplete)
                    this.toggleComplete(module);
                return;
            case 'Presentation':
                this.router.navigate(['/modules', 'matrix', module.id, 'presentation']);
                return;
            case 'Flashcards':
                if (!module.isCompleted && !module.canComplete)
                    this.router.navigate(['/flashcards']);
                else if (!module.isCompleted && module.canComplete)
                    this.toggleComplete(module);
                return;
            case 'Memories':
                if (!module.isCompleted && !module.canComplete)
                    this.router.navigate(['/memories']);
                else if (!module.isCompleted && module.canComplete)
                    this.toggleComplete(module);
                return;
            case 'Pronunciation':
                if (!module.isCompleted && !module.canComplete)
                    this.router.navigate(['/pronunciation']);
                else if (!module.isCompleted && module.canComplete)
                    this.toggleComplete(module);
                return;
            case 'Essay':
                this.router.navigate(['/modules', module.moduleId, 'essay']);
                return;
        }

        // For manual tasks (General, Other, etc.), tile click expands description if long, but DOES NOT toggle completion!
        if (this.isDescriptionLong(module.description)) {
            this.toggleDescription(module.id);
        }
    }

    handleSingleModuleClick(module: StudentModuleDto) {
        if (!module.isUnlocked) return;

        switch (module.category) {
            case 'Watching':
                this.router.navigate(['/modules', module.id, 'player'],
                    { queryParams: { isSingle: true } });
                return;
            case 'Sentences':
                this.router.navigate(['/modules', module.moduleId, 'sentences']);
                return;
            case 'SentenceFlashcards':
                if (!module.isCompleted && !module.canComplete)
                    this.router.navigate(['/sentences-cards']);
                else if (!module.isCompleted && module.canComplete) {
                    this.triggerTeamsCelebration();
                    this.toggleSingleModule(module);
                }
                return;
            case 'Presentation':
                this.router.navigate(['/modules', 'single', module.id, 'presentation']);
                return;
            case 'Flashcards':
                if (!module.isCompleted && !module.canComplete)
                    this.router.navigate(['/flashcards']);
                else if (!module.isCompleted && module.canComplete) {
                    this.triggerTeamsCelebration();
                    this.toggleSingleModule(module);
                }
                return;
            case 'Memories':
                if (!module.isCompleted && !module.canComplete)
                    this.router.navigate(['/memories']);
                else if (!module.isCompleted && module.canComplete) {
                    this.triggerTeamsCelebration();
                    this.toggleSingleModule(module);
                }
                return;
            case 'Pronunciation':
                if (!module.isCompleted && !module.canComplete)
                    this.router.navigate(['/pronunciation']);
                else if (!module.isCompleted && module.canComplete) {
                    this.triggerTeamsCelebration();
                    this.toggleSingleModule(module);
                }
                return;
            case 'Essay':
                this.router.navigate(['/modules', module.moduleId, 'essay']);
                return;
        }

        if (this.isDescriptionLong(module.description)) {
            this.toggleDescription(module.id);
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

    unlockedCount(a: StudentAssignmentDto)  { return a.modules?.filter(m => m.isUnlocked).length ?? 0; }
    getCompletedCount(a: StudentAssignmentDto) { return a.modules?.filter(m => m.isCompleted).length ?? 0; }

    moduleTooltip(m: StudentModuleDto): string {
        if (!m.isUnlocked)  return `Unlocks ${m.unlockDate}`;
        if (m.isCompleted)  return `${m.name} — completed`;
        if (this.isActivityBased(m)) {
            if (m.canComplete) return `${m.name} — click 'Mark as done' button to complete.`;
            return m.completionBlockReason ?? `${m.name} — keep the streak going!`;
        }
        if (m.category === 'Sentences')    return `${m.name} — click to translate`;
        if (m.category === 'Presentation') return `${m.name} — click to view`;
        if (m.category === 'Watching')     return `${m.name} — click to watch`;
        if (m.category === 'Essay')        return `${m.name} — click to write essay`;
        return `${m.name} — click 'Mark as done' button to complete`;
    }

    dayLabel(day: number): string {
        return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][day - 1] ?? '';
    }

    isSentences(m: StudentModuleDto)   { return m.category === 'Sentences'; }
    isActivityBased(m: StudentModuleDto) {
        return ['Flashcards','SentenceFlashcards','Memories','Pronunciation'].includes(m.category);
    }

    activityProgress(m: StudentModuleDto): number {
        if (m.activityDaysRequired === 0) return 100;
        return Math.min(100, Math.round((m.activityDaysCount / m.activityDaysRequired) * 100));
    }

    activityLabel(m: StudentModuleDto): string {
        if (m.isCompleted)                return 'Done';
        if (m.activityDaysRequired === 0) return 'Click to complete';
        if (m.canComplete)                return 'Ready to complete!';
        const d = m.activityDaysCount, r = m.activityDaysRequired;
        if (d === 0) return `${r} consecutive days needed`;
        return `${d}/${r} consecutive days`;
    }

    loadHistory() {
        this.studentService.getCompletedSingleModules().subscribe(data => {
            this.historySingleModules.set(data);
        });
    }

    setHistoryView() {
        this.activeView.set('history');
        if (!this.historySingleModules().length) {
            this.studentService.getCompletedSingleModules().subscribe({
                next: d  => this.historySingleModules.set(d),
                error: () => this.messageService.add({
                    severity: 'error', summary: 'Error',
                    detail: 'Could not load history' })
            });
        }
    }

    getOverdueCount(a: StudentAssignmentDto): number {
        return a.modules?.filter(m => m.isOverdue && !m.isCompleted).length ?? 0;
    }

    private triggerTeamsCelebration() {
        const scalar      = 4.5;
        const approveSign = confetti.shapeFromText({ text: '✅️', scalar });
        const partyPopper = confetti.shapeFromText({ text: '🎉', scalar });
        const star        = confetti.shapeFromText({ text: '⭐', scalar });
        const duration    = 3500;
        const animEnd     = Date.now() + duration;
        const defaults    = {
            startVelocity: 35, spread: 360, ticks: 80, gravity: 1.0,
            shapes: [approveSign, partyPopper, star], scalar
        };
        const rand = (min: number, max: number) => Math.random() * (max - min) + min;
        const iv = setInterval(() => {
            const tl = animEnd - Date.now();
            if (tl <= 0) return clearInterval(iv);
            const pc = 25 * (tl / duration);
            confetti({ ...defaults, particleCount: pc, origin: { x: rand(0.1,0.3), y: Math.random()-0.2 } });
            confetti({ ...defaults, particleCount: pc, origin: { x: rand(0.7,0.9), y: Math.random()-0.2 } });
        }, 200);
    }
}