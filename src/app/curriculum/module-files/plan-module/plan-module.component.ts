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
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AssignmentService, ModuleAssignmentDto, CreateModuleAssignmentRequest } from '../../../services/assignment.service';
import { UserService } from '../../../services/user.service';
import { ModuleItemService } from '../../../services/module.service';

type SeverityType = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

@Component({
    selector: 'app-plan-module',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        TableModule, ButtonModule, InputTextModule,
        IconFieldModule, InputIconModule, SelectModule,
        DatePickerModule, TagModule, ToolbarModule,
        ToastModule, ConfirmDialogModule, TooltipModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './plan-module.component.html'
})
export class PlanModuleComponent implements OnInit {
    private assignmentService = inject(AssignmentService);
    private userService = inject(UserService);
    private moduleService = inject(ModuleItemService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    moduleAssignments = this.assignmentService.moduleAssignments;
    showAddForm = signal(false);
    submitted = false;
    loadingSubmit = false;

    selectedUserId = signal<number | null>(null);
    selectedModuleId = signal<number | null>(null);
    selectedDueDate = signal<Date | null>(null);
    filterUserId = signal<number | null>(null);

    users = computed(() =>
        (this.userService.users.value() ?? [])
            .filter(u => u.role === 'User')
            .map(u => ({ id: u.id, label: `${u.username} (${u.email})` }))
    );

    allUsers = computed(() =>
        (this.userService.users.value() ?? [])
            .filter(u => u.role === 'User')
            .map(u => ({ id: u.id, label: u.username }))
    );

    availableModules = computed(() =>
        (this.moduleService.modules.value() ?? [])
            .filter(m => !m.isHidden)
            .map(m => ({ id: m.id, label: m.name, description: m.description }))
    );

    filteredAssignments = computed(() => {
        const all = this.moduleAssignments.value() ?? [];
        const uid = this.filterUserId();
        return uid ? all.filter(a => a.userId === uid) : all;
    });

    ngOnInit() {
        this.assignmentService.reloadModuleAssignments();
        this.userService.users.reload();
        this.moduleService.reloadModules();
    }

    openAddForm() {
        this.selectedUserId.set(null);
        this.selectedModuleId.set(null);
        this.selectedDueDate.set(null);
        this.submitted = false;
        this.showAddForm.set(true);
    }

    closeAddForm() {
        this.showAddForm.set(false);
        this.submitted = false;
    }

    submitAssignment() {
        this.submitted = true;
        const userId = this.selectedUserId();
        const moduleId = this.selectedModuleId();
        const date = this.selectedDueDate();

        if (!userId || !moduleId || !date) return;

        this.loadingSubmit = true;

        const request: CreateModuleAssignmentRequest = {
            userId,
            moduleId,
            dueDate: this.formatDate(date)
        };

        this.assignmentService.createModuleAssignment(request).subscribe({
            next: () => {
                this.assignmentService.reloadModuleAssignments();
                this.messageService.add({
                    severity: 'success', summary: 'Assigned',
                    detail: 'Module assigned successfully.', life: 3000
                });
                this.closeAddForm();
                this.loadingSubmit = false;
            },
            error: () => {
                this.messageService.add({
                    severity: 'error', summary: 'Error',
                    detail: 'Failed to assign module.', life: 3000
                });
                this.loadingSubmit = false;
            }
        });
    }

    toggleComplete(assignment: ModuleAssignmentDto) {
        const action = assignment.isCompleted
            ? this.assignmentService.uncompleteModuleAssignment(assignment.id)
            : this.assignmentService.completeModuleAssignment(assignment.id);

        action.subscribe({
            next: () => {
                this.assignmentService.reloadModuleAssignments();
            },
            error: () => this.messageService.add({
                severity: 'error', summary: 'Error',
                detail: 'Failed to update status.', life: 3000
            })
        });
    }

    confirmDelete(assignment: ModuleAssignmentDto) {
        this.confirmationService.confirm({
            message: `Remove assignment "${assignment.moduleName}" from ${assignment.username}?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.assignmentService.deleteModuleAssignment(assignment.id).subscribe({
                    next: () => {
                        this.assignmentService.reloadModuleAssignments();
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

    dueDateSeverity(a: ModuleAssignmentDto): SeverityType {
        if (a.isCompleted) return 'success';
        if (a.isOverdue) return 'danger';
        return 'info';
    }

    dueDateLabel(a: ModuleAssignmentDto): string {
        if (a.isCompleted) return 'Done';
        if (a.isOverdue) return 'Overdue';
        return a.dueDate;
    }

    formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    onGlobalFilter(table: any, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    reload() {
        this.assignmentService.reloadModuleAssignments();
    }
}