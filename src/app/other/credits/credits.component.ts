import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ProgressBarModule } from 'primeng/progressbar';
import { CreditService, CreditSummaryDto, ShopItemDto } from '../../services/credit.service';

type SeverityType = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined;
type Tab = 'shop' | 'history' | 'purchases';

@Component({
    selector: 'app-credits',
    standalone: true,
    imports: [CommonModule, ButtonModule, TagModule, ToastModule,
              TooltipModule, ProgressBarModule],
    providers: [MessageService],
    templateUrl: './credits.component.html'
})
export class CreditsComponent implements OnInit {
    private creditService = inject(CreditService);
    private messageService = inject(MessageService);

    tabs: { id: Tab; label: string }[] = [
        { id: 'shop', label: '🛍️ Shop' },
        { id: 'history', label: '📜 Credit History' },
        { id: 'purchases', label: '📦 My purchases' }
    ];

    summary = signal<CreditSummaryDto | null>(null);
    shop = signal<ShopItemDto[]>([]);
    loading = signal(true);
    buying = signal<number | null>(null);
    activeTab = signal<Tab>('shop');

    earnedHistory = computed(() =>
        (this.summary()?.history ?? []).filter(h => h.type === 'earned')
    );

    spentHistory = computed(() =>
        (this.summary()?.history ?? []).filter(h => h.type === 'spent')
    );

    dailyChallengeToday = computed(() => {
        const today = new Intl.DateTimeFormat('sv-SE').format(new Date());
        return this.summary()?.history
            .some(h => h.date === today
                    && h.reason === 'Daily challenge: 75 flashcards') ?? false;
    });

    weeklyChallengeThisWeek = computed(() => {
        const today = new Date();
        const dow = (today.getDay() + 6) % 7;
        const monday = new Date(today);
        monday.setDate(today.getDate() - dow);
        const mondayStr = new Intl.DateTimeFormat('sv-SE').format(monday);
        return this.summary()?.history
            .some(h => h.date >= mondayStr
                    && h.reason === 'Weekly challenge: 300 flashcards') ?? false;
    });

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.loading.set(true);
        this.creditService.getSummary().subscribe({
            next: s => {
                this.summary.set(s);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
        this.creditService.getShopItems().subscribe({
            next: items => this.shop.set(items)
        });
    }

    buy(item: ShopItemDto) {
        if (!item.canAfford) return;
        this.buying.set(item.id);
        this.creditService.purchase(item.id).subscribe({
            next: result => {
                this.messageService.add({
                    severity: 'success',
                    summary:  'Purchased!',
                    detail:   result.message,
                    life:     4000
                });
                this.loadData();
                this.buying.set(null);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary:  'Error',
                    detail:   'Purchase failed.',
                    life:     3000
                });
                this.buying.set(null);
            }
        });
    }

    statusSeverity(status: string): SeverityType {
        if (status === 'Fulfilled') return 'success';
        if (status === 'Cancelled') return 'danger';
        return 'warn';
    }
}