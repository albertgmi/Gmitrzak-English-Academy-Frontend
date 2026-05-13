import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageService } from 'primeng/api';
import { CreateMatrixRequest, MatrixService } from '../../../services/matrix.service';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-matrix-adding',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule,
        InputTextModule, TextareaModule, CheckboxModule,
        InputNumberModule, SelectButtonModule, ToastModule
    ],
    templateUrl: './matrix-adding.component.html'
})
export class MatrixAddingComponent {
    private matrixService = inject(MatrixService);
    private messageService = inject(MessageService);
    private router = inject(Router);
    matrixAdded = output<void>();

    newMatrix: CreateMatrixRequest = this.getEmpty();
    submitted = false;
    loading = false;

    intervalPresets = [
        { label: 'Daily',     value: 1  },
        { label: 'Weekly',    value: 7  },
        { label: 'Bi-weekly', value: 14 },
        { label: 'Monthly',   value: 30 },
    ];

    save() {
        this.submitted = true;
        if (!this.newMatrix.name.trim()) {
            this.messageService.add({
                severity: 'warn', summary: 'Validation',
                detail: 'Name is required.', life: 3000
            });
            return;
        }

        this.loading = true;
        this.matrixService.createMatrix(this.newMatrix).subscribe({
            next: () => {
                this.matrixService.reloadMatrices();
                this.messageService.add({
                    severity: 'success', summary: 'Created',
                    detail: `Matrix "${this.newMatrix.name}" created.`, life: 3000
                });
                this.reset();
                this.matrixAdded.emit();
                this.router.navigate(['/curriculum/matrices']);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error', summary: 'Error',
                    detail: 'Failed to create matrix.', life: 3000
                });
                this.loading = false;
            }
        });
    }

    reset() {
        this.newMatrix = this.getEmpty();
        this.submitted = false;
        this.loading = false;
    }

    private getEmpty(): CreateMatrixRequest {
        return { name: '', description: '', refreshIntervalDays: 7, isHidden: false };
    }
}