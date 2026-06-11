import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ChipModule } from 'primeng/chip';
import { BadgeModule } from 'primeng/badge';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Matrix, MatrixService } from '../../../services/matrix.service';

@Component({
    selector: 'app-matrix',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule,
        TableModule, ButtonModule, InputTextModule,
        IconFieldModule, InputIconModule, TagModule,
        ToolbarModule, ToastModule, RippleModule,
        ConfirmDialogModule, ChipModule, BadgeModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './matrix.component.html'
})
export class MatrixComponent {
    private matrixService = inject(MatrixService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    matrices = this.matrixService.matrices;
    selectedMatrix = signal<Matrix | null>(null);

    ngOnInit() {
        this.matrixService.reloadMatrices();
    }

    selectMatrix(matrix: Matrix) {
        this.selectedMatrix.set(matrix);
    }

    backToList() {
        this.selectedMatrix.set(null);
    }

    confirmDelete(matrix: Matrix) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${matrix.name}"?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.matrixService.deleteMatrix(matrix.id).subscribe({
                    next: () => {
                        this.matrixService.reloadMatrices();
                        if (this.selectedMatrix()?.id === matrix.id) {
                            this.selectedMatrix.set(null);
                        }
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Deleted',
                            detail: `Matrix "${matrix.name}" deleted.`,
                            life: 3000
                        });
                    },
                    error: () => this.messageService.add({
                        severity: 'error', summary: 'Error',
                        detail: 'Failed to delete matrix.', life: 3000
                    })
                });
            }
        });
    }

    intervalLabel(days: number): string {
        if (days === 1) return 'Daily';
        if (days === 7) return 'Weekly';
        if (days === 14) return 'Bi-weekly';
        if (days === 30) return 'Monthly';
        return `Every ${days} days`;
    }

    onGlobalFilter(table: any, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    reload() {
        this.matrixService.reloadMatrices();
    }
}