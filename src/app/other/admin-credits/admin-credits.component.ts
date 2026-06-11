import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { AvatarComponent } from '../avatar/avatar.component';

interface StudentCreditSummary {
    userId: number;
    username: string;
    avatarUrl?: string;
    totalCredits: number;
    creditsEarned: number;
    creditsSpent: number;
    purchaseCount: number;
}

interface AdminCreditDetailDto {
    userId: number;
    username: string;
    avatarUrl?: string;
    totalCredits: number;
    creditsEarned: number;
    creditsSpent: number;
    history: { amount: number; reason: string; date: string; type: string }[];
    purchases: { id: number; itemName: string; iconEmoji?: string;
                 creditCost: number; purchaseDate: string; status: string }[];
}

type SeverityType = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

@Component({
    selector: 'app-admin-credits',
    standalone: true,
    imports: [CommonModule, ButtonModule, TagModule, ToastModule, AvatarComponent],
    providers: [MessageService],
    templateUrl: './admin-credits.component.html'
})
export class AdminCreditsComponent implements OnInit {
    private http = inject(HttpClient);
    private messageService = inject(MessageService);

    students = signal<StudentCreditSummary[]>([]);
    selected = signal<AdminCreditDetailDto | null>(null);
    loading = signal(true);
    loadingDetail = signal(false);
    updatingStatus = signal<number | null>(null);

    ngOnInit() {
        this.http.get<StudentCreditSummary[]>('/api/admin/credits/summary')
            .subscribe({
                next: d => { this.students.set(d); this.loading.set(false); },
                error: () => this.loading.set(false)
            });
    }

    openStudent(s: StudentCreditSummary) {
        this.loadingDetail.set(true);
        this.http.get<AdminCreditDetailDto>(`/api/admin/credits/student/${s.userId}`)
            .subscribe({
                next: d => { 
                    this.selected.set({ ...d, avatarUrl: d.avatarUrl || s.avatarUrl }); 
                    this.loadingDetail.set(false); 
                },
                error: () => this.loadingDetail.set(false)
            });
    }

    updatePurchaseStatus(purchaseId: number, status: string) {
        this.updatingStatus.set(purchaseId);
        this.http.patch(`/api/admin/credits/purchase/${purchaseId}/status`,
            { status }).subscribe({
            next: () => {
                this.selected.update(d => d ? {
                    ...d,
                    purchases: d.purchases.map(p =>
                        p.id === purchaseId ? { ...p, status } : p)
                } : d);
                this.updatingStatus.set(null);
                this.messageService.add({
                    severity: 'success', summary: 'Updated', life: 2000 });
            },
            error: () => this.updatingStatus.set(null)
        });
    }

    statusSeverity(s: string): SeverityType {
        if (s === 'Fulfilled') return 'success';
        if (s === 'Cancelled') return 'danger';
        return 'warn';
    }
}