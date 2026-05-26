import { Component, inject, signal, computed, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { RankingService, RankingDto, RankingEntryDto } from '../../services/ranking.service';
import { AuthService } from '../../services/auth.service';
import { AvatarComponent } from '../../other/avatar/avatar.component';
import confetti from 'canvas-confetti';

type RankingPeriod = 'weekly' | 'monthly' | 'alltime';
interface PeriodOption {
  label: string;
  value: RankingPeriod;
}

@Component({
    selector: 'app-ranking',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, TagModule,
        ToastModule, SelectButtonModule, TooltipModule, AvatarComponent
    ],
    providers: [MessageService],
    templateUrl: './ranking.component.html',
    styleUrls: ['./ranking.component.scss']
})
export class RankingComponent implements OnInit, OnDestroy {
    private rankingService = inject(RankingService);
    private authService    = inject(AuthService);
    private messageService = inject(MessageService);

    @ViewChild('particlesCanvas') particlesCanvas!: ElementRef<HTMLCanvasElement>;

    currentUserId = this.authService.getUserId();
    period        = signal<RankingPeriod>('weekly');
    ranking       = signal<RankingDto | null>(null);
    loading       = signal(true);
    animating     = signal(false);
    showPodium    = signal(false);
    showTable     = signal(false);

    private particleInterval: any = null;
    private seenPeriods = new Set<string>();

    periodOptions: PeriodOption[] = [
        { label: 'This Week', value: 'weekly'  },
        { label: 'This Month', value: 'monthly' },
        { label: 'All Time',  value: 'alltime'  }
    ];

    podiumEntries = computed(() => {
        const entries = this.ranking()?.entries ?? [];
        const p1 = entries.find(e => e.position === 1);
        const p2 = entries.find(e => e.position === 2);
        const p3 = entries.find(e => e.position === 3);
        return { p1, p2, p3 };
    });

    tableEntries = computed(() =>
        (this.ranking()?.entries ?? []).filter(e => e.position > 3)
    );

    currentUserEntry = computed(() =>
        this.ranking()?.entries.find(e => e.userId === this.currentUserId)
    );

    isCurrentUser(entry: RankingEntryDto): boolean {
        return entry.userId === this.currentUserId;
    }

    getReactionCount(entry: RankingEntryDto, emoji: string): number {
        return entry.reactions[emoji] ?? 0;
    }

    hasMyReaction(entry: RankingEntryDto, emoji: string): boolean {
        return !!(entry.reactions[emoji + '_me']);
    }

    ngOnInit() {
        this.loadRanking();
    }

    ngOnDestroy() {
        this.stopParticles();
    }

    loadRanking() {
        const p = this.period();
        this.loading.set(true);
        this.showPodium.set(false);
        this.showTable.set(false);
        this.animating.set(true);

        this.rankingService.getRanking(p).subscribe({
            next: (data) => {
                this.ranking.set(data);
                this.loading.set(false);
                this.runEntryAnimation(data);
            },
            error: () => {
                this.loading.set(false);
                this.animating.set(false);
            }
        });
    }

    setPeriod(p: RankingPeriod) {
        this.period.set(p);
        this.loadRanking();
    }

    private runEntryAnimation(data: RankingDto) {
        setTimeout(() => {
            this.showPodium.set(true);
        }, 300);

        setTimeout(() => {
            this.showTable.set(true);
            this.animating.set(false);
        }, 900);

        const periodKey = `ranking_seen_${this.period()}`;
        const alreadySeen = sessionStorage.getItem(periodKey);

        if (data.currentUserOnPodium && !alreadySeen) {
            sessionStorage.setItem(periodKey, '1');
            setTimeout(() => this.triggerConfetti(), 1200);
        }

        if (data.entries[0]) {
            setTimeout(() => this.startGoldParticles(), 600);
        }
    }

    private triggerConfetti() {
        const duration    = 4000;
        const animEnd     = Date.now() + duration;
        const rand        = (a: number, b: number) => Math.random() * (b - a) + a;
        const defaults    = {
            spread: 360, ticks: 80, gravity: 0.8,
            startVelocity: 35,
            colors: ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#9370DB']
        };

        const interval = setInterval(() => {
            const timeLeft = animEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const count = 30 * (timeLeft / duration);
            confetti({ ...defaults, particleCount: count,
                origin: { x: rand(0.1, 0.4), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount: count,
                origin: { x: rand(0.6, 0.9), y: Math.random() - 0.2 } });
        }, 200);
    }

    private startGoldParticles() {
        this.stopParticles();
        let tick = 0;
        this.particleInterval = setInterval(() => {
            tick++;
            if (tick > 60) { this.stopParticles(); return; }
            confetti({
                particleCount: 3,
                angle: 90,
                spread: 60,
                origin: { x: 0.5, y: 0.4 },
                colors: ['#FFD700', '#FFC107', '#FFEB3B'],
                gravity: 0.4,
                scalar: 0.8,
                ticks: 60
            });
        }, 150);
    }

    private stopParticles() {
        if (this.particleInterval) {
            clearInterval(this.particleInterval);
            this.particleInterval = null;
        }
    }

    toggleReaction(entry: RankingEntryDto, emoji: string) {
        if (this.isCurrentUser(entry)) return;
        const period = this.period();

        if (this.hasMyReaction(entry, emoji)) {
            this.rankingService.removeReaction(entry.userId, emoji, period).subscribe({
                next: () => {
                    entry.reactions[emoji] = Math.max(0, (entry.reactions[emoji] ?? 1) - 1);
                    delete entry.reactions[emoji + '_me'];
                }
            });
        } else {
            this.rankingService.addReaction(entry.userId, emoji, period).subscribe({
                next: () => {
                    entry.reactions[emoji] = (entry.reactions[emoji] ?? 0) + 1;
                    entry.reactions[emoji + '_me'] = 1;
                }
            });
        }
    }

    getMedalColor(position: number): string {
        if (position === 1) return 'gold';
        if (position === 2) return 'silver';
        return 'bronze';
    }

    getPositionLabel(position: number): string {
        if (position === 1) return '🥇';
        if (position === 2) return '🥈';
        return '🥉';
    }

    getPeriodLabel(value: string): string {
      return this.periodOptions.find(opt => opt.value === value)?.label ?? '';
    }
}