import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { MessageService, ConfirmationService } from 'primeng/api';
import { SentenceService, SentenceStockDto } from '../../services/sentence.service';
import { UserService } from '../../services/user.service';

@Component({
    selector: 'app-sentence-stock',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule,
        InputTextModule, IconFieldModule, InputIconModule,
        ToolbarModule, ToastModule, ConfirmDialogModule, TagModule,
        DialogModule, DatePickerModule, SelectModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './sentence-stock.component.html'
})
export class SentenceStockComponent implements OnInit {
    private sentenceService = inject(SentenceService);
    private userService = inject(UserService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    stock = this.sentenceService.stock;
    showForm = signal(false);
    saving = signal(false);
    uploading = signal(false);
    dragOver = signal(false);
    submitted = false;

    newPolish = signal('');
    newEnglish = signal('');
    newCategory = signal('');

    showAssignModal = signal(false);
    selectedSentence = signal<SentenceStockDto | null>(null);
    assignUserId = signal<number | null>(null);
    assignDueDate = signal<Date | null>(null);
    assigning  = signal(false);

    students = computed(() =>
        (this.userService.users.value() ?? [])
            .filter(u => u.role === 'User')
            .map(u => ({ id: u.id, label: u.username }))
    );

    ngOnInit() {
        this.sentenceService.reloadStock();
        this.userService.users.reload();
    }

    save() {
        this.submitted = true;
        if (!this.newPolish().trim() || !this.newEnglish().trim()) return;

        this.saving.set(true);
        this.sentenceService.createStock(
            this.newPolish(), this.newEnglish(), this.newCategory()
        ).subscribe({
            next: () => {
                this.sentenceService.reloadStock();
                this.messageService.add({
                    severity: 'success', summary: 'Added', life: 3000
                });
                this.resetForm();
            },
            error: () => this.saving.set(false)
        });
    }

    resetForm() {
        this.newPolish.set('');
        this.newEnglish.set('');
        this.newCategory.set('');
        this.submitted = false;
        this.saving.set(false);
        this.showForm.set(false);
    }

    private processFile(file: File) {
        this.uploading.set(true);
        this.sentenceService.uploadStock(file).subscribe({
            next: (r) => {
                this.sentenceService.reloadStock();
                this.messageService.add({
                    severity: 'success', summary: 'Uploaded',
                    detail: `${r.added} sentences added`, life: 3000
                });
                this.uploading.set(false);
            },
            error: () => this.uploading.set(false)
        });
    }

    onFileSelected(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const allowed = ['.xlsx', '.xls'];
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!allowed.includes(ext)) {
            this.messageService.add({
                severity: 'error', summary: 'Invalid file',
                detail: 'Only .xlsx and .xls files are allowed', life: 4000
            });
            return;
        }

        this.uploading.set(true);
        this.messageService.add({
            severity: 'info', summary: 'Processing',
            detail: 'Translating sentences with AI, this may take a moment...', life: 8000
        });

        this.sentenceService.uploadStock(file).subscribe({
            next: (r) => {
                this.sentenceService.reloadStock();
                this.messageService.add({
                    severity: 'success', summary: 'Uploaded',
                    detail: `${r.added} sentences added and translated`, life: 4000
                });
                this.uploading.set(false);
                (event.target as HTMLInputElement).value = '';
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error', summary: 'Upload failed',
                    detail: err?.error?.message ?? 'Could not process file', life: 4000
                });
                this.uploading.set(false);
            }
        });
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.dragOver.set(true);
    }

    onDragLeave() {
        this.dragOver.set(false);
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.dragOver.set(false);

        const file = event.dataTransfer?.files?.[0];
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
            this.processFile(file);
        } else if (file) {
            this.messageService.add({
                severity: 'error', summary: 'Invalid file',
                detail: 'Please drop a valid Excel file (.xlsx or .xls)', life: 3000
            });
        }
    }

    confirmDelete(s: SentenceStockDto) {
        this.confirmationService.confirm({
            message: `Delete sentence "${s.polish}"?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.sentenceService.deleteStock(s.id).subscribe({
                    next: () => this.sentenceService.reloadStock()
                });
            }
        });
    }

    openAssignModal(s: SentenceStockDto) {
        this.selectedSentence.set(s);
        this.assignUserId.set(null);
        this.assignDueDate.set(null);
        this.showAssignModal.set(true);
    }

    submitAssignment() {
        const sentence = this.selectedSentence();
        const userId = this.assignUserId();
        const dueDate = this.assignDueDate();

        if (!sentence || !userId || !dueDate) {
            this.messageService.add({ 
                severity: 'warn', 
                summary: 'Validation Error', 
                detail: 'Please fill in all fields.' 
            });
            return;
        }

        const formattedDate = dueDate.toISOString().split('T')[0];
        const sentenceSetId = undefined;
        const sentenceStockId = sentence.id;
        
        this.assigning.set(true);
        this.sentenceService.assign(userId, formattedDate, sentenceSetId, sentenceStockId).subscribe({
            next: () => {
                this.messageService.add({ 
                    severity: 'success', 
                    summary: 'Sentence assigned!' 
                });
                this.showAssignModal.set(false);
                this.assigning.set(false);
            },
            error: (err) => {
                this.messageService.add({ 
                    severity: 'error', 
                    summary: 'Error', 
                    detail: err?.error?.message ?? 'Could not assign sentence' 
                });
                this.assigning.set(false);
            }
        });
    }

    onGlobalFilter(table: any, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    reload() { this.sentenceService.reloadStock(); }
}