import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router'; // Dodano RouterModule
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { CreateMatrixRequest, MatrixService } from '../../../services/matrix.service';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-matrix-adding',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule, ButtonModule,
        InputTextModule, TextareaModule, CheckboxModule,
        InputNumberModule, ToastModule
    ],
    providers: [MessageService], // Ważne dla spójności
    templateUrl: './matrix-adding.component.html'
})
export class MatrixAddingComponent {
    private matrixService = inject(MatrixService);
    private messageService = inject(MessageService);
    private router = inject(Router);

    newMatrix: CreateMatrixRequest = { name: '', description: '', refreshIntervalDays: 7, isHidden: false };
    submitted = false;
    loading = false;

    intervalPresets = [
        { label: 'Daily', value: 1 },
        { label: 'Weekly', value: 7 },
        { label: 'Bi-weekly', value: 14 },
        { label: 'Monthly', value: 30 },
    ];

    save() {
        this.submitted = true;
        if (!this.newMatrix.name.trim()) return;

        this.loading = true;
        this.matrixService.createMatrix(this.newMatrix).subscribe({
            next: () => {
                this.matrixService.reloadMatrices();
                this.messageService.add({
                    severity: 'success', summary: 'Created',
                    detail: `Matrix "${this.newMatrix.name}" created.`, life: 3000
                });
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

    cancel() {
        this.router.navigate(['/curriculum/matrices']);
    }
}