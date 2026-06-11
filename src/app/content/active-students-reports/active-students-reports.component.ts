import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { UserService } from '../../services/user.service'; // Dostosuj ścieżkę
import { SentenceService } from '../../services/sentence.service'; // Dostosuj ścieżkę
import { AvatarComponent } from '../../other/avatar/avatar.component';

@Component({
    selector: 'app-active-students-reports',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, 
        ToastModule, DatePickerModule, AvatarComponent
    ],
    providers: [MessageService],
    templateUrl: './active-students-reports.component.html'
})
export class ActiveStudentsReportsComponent {
    private userService = inject(UserService);
    private sentenceService = inject(SentenceService);
    private messageService = inject(MessageService);

    dateFrom = signal<Date | null>(null);
    dateTo = signal<Date | null>(null);
    
    downloadingZip = signal(false);

    activeStudents = computed(() => {
        const allUsers = this.userService.users.value() || [];
        return allUsers.filter(u => u.role === 'User' || !u.role);
    });

    loadingUsers = computed(() => this.userService.users.isLoading());

    downloadZip() {
        const from = this.dateFrom();
        const to = this.dateTo();
        if (!from || !to) return;

        this.downloadingZip.set(true);

        const fromStr = this.toDateStr(from);
        const toStr = this.toDateStr(to);

        this.sentenceService.downloadAllActiveReportsZip(fromStr, toStr).subscribe({
            next: (blob) => {
                const fileName = `Reports_Active_Users_${fromStr}_${toStr}.zip`;
                this.triggerDownload(blob, fileName);
                
                this.messageService.add({
                    severity: 'success', 
                    summary: 'Downloaded', 
                    detail: 'ZIP package downloaded successfully.', 
                    life: 3000 
                });
                this.downloadingZip.set(false);
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error', 
                    summary: 'Error', 
                    detail: 'Failed to generate reports package.', 
                    life: 4000 
                });
                this.downloadingZip.set(false);
            }
        });
    }

    private toDateStr(d: Date): string {
        return d.toLocaleDateString('sv-SE');
    }

    private triggerDownload(blob: Blob, filename: string) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
}