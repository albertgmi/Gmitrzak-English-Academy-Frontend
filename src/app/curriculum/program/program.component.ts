import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService, ConfirmationService } from 'primeng/api';

import { Program, ProgramService, UpdateProgramRequest } from '../../services/program.service';

@Component({
    selector: 'app-program',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        TagModule,
        ToolbarModule,
        ToastModule,
        RippleModule,
        DialogModule,
        ConfirmDialogModule,
        TextareaModule,
        CheckboxModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './program.component.html'
})
export class ProgramComponent {
    private programService = inject(ProgramService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    programs = this.programService.programs;

    selectedProgram = signal<Program | null>(null);

    editDialog = false;
    editedProgram!: Program;
    submitted = false;

    selectProgram(program: Program): void {
        this.selectedProgram.set(program);
    }

    backToList(): void {
        this.selectedProgram.set(null);
    }

    openEditDialog(program: Program): void {
        this.editedProgram = { ...program };
        this.submitted = false;
        this.editDialog = true;
    }

    hideEditDialog(): void {
        this.editDialog = false;
        this.submitted = false;
    }

    saveProgram(): void {
        this.submitted = true;
        if (!this.editedProgram.name?.trim()) return;

        const request: UpdateProgramRequest = {
            name: this.editedProgram.name,
            description: this.editedProgram.description,
            isHidden: this.editedProgram.isHidden
        };

        this.programService.updateProgram(this.editedProgram.id, request).subscribe({
            next: () => {
                this.programService.reloadPrograms();
                if (this.selectedProgram()?.id === this.editedProgram.id) {
                    this.selectedProgram.set({ ...this.editedProgram });
                }
                this.messageService.add({
                    severity: 'success',
                    summary: 'Saved',
                    detail: `Program "${this.editedProgram.name}" has been updated.`,
                    life: 3000
                });
                this.editDialog = false;
                this.submitted = false;
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update program.',
                    life: 3000
                });
            }
        });
    }

    confirmDelete(program: Program): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete the program "${program.name}"?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.programService.deleteProgram(program.id).subscribe({
                    next: () => {
                        this.programService.reloadPrograms();
                        if (this.selectedProgram()?.id === program.id) {
                            this.selectedProgram.set(null);
                        }
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Deleted',
                            detail: `Program "${program.name}" has been deleted.`,
                            life: 3000
                        });
                    },
                    error: () => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to delete program.',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    onGlobalFilter(table: any, event: Event): void {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    reload(): void {
        this.programService.reloadPrograms();
    }
}