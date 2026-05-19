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
import { MessageService, ConfirmationService } from 'primeng/api';
import { CatalogueService, CatalogueDto, CatalogueEntryDto } from '../../services/catalogue.service';

type View = 'list' | 'entries';

@Component({
    selector: 'app-catalogues',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule,
        InputTextModule, IconFieldModule, InputIconModule,
        SelectModule, DatePickerModule, TagModule,
        ToolbarModule, ToastModule, ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './catalogues.component.html'
})
export class CataloguesComponent implements OnInit {
    private catalogueService = inject(CatalogueService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    catalogues = computed(() => this.catalogueService.catalogues.value());
    view = signal<View>('list');
    selectedCatalogue = signal<CatalogueDto | null>(null);

    uploading = signal(false);
    dragOver = signal(false);

    entries = signal<CatalogueEntryDto[]>([]);
    loadingEntries = signal(false);

    filterUserRef = signal('');
    filterDateFrom = signal<Date | null>(null);
    filterDateTo = signal<Date | null>(null);

    catalogueOptions = computed(() =>
        (this.catalogueService.catalogues.value() ?? [])
            .map(c => ({ label: c.name, value: c.name }))
    );

    ngOnInit() {
        this.catalogueService.reloadCatalogues();
    }

    onFileSelected(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) this.uploadFile(file);
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        this.dragOver.set(false);
        const file = event.dataTransfer?.files?.[0];
        if (file) this.uploadFile(file);
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
        this.dragOver.set(true);
    }

    onDragLeave() {
        this.dragOver.set(false);
    }

    uploadFile(file: File) {
        const allowed = ['.xlsx', '.xls'];
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!allowed.includes(ext)) {
            this.messageService.add({
                severity: 'error', summary: 'Invalid file',
                detail: 'Only .xlsx and .xls files are allowed', life: 3000
            });
            return;
        }

        this.uploading.set(true);
        this.catalogueService.uploadCatalogue(file).subscribe({
            next: (result) => {
                this.catalogueService.reloadCatalogues();
                this.messageService.add({
                    severity: 'success', summary: 'Uploaded',
                    detail: `Catalogue "${result.name}" uploaded with ${result.entryCount} entries`,
                    life: 4000
                });
                this.uploading.set(false);
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

    viewEntries(catalogue: CatalogueDto) {
        this.selectedCatalogue.set(catalogue);
        this.view.set('entries');
        this.loadEntries(catalogue.name);
    }

    backToList() {
        this.view.set('list');
        this.selectedCatalogue.set(null);
        this.entries.set([]);
        this.filterUserRef.set('');
        this.filterDateFrom.set(null);
        this.filterDateTo.set(null);
    }

    loadEntries(catalogueName?: string) {
        const name = catalogueName ?? this.selectedCatalogue()?.name;
        if (!name) return;

        this.loadingEntries.set(true);
        this.catalogueService.getEntries({
            catalogueName: name,
            userRef: this.filterUserRef() || undefined,
            dateFrom: this.filterDateFrom() ? this.formatDate(this.filterDateFrom()!) : undefined,
            dateTo: this.filterDateTo() ? this.formatDate(this.filterDateTo()!) : undefined
        }).subscribe({
            next: (d) => { this.entries.set(d); this.loadingEntries.set(false); },
            error: () => this.loadingEntries.set(false)
        });
    }

    onRowEditSave(entry: CatalogueEntryDto) {
        this.catalogueService.updateEntry(entry.id, { translatedEntry: entry.translatedEntry }).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Updated',
                    detail: 'Translation saved successfully', life: 2000
                });
            },
            error: () => {
                this.messageService.add({
                    severity: 'error', summary: 'Error',
                    detail: 'Failed to save translation', life: 3000
                });
                this.loadEntries();
            }
        });
    }

    applyFilters() { this.loadEntries(); }
    clearFilters() {
        this.filterUserRef.set('');
        this.filterDateFrom.set(null);
        this.filterDateTo.set(null);
        this.loadEntries();
    }

    confirmDelete(catalogue: CatalogueDto) {
        this.confirmationService.confirm({
            message: `Delete catalogue "${catalogue.name}" and all its ${catalogue.entryCount} entries?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.catalogueService.deleteCatalogue(catalogue.id).subscribe({
                    next: () => {
                        this.catalogueService.reloadCatalogues();
                        this.messageService.add({
                            severity: 'success', summary: 'Deleted',
                            detail: `Catalogue "${catalogue.name}" deleted`, life: 3000
                        });
                    },
                    error: () => this.messageService.add({
                        severity: 'error', summary: 'Error',
                        detail: 'Failed to delete catalogue', life: 3000
                    })
                });
            }
        });
    }

    onGlobalFilter(table: any, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    formatDate(date: Date): string { return date.toISOString().split('T')[0]; }
    reload() { this.catalogueService.reloadCatalogues(); }
}