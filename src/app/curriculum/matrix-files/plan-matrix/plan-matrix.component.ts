import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AssignmentService, AssignmentDto, CreateAssignmentRequest } from '../../../services/assignment.service';
import { UserService } from '../../../services/user.service';
import { MatrixService } from '../../../services/matrix.service';

@Component({
    selector: 'app-plan-matrix',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        TableModule, ButtonModule, InputTextModule,
        IconFieldModule, InputIconModule, SelectModule,
        DatePickerModule, TagModule, ToolbarModule,
        ToastModule, ConfirmDialogModule, ProgressBarModule,
        TooltipModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './plan-matrix.component.html'
})
export class PlanMatrixComponent implements OnInit {
    private assignmentService = inject(AssignmentService);
    private userService = inject(UserService);
    private matrixService = inject(MatrixService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    assignments = this.assignmentService.assignments;
    showAddForm = signal(false);
    submitted = false;
    loadingSubmit = false;

    selectedUserId = signal<number | null>(null);
    selectedMatrixId = signal<number | null>(null);
    selectedStartDate = signal<Date | null>(null);

    filterUserId = signal<number | null>(null);

    users = computed(() =>
        (this.userService.users.value() ?? [])
            .filter(u => u.role === 'User')
            .map(u => ({ id: u.id, label: `${u.username} (${u.email})` }))
    );

    matrices = computed(() =>
        (this.matrixService.matrices.value() ?? [])
            .filter(m => !m.isHidden)
            .map(m => ({ id: m.id, label: `${m.name} — every ${m.refreshIntervalDays}d` }))
    );

    filteredAssignments = computed(() => {
        const all = this.assignments.value() ?? [];
        const uid = this.filterUserId();
        return uid ? all.filter(a => a.userId === uid) : all;
    });

    allUsers = computed(() =>
        (this.userService.users.value() ?? [])
            .filter(u => u.role === 'User')
            .map(u => ({ id: u.id, label: u.username }))
    );

    ngOnInit() {
        this.assignmentService.reloadAssignments();
        this.userService.users.reload();
        this.matrixService.reloadMatrices();
    }

    openAddForm() {
        this.selectedUserId.set(null);
        this.selectedMatrixId.set(null);
        this.selectedStartDate.set(null);
        this.submitted = false;
        this.showAddForm.set(true);
    }

    closeAddForm() {
        this.showAddForm.set(false);
        this.submitted = false;
    }

    formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    submitAssignment() {
        this.submitted = true;
        const userId = this.selectedUserId();
        const matrixId = this.selectedMatrixId();
        const date = this.selectedStartDate();

        if (!userId || !matrixId || !date) return;

        this.loadingSubmit = true;

        const request: CreateAssignmentRequest = {
            userId,
            matrixId,
            startDate: this.formatDate(date)
        };

        this.assignmentService.createAssignment(request).subscribe({
            next: () => {
                this.assignmentService.reloadAssignments();
                this.messageService.add({
                    severity: 'success', summary: 'Assigned',
                    detail: 'Matrix assigned successfully.', life: 3000
                });
                this.closeAddForm();
                this.loadingSubmit = false;
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({
                    severity: 'error', summary: 'Error',
                    detail: 'Failed to assign matrix.', life: 3000
                });
                this.loadingSubmit = false;
            }
        });
    }

    confirmDelete(assignment: AssignmentDto) {
        this.confirmationService.confirm({
            message: `Remove matrix "${assignment.matrixName}" from ${assignment.username}?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.assignmentService.deleteAssignment(assignment.id).subscribe({
                    next: () => {
                        this.assignmentService.reloadAssignments();
                        this.messageService.add({
                            severity: 'success', summary: 'Removed',
                            detail: 'Assignment removed.', life: 3000
                        });
                    },
                    error: () => this.messageService.add({
                        severity: 'error', summary: 'Error',
                        detail: 'Failed to remove assignment.', life: 3000
                    })
                });
            }
        });
    }

    progressPercentage(a: AssignmentDto): number {
        if (!a.modules || a.modules.length === 0) return 0;
        const unlockedCount = a.modules.filter(m => m.isUnlocked).length;
        return Math.round((unlockedCount / a.modules.length) * 100);
    }
    
    modulesLabel(a: AssignmentDto): string {
        if (!a.modules || a.modules.length === 0) return 'No modules';
        const unlockedCount = a.modules.filter(m => m.isUnlocked).length;
        return `Modules: ${unlockedCount} / ${a.modules.length}`;
    }

    onGlobalFilter(table: any, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    reload() {
        this.assignmentService.reloadAssignments();
    }
}