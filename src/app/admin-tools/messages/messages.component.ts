import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AnnouncementService, AnnouncementInboxDto } from '../../services/announcement.service';
import { AvatarComponent } from '../../other/avatar/avatar.component';

@Component({
    selector: 'app-messages',
    standalone: true,
    imports: [CommonModule, ButtonModule, TagModule, ToastModule, AvatarComponent],
    providers: [MessageService],
    templateUrl: './messages.component.html'
})
export class MessagesComponent implements OnInit {
    private announcementService = inject(AnnouncementService);
    private messageService      = inject(MessageService);

    messages = signal<AnnouncementInboxDto[]>([]);
    loading  = signal(true);
    selected = signal<AnnouncementInboxDto | null>(null);

    unread = () => this.messages().filter(m => !m.isRead).length;

    ngOnInit() {
        this.load();
    }

    load() {
        this.announcementService.getInbox().subscribe({
            next: (d) => { this.messages.set(d); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    getTypeColor(type: string): string {
        switch (type) {
            case 'Listing': return '#10B981';
            case 'Voting': return '#F59E0B';
            default: return '#3B82F6';
        }
    }

    open(msg: AnnouncementInboxDto) {
        this.selected.set(msg);
        if (!msg.isRead) {
            this.announcementService.markRead(msg.id).subscribe({
                next: () => {
                    this.messages.update(list =>
                        list.map(m => m.id === msg.id ? { ...m, isRead: true } : m)
                    );
                    this.selected.update(curr => curr ? { ...curr, isRead: true } : null);
                    this.announcementService.refreshUnreadCount();
                }
            });
        }
    }

    back() {
        this.selected.set(null);
    }

    onSignUp(msg: AnnouncementInboxDto) {
        this.announcementService.signUp(msg.id).subscribe({
            next: () => {
                const updatedStatus = !msg.signedUp;
                this.messages.update(list => list.map(m => m.id === msg.id ? { ...m, signedUp: updatedStatus } : m));
                this.selected.update(curr => curr ? { ...curr, signedUp: updatedStatus } : null);
                
                this.messageService.add({
                    severity: 'success', summary: 'Status updated',
                    detail: updatedStatus ? 'Signed up successfully' : 'Registration cancelled'
                });
            }
        });
    }

    onVote(msg: AnnouncementInboxDto, value: boolean) {
        this.announcementService.vote(msg.id, value).subscribe({
            next: () => {
                this.messages.update(list => list.map(m => m.id === msg.id ? { ...m, vote: value } : m));
                this.selected.update(curr => curr ? { ...curr, vote: value } : null);

                this.messageService.add({
                    severity: 'success', summary: 'Vote registered',
                    detail: `You voted: ${value ? 'Yes' : 'No'}`
                });
            }
        });
    }

    markAllRead() {
        this.announcementService.markAllRead().subscribe({
            next: () => {
                this.messages.update(list => list.map(m => ({ ...m, isRead: true })));
                this.announcementService.refreshUnreadCount();
                this.messageService.add({
                    severity: 'success', summary: 'Done',
                    detail: 'All messages marked as read', life: 3000
                });
            }
        });
    }
}