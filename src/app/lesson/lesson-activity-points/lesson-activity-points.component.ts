import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LessonPanelService, ActivityPointsLessonSummaryDto } from '../../services/lesson-panel.service';
import { LessonContextService } from '../../services/lesson-context.service';
import { AvatarComponent } from '../../other/avatar/avatar.component';

type ActivityGroup = {
    dateKey: string;
    date: Date;
    dayTotal: number;
    items: any[];
};

@Component({
    selector: 'app-lesson-activity-points',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule,
        InputTextModule, InputNumberModule, ToastModule, AvatarComponent],
    providers: [MessageService],
    templateUrl: './lesson-activity-points.component.html'
})
export class LessonActivityPointsComponent implements OnInit {

    private service = inject(LessonPanelService);
    private lessonContext = inject(LessonContextService);
    private router = inject(Router);
    private messageService = inject(MessageService);

    activeStudent = this.lessonContext.activeStudent;

    data = signal<ActivityPointsLessonSummaryDto | null>(null);
    loading = signal(true);
    saving = signal(false);

    newPoints = signal(0);
    newReason = signal('');

    expandedDays = signal<Record<string, boolean>>({});

    groupedHistory = computed<ActivityGroup[]>(() => {
        const history = this.data()?.history;
        if (!history?.length) return [];

        const groups = new Map<string, ActivityGroup>();

        for (const item of history) {
            const date = new Date(item.pointDate);

            const dateKey = date.toLocaleDateString('sv-SE');

            let group = groups.get(dateKey);

            if (!group) {
                group = {
                    dateKey,
                    date: new Date(dateKey),
                    dayTotal: 0,
                    items: []
                };
                groups.set(dateKey, group);
            }

            group.items.push(item);
            group.dayTotal += item.points;
        }

        for (const group of groups.values()) {
            group.items.sort(
                (a, b) => new Date(b.pointDate).getTime() - new Date(a.pointDate).getTime()
            );
        }

        return Array.from(groups.values()).sort(
            (a, b) => b.date.getTime() - a.date.getTime()
        );
    });

    ngOnInit() {
        const id = this.lessonContext.studentId;
        if (!id) return;
        this.load(id);
    }

    load(id: number) {
        this.loading.set(true);

        this.service.getActivityPoints(id).subscribe({
            next: d => {
                this.data.set(d);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    toggleDay(dateKey: string) {
        this.expandedDays.update(curr => ({
            ...curr,
            [dateKey]: !curr[dateKey]
        }));
    }

    add() {
        const id = this.lessonContext.studentId;
        if (!id || this.newPoints() <= 0) return;

        this.saving.set(true);

        this.service.addActivityPoints(id, this.newPoints(), this.newReason()).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Points added',
                    detail: `+${this.newPoints()} points`,
                    life: 3000
                });

                this.newPoints.set(0);
                this.newReason.set('');
                this.saving.set(false);

                this.load(id);
            },
            error: () => this.saving.set(false)
        });
    }

    trackByDate = (_: number, item: { dateKey: string }) => item.dateKey;

    goToSwitchClient() {
        this.router.navigate(['/lesson/switch-client']);
    }
}