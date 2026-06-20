import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { MessageService } from 'primeng/api';
import { ProgressBarModule } from 'primeng/progressbar';
import { CreditService, CreditSummaryDto, ShopItemDto, PendingAssignmentOption } from '../../services/credit.service';
import { AuthService } from '../../services/auth.service';

type SeverityType = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined;
type Tab = 'shop' | 'history' | 'purchases';

@Component({
    selector: 'app-credits',
    standalone: true,
    imports: [CommonModule, ButtonModule, TagModule, ToastModule,
              TooltipModule, ProgressBarModule, DialogModule, DropdownModule, CalendarModule, FormsModule],
    providers: [MessageService],
    templateUrl: './credits.component.html',
    styleUrl: './credits.component.scss'
})
export class CreditsComponent implements OnInit {
    private creditService = inject(CreditService);
    private authService = inject(AuthService);
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

    skipDialogVisible = signal(false);
    selectedSkipItem = signal<ShopItemDto | null>(null);
    selectedAssignmentId = signal<number | null>(null);
    pendingAssignments = signal<PendingAssignmentOption[]>([]);
    loadingAssignments = signal(false);

    extendDialogVisible = signal(false);
    selectedExtendItem = signal<ShopItemDto | null>(null);
    selectedExtendAssignmentId = signal<number | null>(null);
    selectedExtendCurrentDeadline = signal<string | null>(null);
    selectedNewDueDate = signal<Date | null>(null);
    extendableAssignments = signal<PendingAssignmentOption[]>([]);
    loadingExtendable = signal(false);

    showCoinRain = signal(false);
    coinRainItems = signal<{ left: number; delay: number; duration: number; emoji: string }[]>([]);

    minExtendDate = computed(() => {
        const deadline = this.selectedExtendCurrentDeadline();
        if (!deadline) return new Date();
        const d = new Date(deadline);
        const nextDay = new Date(d);
        nextDay.setDate(d.getDate() + 1);
        return nextDay;
    });

    maxExtendDate = computed(() => {
        const min = this.minExtendDate();
        const max = new Date(min);
        max.setDate(min.getDate() + 6);
        return max;
    });

    earnedHistory = computed(() =>
        (this.summary()?.history ?? []).filter(h => h.type === 'earned')
    );

    spentHistory = computed(() =>
        (this.summary()?.history ?? []).filter(h => h.type === 'spent')
    );

    dailyChallengeToday = computed(() => {
        const todayStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Warsaw' }).format(new Date());
        return this.summary()?.history
            .some(h => h.date === todayStr
                    && h.reason === 'Daily challenge: 75 flashcards') ?? false;
    });

    weeklyChallengeThisWeek = computed(() => {
        const today = new Date();
        const dow = (today.getDay() + 6) % 7;
        const monday = new Date(today);
        monday.setDate(today.getDate() - dow);
        const mondayStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Warsaw' }).format(monday);

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

        if (item.name === 'Homework Skip') {
            this.selectedSkipItem.set(item);
            this.loadPendingAssignments();
            this.skipDialogVisible.set(true);
            return;
        }

        if (item.name === 'Homework Extension') {
            this.selectedExtendItem.set(item);
            this.loadExtendableAssignments();
            this.extendDialogVisible.set(true);
            return;
        }

        this.buying.set(item.id);

        const purchase$ = item.name === '2× Points Boost'
            ? this.creditService.purchasePointsBoost()
            : this.creditService.purchase(item.id);

        purchase$.subscribe({
            next: result => this.handlePurchaseSuccess(result),
            error: () => this.handlePurchaseError()
        });
    }

    confirmHomeworkSkip() {
        const item = this.selectedSkipItem();
        const assignmentId = this.selectedAssignmentId();

        if (!item || !assignmentId) return;

        this.buying.set(item.id);

        this.creditService.purchaseHomeworkSkip(item.id, assignmentId).subscribe({
            next: (result: any) => {
                this.handlePurchaseSuccess(result);
                this.skipDialogVisible.set(false);
                this.selectedAssignmentId.set(null);
                this.loadPendingAssignments();
            },
            error: () => this.handlePurchaseError()
        });
    }

    confirmHomeworkExtension() {
        const item = this.selectedExtendItem();
        const assignmentId = this.selectedExtendAssignmentId();
        const newDate = this.selectedNewDueDate();

        if (!item || !assignmentId || !newDate) return;

        const formatted = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Warsaw' }).format(newDate);

        this.buying.set(item.id);

        this.creditService.purchaseHomeworkExtension(item.id, assignmentId, formatted).subscribe({
            next: (result: any) => {
                this.handlePurchaseSuccess(result);
                this.extendDialogVisible.set(false);
                this.selectedExtendAssignmentId.set(null);
                this.selectedExtendCurrentDeadline.set(null);
                this.selectedNewDueDate.set(null);
                this.loadExtendableAssignments();
            },
            error: () => this.handlePurchaseError()
        });
    }

    onSelectExtendAssignment(assignmentId: number) {
        this.selectedExtendAssignmentId.set(assignmentId);

        const opt = this.extendableAssignments()
            .find(a => a.value == assignmentId);

        this.selectedExtendCurrentDeadline.set(opt?.deadline ?? null);
        this.selectedNewDueDate.set(null);
    }

    private loadPendingAssignments() {
        const userId = this.authService.getUserId();
        if (!userId) {
            this.pendingAssignments.set([]);
            return;
        }

        this.loadingAssignments.set(true);

        this.creditService.getPendingAssignments(userId)
        .subscribe({
            next: ({ modules, matrices }) => {
                const pendingModules = modules
                    .filter(a => !a.isCompleted)
                    .map(a => ({
                        label: a.dueDate
                            ? `[Module][Due date: ${new Date(a.dueDate).toLocaleDateString()}] ${a.moduleName}`
                            : `[Module] ${a.moduleName}`,
                        value: a.id,
                        deadline: a.dueDate
                    }));

                const pendingMatrixModules = matrices.flatMap(matrixAssignment =>
                    matrixAssignment.modules
                        .filter(m => m.isUnlocked && !m.isCompleted)
                        .map(m => ({
                            label: `[Matrix: ${matrixAssignment.matrixName}][Due date: ${new Date(m.deadline).toLocaleDateString()}] ${m.moduleName}`,
                            value: -m.matrixModuleId,
                            deadline: m.deadline
                        }))
                );

                this.pendingAssignments.set([...pendingModules, ...pendingMatrixModules]);
                this.loadingAssignments.set(false);
            },
            error: () => {
                this.pendingAssignments.set([]);
                this.loadingAssignments.set(false);
            }
        });
    }

    private loadExtendableAssignments() {
        const userId = this.authService.getUserId();
        if (!userId) {
            this.extendableAssignments.set([]);
            return;
        }

        this.loadingExtendable.set(true);

        this.creditService.getPendingAssignments(userId)
        .subscribe({
            next: ({ modules, matrices }) => {
                const extendableModules = modules
                    .filter(a => !a.isCompleted)
                    .map(a => ({
                        label: a.dueDate
                            ? `[Module][Due date: ${new Date(a.dueDate).toLocaleDateString()}] ${a.moduleName}`
                            : `[Module] ${a.moduleName}`,
                        value: a.id,
                        deadline: a.dueDate
                    }));

                const extendableMatrixModules = matrices.flatMap(matrixAssignment =>
                    matrixAssignment.modules
                        .filter(m => m.isUnlocked && !m.isCompleted)
                        .map(m => ({
                            label: `[Matrix: ${matrixAssignment.matrixName}][Due date: ${new Date(m.deadline).toLocaleDateString()}] ${m.moduleName}`,
                            value: -m.matrixModuleId,
                            deadline: m.deadline
                        }))
                );

                this.extendableAssignments.set([...extendableModules, ...extendableMatrixModules]);
                this.loadingExtendable.set(false);
            },
            error: () => {
                this.extendableAssignments.set([]);
                this.loadingExtendable.set(false);
            }
        });
    }

    private triggerCoinRain() {
        const emojis = ['💰', '🪙', '✨'];
        const items = Array.from({ length: 24 }, () => ({
            left: Math.random() * 100,
            delay: Math.random() * 0.6,
            duration: 1.8 + Math.random() * 1.2,
            emoji: emojis[Math.floor(Math.random() * emojis.length)]
        }));
        this.coinRainItems.set(items);
        this.showCoinRain.set(true);
        setTimeout(() => this.showCoinRain.set(false), 3000);
    }

    private handlePurchaseSuccess(result: any) {
        this.messageService.add({
            severity: result.success ? 'success' : 'error',
            summary:  result.success ? '🎉 Success!' : 'Action failed',
            detail:   result.message,
            life:     4000
        });
        if (result.success) {
            this.loadData();
            this.triggerCoinRain();
        }
        this.buying.set(null);
    }

    private handlePurchaseError() {
        this.messageService.add({
            severity: 'error',
            summary:  'Error',
            detail:   'An error occurred while processing the purchase.',
            life:     3000
        });
        this.buying.set(null);
    }

    statusSeverity(status: string): SeverityType {
        if (status === 'Fulfilled') return 'success';
        if (status === 'Cancelled') return 'danger';
        return 'warn';
    }
}