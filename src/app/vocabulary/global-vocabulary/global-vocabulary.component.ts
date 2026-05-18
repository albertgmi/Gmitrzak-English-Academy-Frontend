import { Component, inject, OnInit, signal } from '@angular/core';
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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ChipModule } from 'primeng/chip';
import { DialogModule } from 'primeng/dialog'; 
import { MessageService, ConfirmationService } from 'primeng/api';
import { VocabularyService, VocabularyAddingRequest, VocabularyDto } from '../../services/vocabulary.service';

@Component({
    selector: 'app-global-vocabulary',
    standalone: true,
    imports: [
        CommonModule, 
        FormsModule, 
        RouterModule,
        TableModule, 
        ButtonModule, 
        InputTextModule,
        IconFieldModule, 
        InputIconModule, 
        TagModule,
        ToolbarModule, 
        ToastModule, 
        ConfirmDialogModule,
        TooltipModule, 
        ChipModule,
        DialogModule 
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './global-vocabulary.component.html'
})
export class GlobalVocabularyComponent implements OnInit {
    private vocabularyService = inject(VocabularyService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    vocabularyItems = signal<VocabularyDto[]>([]);
    isLoading = signal<boolean>(false);
    selectedVocabulary = signal<VocabularyDto | null>(null);

    showDialog = signal<boolean>(false);
    saving = signal<boolean>(false);
    submitted = false;
    
    editingVocabularyId = signal<number | null>(null);

    form = signal<VocabularyAddingRequest>({
        front: '',
        back: '',
        category: ''
    });

    ngOnInit(): void {
        this.loadVocabulary();
    }

    loadVocabulary(): void {
        this.isLoading.set(true);
        this.vocabularyService.getAllVocabulary().subscribe({
            next: (data: VocabularyDto[]) => {
                this.vocabularyItems.set(data);
                this.isLoading.set(false);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to fetch vocabulary.',
                    life: 3000
                });
                this.isLoading.set(false);
            }
        });
    }

    openNew(): void {
        this.editingVocabularyId.set(null);
        this.form.set({
            front: '',
            back: '',
            category: ''
        });
        this.submitted = false;
        this.showDialog.set(true);
    }

    openEdit(item: VocabularyDto): void {
        if (!item.id) return;
        
        this.editingVocabularyId.set(item.id);
        this.form.set({
            front: item.front,
            back: item.back,
            category: item.category
        });
        this.submitted = false;
        this.showDialog.set(true);
    }

    save(): void {
        this.submitted = true;
        const f = this.form();

        if (!f.front?.trim() || !f.back?.trim() || !f.category?.trim()) {
            return;
        }

        this.saving.set(true);
        
        const requestPayload: VocabularyAddingRequest = {
            front: f.front.trim(),
            back: f.back.trim(),
            category: f.category.trim()
        };

        const currentId = this.editingVocabularyId();

        if (currentId !== null) {
            this.vocabularyService.updateVocabulary(requestPayload, currentId).subscribe({
                next: () => {
                    this.loadVocabulary();
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Updated',
                        detail: `Vocabulary item has been updated successfully.`,
                        life: 3000
                    });
                    this.showDialog.set(false);
                    this.saving.set(false);
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Could not update vocabulary. Server error.',
                        life: 3000
                    });
                    this.saving.set(false);
                }
            });
        } else {
            this.vocabularyService.createVocabulary(requestPayload).subscribe({
                next: () => {
                    this.loadVocabulary();
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Created',
                        detail: `Vocabulary item "${requestPayload.front}" has been created.`,
                        life: 3000
                    });
                    this.showDialog.set(false);
                    this.saving.set(false);
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Could not create vocabulary. Server error.',
                        life: 3000
                    });
                    this.saving.set(false);
                }
            });
        }
    }

    selectVocabulary(item: VocabularyDto): void {
        this.selectedVocabulary.set(item);
    }

    backToList(): void {
        this.selectedVocabulary.set(null);
    }

    onGlobalFilter(table: any, event: Event): void {
        const element = event.target as HTMLInputElement;
        if (element) {
            table.filterGlobal(element.value, 'contains');
        }
    }

    reload(): void {
        this.loadVocabulary();
    }
}