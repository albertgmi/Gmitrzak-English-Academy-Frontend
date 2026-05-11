import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';

import { ProgramService, CreateProgramRequest } from '../../services/program.service';

@Component({
    selector: 'app-program-adding',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        CheckboxModule
    ],
    templateUrl: './program-adding.component.html'
})
export class ProgramAddingComponent {
    private programService = inject(ProgramService);
    private messageService = inject(MessageService);

    programAdded = output<void>();

    newProgram: CreateProgramRequest = this.getEmptyProgram();
    submitted = false;
    loading = false;

    saveProgram(): void {
        this.submitted = true;
        
        if (!this.newProgram.name.trim() || !this.newProgram.description.trim()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please fill in all required fields.',
                life: 3000
            });
            return;
        }

        this.loading = true;
        this.programService.createProgram(this.newProgram).subscribe({
            next: () => {
                this.programService.reloadPrograms();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Program "${this.newProgram.name}" has been created.`,
                    life: 3000
                });
                this.resetForm();
                this.programAdded.emit();
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to create program.',
                    life: 3000
                });
                this.loading = false;
            }
        });
    }

    resetForm(): void {
        this.newProgram = this.getEmptyProgram();
        this.submitted = false;
        this.loading = false;
    }

    private getEmptyProgram(): CreateProgramRequest {
        return {
            name: '',
            description: '',
            isHidden: false
        };
    }
}