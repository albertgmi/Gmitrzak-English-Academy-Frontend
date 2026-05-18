import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TheaterService, TheaterItemDto } from '../../services/theater.service';

type SeverityType = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

@Component({
    selector: 'app-theater',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule,
        InputTextModule, TextareaModule, InputNumberModule,
        SelectModule, TagModule, IconFieldModule, InputIconModule,
        ToolbarModule, ToastModule, ConfirmDialogModule,
        DialogModule, CheckboxModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './theater.component.html'
})
export class TheaterComponent implements OnInit {
    private theaterService = inject(TheaterService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    items = this.theaterService.items;
    showDialog = signal(false);
    isEdit = signal(false);
    saving = signal(false);
    submitted = false;

    form = signal<Partial<TheaterItemDto>>({
        title: '', description: '', url: '', thumbnailUrl: '',
        mediaType: 'Movie', durationMinutes: 0, level: '', isActive: true
    });

    mediaTypes = [
        { label: 'Movie',   value: 'Movie' },
        { label: 'YouTube', value: 'YouTube' },
        { label: 'Podcast', value: 'Podcast' },
        { label: 'Video',   value: 'Video' },
        { label: 'Book',    value: 'Book' },
        { label: 'Article', value: 'Article' },
        { label: 'Other',   value: 'Other' }
    ];

    levels = [
        { label: 'All levels', value: '' },
        { label: 'Basic', value: 'Basic' },
        { label: 'Communicative', value: 'Communicative' },
        { label: 'Advanced', value: 'Advanced' }
    ];

    ngOnInit() {
        this.theaterService.reloadItems();
    }

    openNew() {
        this.form.set({
            title: '', description: '', url: '', thumbnailUrl: '',
            mediaType: 'Movie', durationMinutes: 0, level: '', isActive: true
        });
        this.isEdit.set(false);
        this.submitted = false;
        this.showDialog.set(true);
    }

    openEdit(item: TheaterItemDto) {
        this.form.set({ ...item });
        this.isEdit.set(true);
        this.submitted = false;
        this.showDialog.set(true);
    }

    save() {
        this.submitted = true;
        const f = this.form();
        if (!f.title?.trim() || !f.url?.trim()) return;

        this.saving.set(true);
        const action = this.isEdit()
            ? this.theaterService.update(f.id!, f)
            : this.theaterService.create(f);

        action.subscribe({
            next: () => {
                this.theaterService.reloadItems();
                this.messageService.add({
                    severity: 'success', summary: this.isEdit() ? 'Updated' : 'Created',
                    detail: `"${f.title}" ${this.isEdit() ? 'updated' : 'added'}`, life: 3000
                });
                this.showDialog.set(false);
                this.saving.set(false);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error', summary: 'Error', detail: 'Operation failed', life: 3000
                });
                this.saving.set(false);
            }
        });
    }

    toggleActive(item: TheaterItemDto) {
        this.theaterService.toggleActive(item.id).subscribe({
            next: () => this.theaterService.reloadItems(),
            error: () => this.messageService.add({
                severity: 'error', summary: 'Error', detail: 'Failed to toggle', life: 3000
            })
        });
    }

    confirmDelete(item: TheaterItemDto) {
        this.confirmationService.confirm({
            message: `Delete "${item.title}"?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.theaterService.delete(item.id).subscribe({
                    next: () => {
                        this.theaterService.reloadItems();
                        this.messageService.add({
                            severity: 'success', summary: 'Deleted', life: 3000
                        });
                    }
                });
            }
        });
    }

    mediaTypeSeverity(type: string): SeverityType {
        const map: Record<string, SeverityType> = {
            Movie: 'info', YouTube: 'danger', Podcast: 'warn',
            Video: 'info', Book: 'success', Article: 'secondary', Other: 'secondary'
        };
        return map[type] ?? 'info';
    }

    onGlobalFilter(table: any, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    reload() {
        this.theaterService.reloadItems();
    }
}