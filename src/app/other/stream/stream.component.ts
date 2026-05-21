import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { MessageService, ConfirmationService } from 'primeng/api';
import { StreamService, StreamEntryListDto } from '../../services/stream.service';
import { UserService } from '../../services/user.service';

@Component({
    selector: 'app-stream',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule,
        InputTextModule, IconFieldModule, InputIconModule,
        SelectModule, ToolbarModule, ToastModule,
        ConfirmDialogModule, TagModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './stream.component.html'
})
export class StreamComponent implements OnInit {
    private streamService = inject(StreamService);
    private userService = inject(UserService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    entries = this.streamService.entries;
    selectedEntries = signal<StreamEntryListDto[]>([]);
    showAddForm = signal(false);
    saving = signal(false);
    submitted = false;

    newUserId = signal<number | null>(null);
    newCommand = signal('');
    newPayload = signal('');

    filterUserId = signal<number | null>(null);

    users = computed(() =>
        (this.userService.users.value() ?? [])
            .map(u => ({ id: u.id, label: `${u.username} (${u.email})` }))
    );

    allUsers = computed(() =>
        (this.userService.users.value() ?? [])
            .map(u => ({ id: u.id, label: u.username }))
    );

    filteredEntries = computed(() => {
        const all = this.entries.value() ?? [];
        const uid = this.filterUserId();
        return uid ? all.filter(e => e.userId === uid) : all;
    });

    ngOnInit() {
        this.streamService.reloadEntries();
        this.userService.users.reload();
    }

    openAddForm() {
        this.newUserId.set(null);
        this.newCommand.set('');
        this.newPayload.set('');
        this.submitted = false;
        this.showAddForm.set(true);
    }

    closeAddForm() {
        this.showAddForm.set(false);
        this.submitted = false;
    }

    addEntry() {
        this.submitted = true;
        const uid = this.newUserId();
        const cmd = this.newCommand().trim();
        if (!uid || !cmd) return;

        this.saving.set(true);
        this.streamService.create(uid, cmd, this.newPayload()).subscribe({
            next: () => {
                this.streamService.reloadEntries();
                this.messageService.add({
                    severity: 'success', summary: 'Added',
                    detail: 'Stream entry created', life: 3000
                });
                this.closeAddForm();
                this.saving.set(false);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error', summary: 'Error',
                    detail: 'Failed to create entry', life: 3000
                });
                this.saving.set(false);
            }
        });
    }

    confirmDelete(entry: StreamEntryListDto) {
        this.confirmationService.confirm({
            message: `Delete entry "${entry.command}"?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.streamService.delete(entry.id).subscribe({
                    next: () => {
                        this.streamService.reloadEntries();
                        this.messageService.add({
                            severity: 'success', summary: 'Deleted', life: 3000
                        });
                    }
                });
            }
        });
    }

    confirmDeleteSelected() {
        const ids = this.selectedEntries().map(e => e.id);
        if (!ids.length) return;

        this.confirmationService.confirm({
            message: `Delete ${ids.length} selected entries?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.streamService.deleteMultiple(ids).subscribe({
                    next: () => {
                        this.streamService.reloadEntries();
                        this.selectedEntries.set([]);
                        this.messageService.add({
                            severity: 'success', summary: 'Deleted',
                            detail: `${ids.length} entries deleted`, life: 3000
                        });
                    }
                });
            }
        });
    }

    onGlobalFilter(table: any, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    reload() {
        this.streamService.reloadEntries();
    }
}