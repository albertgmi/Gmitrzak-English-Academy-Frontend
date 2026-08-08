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
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { AnnouncementDetailsDto } from '../../services/announcement.service';
import { AvatarComponent } from '../../other/avatar/avatar.component';

@Component({
    selector: 'app-announcements',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule,
        InputTextModule, TextareaModule, SelectModule, TagModule,
        ToolbarModule, ToastModule, ConfirmDialogModule, CheckboxModule,
        MultiSelectModule, IconFieldModule, InputIconModule, DialogModule,
        TooltipModule, AvatarComponent
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
    
    type = signal('Announcement');

    announcementTypes = [
        { label: 'Standard Announcement', value: 'Announcement' },
        { label: 'Listing (Sign up option)', value: 'Listing' },
        { label: 'Voting (Yes/No poll)', value: 'Voting' }
    ];

    selectedAnnouncementDetails = signal<AnnouncementDetailsDto | null>(null);
    selectedAnnouncementForView = signal<AnnouncementDto | null>(null);

    showDetailsDialog = signal(false);

    truncateText(text: string, limit: number = 80): string {
        if (!text) return '';
        return text.length > limit ? text.substring(0, limit) + '...' : text;
    }

    viewContent(a: AnnouncementDto) {
        this.selectedAnnouncementForView.set(a);
    }

    readCount = computed(() => this.selectedAnnouncementDetails()?.recipients.filter(r => r.isRead).length ?? 0);
    registeredCount = computed(() => this.selectedAnnouncementDetails()?.recipients.filter(r => r.signedUp).length ?? 0);
    yesCount = computed(() => this.selectedAnnouncementDetails()?.recipients.filter(r => r.vote === true).length ?? 0);
    noCount = computed(() => this.selectedAnnouncementDetails()?.recipients.filter(r => r.vote === false).length ?? 0);

    getTypeColor(type: string): string {
        switch (type) {
            case 'Listing': return '#10B981';
            case 'Voting': return '#F59E0B';
            default: return '#3B82F6';
        }
    }

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

        this.announcementService.create(this.title(), this.content(), this.type(), recipients).subscribe({
            next: () => {
                this.announcementService.refreshUnreadCount();
                this.messageService.add({
                    severity: 'success', summary: 'Sent',
                    detail: 'Announcement sent successfully', life: 3000
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
        this.type.set('Announcement');
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

    showDetails(a: AnnouncementDto) {
        this.announcementService.getDetails(a.id)
            .subscribe(details => {
                this.selectedAnnouncementDetails.set(details);
                this.showDetailsDialog.set(true);
            });
    }
}