import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, firstValueFrom } from 'rxjs';
import { LessonContextService } from '../../services/lesson-context.service';
import { VocabularyService, VocabularyDto } from '../../services/vocabulary.service';
import { AssignmentService } from '../../services/assignment.service';
import { MatrixService, Matrix } from '../../services/matrix.service';
import { ModuleItemService, ModuleItem } from '../../services/module.service';
import { AvatarComponent } from '../../other/avatar/avatar.component';

interface SelectableVocabulary extends VocabularyDto {
    selected: boolean;
}

interface SelectableMatrix extends Matrix {
    selected: boolean;
    startDate: string;
}

interface SelectableModule extends ModuleItem {
    selected: boolean;
    dueDate: string;
}

type OnboardStep = 'vocabulary' | 'matrices' | 'modules' | 'summary';

@Component({
    selector: 'app-onboard-client',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, InputTextModule,
        SelectModule, CheckboxModule, TagModule, ToastModule,
        DividerModule, ProgressBarModule, TooltipModule, AvatarComponent
    ],
    providers: [MessageService],
    templateUrl: './onboard-client.component.html'
})
export class OnboardClientComponent implements OnInit {
    private lessonContext     = inject(LessonContextService);
    private vocabularyService = inject(VocabularyService);
    private assignmentService = inject(AssignmentService);
    private matrixService     = inject(MatrixService);
    private moduleService     = inject(ModuleItemService);
    private messageService    = inject(MessageService);
    private router            = inject(Router);
    private destroyRef        = inject(DestroyRef);

    activeStudent = this.lessonContext.activeStudent;

    activeStep = signal<OnboardStep>('vocabulary');
    steps: { id: OnboardStep; label: string; icon: string }[] = [
        { id: 'vocabulary', label: 'Vocabulary',  icon: 'pi pi-clone'   },
        { id: 'matrices',   label: 'Matrices',    icon: 'pi pi-sitemap' },
        { id: 'modules',    label: 'Modules',     icon: 'pi pi-book'    },
        { id: 'summary',    label: 'Summary',     icon: 'pi pi-check'   }
    ];

    loading       = signal(true);
    saving        = signal(false);
    saveProgress  = signal(0);

    vocabulary        = signal<SelectableVocabulary[]>([]);
    vocabSearch       = signal('');
    vocabCategoryFilter = signal<string>('all');

    vocabCategories = computed(() => {
        const cats = [...new Set(this.vocabulary().map(v => v.category).filter(Boolean))];
        return [
            { label: 'All categories', value: 'all' },
            ...cats.map(c => ({ label: c, value: c }))
        ];
    });

    filteredVocabulary = computed(() => {
        const q    = this.vocabSearch().toLowerCase();
        const cat  = this.vocabCategoryFilter();
        return this.vocabulary().filter(v =>
            (cat === 'all' || v.category === cat) &&
            (!q || v.front.toLowerCase().includes(q) || v.back.toLowerCase().includes(q))
        );
    });

    selectedVocabCount = computed(() =>
        this.vocabulary().filter(v => v.selected).length
    );

    matrices = signal<SelectableMatrix[]>([]);
    matrixSearch = signal('');
    todayStr = new Intl.DateTimeFormat('sv-SE').format(new Date()); 

    filteredMatrices = computed(() => {
        const q = this.matrixSearch().toLowerCase();
        return this.matrices().filter(m =>
            !q || m.name.toLowerCase().includes(q)
        );
    });

    selectedMatrixCount = computed(() =>
        this.matrices().filter(m => m.selected).length
    );

    modules        = signal<SelectableModule[]>([]);
    moduleSearch   = signal('');
    moduleCategoryFilter = signal<string>('all');

    moduleCategories = computed(() => {
        const cats = [...new Set(this.modules().map(m => m.category).filter(Boolean))];
        return [
            { label: 'All categories', value: 'all' },
            ...cats.map(c => ({ label: c, value: c }))
        ];
    });

    filteredModules = computed(() => {
        const q   = this.moduleSearch().toLowerCase();
        const cat = this.moduleCategoryFilter();
        return this.modules().filter(m =>
            (cat === 'all' || m.category === cat) &&
            (!q || m.name.toLowerCase().includes(q))
        );
    });

    selectedModuleCount = computed(() =>
        this.modules().filter(m => m.selected).length
    );

    get isAllVocabularySelected(): boolean {
      return this.filteredVocabulary().every(v => v.selected);
    }

    isAllModulesSelected = computed(() => {
        const filtered = this.filteredModules();
        return filtered.length > 0 && filtered.every(m => m.selected);
    });

    ngOnInit() {
        if (!this.activeStudent()) {
            this.router.navigate(['/lesson/switch-client']);
            return;
        }

        forkJoin([
            this.vocabularyService.getAllVocabulary(),
            this.matrixService.getAllMatrices(),
            this.moduleService.getAllModulesForOnboard()
        ]).pipe(takeUntilDestroyed(this.destroyRef))
         .subscribe({
            next: ([vocab, matrices, modules]) => {
                this.vocabulary.set(vocab.map(v => ({ ...v, selected: false })));

                this.matrices.set(matrices.map(m => ({
                    ...m,
                    selected:  false,
                    startDate: this.todayStr
                })));

                this.modules.set(modules.map(m => ({
                    ...m,
                    selected: false,
                    dueDate:  this.todayStr
                })));

                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error', summary: 'Error',
                    detail: 'Failed to load data.', life: 3000
                });
                this.loading.set(false);
            }
        });
    }

    toggleVocab(v: SelectableVocabulary) {
        v.selected = !v.selected;
        this.vocabulary.update(list => [...list]);
    }

    selectAllVocab() {
        const filtered = this.filteredVocabulary();
        const allSelected = filtered.every(v => v.selected);
        filtered.forEach(v => v.selected = !allSelected);
        this.vocabulary.update(list => [...list]);
    }

    toggleMatrix(m: SelectableMatrix) {
        m.selected = !m.selected;
        this.matrices.update(list => [...list]);
    }

    updateMatrixDate(m: SelectableMatrix, date: string) {
        m.startDate = date;
        this.matrices.update(list => [...list]);
    }

    toggleModule(m: SelectableModule) {
        m.selected = !m.selected;
        this.modules.update(list => [...list]);
    }

    updateModuleDate(m: SelectableModule, date: string) {
        m.dueDate = date;
        this.modules.update(list => [...list]);
    }

    selectAllModules() {
        const filtered = this.filteredModules();
        const allSelected = filtered.every(m => m.selected);
        filtered.forEach(m => m.selected = !allSelected);
        this.modules.update(list => [...list]);
    }

    goToStep(step: OnboardStep) {
        this.activeStep.set(step);
    }

    nextStep() {
        const order: OnboardStep[] = ['vocabulary', 'matrices', 'modules', 'summary'];
        const idx = order.indexOf(this.activeStep());
        if (idx < order.length - 1) this.activeStep.set(order[idx + 1]);
    }

    prevStep() {
        const order: OnboardStep[] = ['vocabulary', 'matrices', 'modules', 'summary'];
        const idx = order.indexOf(this.activeStep());
        if (idx > 0) this.activeStep.set(order[idx - 1]);
    }

    stepIndex(step: OnboardStep): number {
        return ['vocabulary', 'matrices', 'modules', 'summary'].indexOf(step);
    }

    selectedVocabulary  = computed(() => this.vocabulary().filter(v => v.selected));
    selectedMatrices    = computed(() => this.matrices().filter(m => m.selected));
    selectedModules     = computed(() => this.modules().filter(m => m.selected));

    totalSelected = computed(() =>
        this.selectedVocabCount() + this.selectedMatrixCount() + this.selectedModuleCount()
    );

    async saveOnboarding() {
        const studentId = this.lessonContext.studentId;
        if (!studentId) return;

        const vocabs   = this.selectedVocabulary();
        const matrices = this.selectedMatrices();
        const modules  = this.selectedModules();

        if (!vocabs.length && !matrices.length && !modules.length) {
            this.messageService.add({
                severity: 'warn', summary: 'Nothing selected',
                detail: 'Select at least one item to assign.', life: 3000
            });
            return;
        }

        this.saving.set(true);
        this.saveProgress.set(0);

        const total = (vocabs.length ? 1 : 0) + matrices.length + modules.length;
        let done = 0;

        const updateProgress = () => {
            done++;
            this.saveProgress.set(Math.round((done / total) * 100));
        };

        try {
            if (vocabs.length) {
                await firstValueFrom(this.vocabularyService.assignVocabularyToStudent({
                    studentUserId: studentId,
                    vocabularyIds: vocabs.map(v => v.id)
                }));
                updateProgress();
            }

            for (const m of matrices) {
                await firstValueFrom(this.assignmentService.createAssignment({
                    userId:    studentId,
                    matrixId:  m.id,
                    startDate: m.startDate
                }));
                updateProgress();
            }

            for (const m of modules) {
                await firstValueFrom(this.assignmentService.createModuleAssignment({
                    userId:   studentId,
                    moduleId: m.id,
                    dueDate:  m.dueDate
                }));
                updateProgress();
            }

            this.saveProgress.set(100);
            this.messageService.add({
                severity: 'success', summary: 'Onboarding complete!',
                detail: `${this.activeStudent()?.username} has been onboarded successfully.`,
                life: 5000
            });

            setTimeout(() => this.router.navigate(['/lesson/mode']), 1500);

        } catch {
            this.messageService.add({
                severity: 'error', summary: 'Error',
                detail: 'Some items could not be assigned. Please check manually.',
                life: 5000
            });
        } finally {
            this.saving.set(false);
        }
    }

    goToSwitchClient() {
        this.router.navigate(['/lesson/switch-client']);
    }
}