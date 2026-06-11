import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { StudentService, ActivityPointsHistoryDto } from '../../services/student-services/student.service';

type Group = {
    dateKey: string;
    date: Date;
    total: number;
    items: any[];
};

@Component({
    selector: 'app-activity-points',
    standalone: true,
    imports: [CommonModule, ToastModule],
    providers: [MessageService],
    templateUrl: './activity-points.component.html'
})
export class ActivityPointsComponent implements OnInit {

    private studentService = inject(StudentService);
    private messageService = inject(MessageService);

    data = signal<ActivityPointsHistoryDto | null>(null);
    loading = signal(true);

    expandedDays = signal<Record<string, boolean>>({});

    groupedHistory = computed<Group[]>(() => {
        const history = this.data()?.history ?? [];
        if (!history.length) return [];

        const map = new Map<string, Group>();

        for (const item of history) {
            const date = new Date(item.pointDate);
            const dateKey = date.toISOString().slice(0, 10);

            let group = map.get(dateKey);

            if (!group) {
                group = {
                    dateKey,
                    date: new Date(dateKey),
                    total: 0,
                    items: []
                };
                map.set(dateKey, group);
            }

            group.items.push(item);
            group.total += item.points;
        }

        for (const g of map.values()) {
            g.items.sort((a, b) =>
                new Date(b.pointDate).getTime() - new Date(a.pointDate).getTime()
            );
        }

        return Array.from(map.values())
            .sort((a, b) => b.date.getTime() - a.date.getTime());
    });

    ngOnInit() {
        this.studentService.getActivityPoints().subscribe({
            next: (d) => {
                this.data.set(d);
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Could not load data.'
                });
                this.loading.set(false);
            }
        });
    }

    toggleDay(dateKey: string) {
        this.expandedDays.update(curr => ({
            ...curr,
            [dateKey]: !curr[dateKey]
        }));
    }

    trackByDate = (_: number, g: Group) => g.dateKey;
}