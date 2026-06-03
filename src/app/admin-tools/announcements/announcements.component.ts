import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AnnouncementService, AnnouncementDto } from '../../services/announcement.service';
import { UserService } from '../../services/user.service';
import { MultiSelectModule } from 'primeng/multiselect';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
    selector: 'app-announcements',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule,
        InputTextModule, TextareaModule, SelectModule, TagModule,
        ToolbarModule, ToastModule, ConfirmDialogModule, CheckboxModule,
        MultiSelectModule, IconFieldModule, InputIconModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './announcements.component.html'
})
export class AnnouncementsComponent implements OnInit {
    private announcementService = inject(AnnouncementService);
    private userService = inject(UserService);
    private messageService= inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    announcements = signal<AnnouncementDto[]>([]);
    loading = signal(true);
    showForm = signal(false);
    saving = signal(false);
    submitted = false;
    sendToAll = signal(true);

    title = signal('');
    content = signal('');
    selectedRecipients = signal<number[]>([]);

    students = computed(() =>
        (this.userService.users.value() ?? [])
            .filter(u => u.role === 'User')
            .map(u => ({ id: u.id, label: `${u.username} (${u.email})` }))
    );

    ngOnInit() {
        this.loadAnnouncements();
        this.userService.users.reload();
    }

    loadAnnouncements() {
        this.announcementService.getAll().subscribe({
            next: (d) => { this.announcements.set(d); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    send() {
        this.submitted = true;
        if (!this.title().trim() || !this.content().trim()) return;

        this.saving.set(true);
        const recipients = this.sendToAll() ? undefined : this.selectedRecipients();

        this.announcementService.create(this.title(), this.content(), recipients).subscribe({
            next: () => {
                this.announcementService.refreshUnreadCount();
                this.messageService.add({
                    severity: 'success', summary: 'Sent',
                    detail: 'Announcement sent', life: 3000
                });
                this.reset();
                this.loadAnnouncements();
            },
            error: () => {
                this.messageService.add({
                    severity: 'error', summary: 'Error', detail: 'Failed to send', life: 3000
                });
                this.saving.set(false);
            }
        });
    }

    reset() {
        this.title.set('');
        this.content.set('');
        this.selectedRecipients.set([]);
        this.sendToAll.set(true);
        this.submitted = false;
        this.saving.set(false);
        this.showForm.set(false);
    }

    confirmDelete(ann: AnnouncementDto) {
        this.confirmationService.confirm({
            message: `Delete announcement "${ann.title}"?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.announcementService.delete(ann.id).subscribe({
                    next: () => {
                        this.announcements.update(list => list.filter(a => a.id !== ann.id));
                        this.messageService.add({
                            severity: 'success', summary: 'Deleted', life: 3000
                        });
                    }
                });
            }
        });
    }

    onGlobalFilter(table: any, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }
}