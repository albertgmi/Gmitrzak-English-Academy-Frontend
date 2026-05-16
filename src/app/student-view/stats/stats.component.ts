import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { ChartModule } from 'primeng/chart';
import { MessageService } from 'primeng/api';
import { StudentService, StatsDto } from '../../services/student-services/student.service';

@Component({
    selector: 'app-stats',
    standalone: true,
    imports: [CommonModule, ToastModule, ChartModule],
    providers: [MessageService],
    templateUrl: './stats.component.html'
})
export class StatsComponent implements OnInit {
    private studentService = inject(StudentService);
    private messageService = inject(MessageService);

    data = signal<StatsDto | null>(null);
    loading = signal(true);

    totalPoints = computed(() => {
        const d = this.data();
        if (!d) return 0;
        return d.dailyActivity.reduce((acc: number, x) => acc + x.points, 0);
    });

    totalCards = computed(() => {
        const d = this.data();
        if (!d) return 0;
        return d.dailyFlashcards.reduce((acc: number, x) => acc + x.cardsStudied, 0);
    });

    avgGrade = computed(() => {
        const grades = this.data()?.gradeHistory;
        if (!grades || grades.length === 0) return '—';
        const sum = grades.reduce((acc: number, x) => acc + x.percentage, 0);
        return (sum / grades.length).toFixed(1);
    });

    activityChartData = computed(() => {
        const d = this.data();
        if (!d?.dailyActivity.length) return null;
        return {
            labels: d.dailyActivity.map(x => x.date),
            datasets: [{
                label: 'Activity Points',
                data: d.dailyActivity.map(x => x.points),
                fill: true,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99,102,241,0.1)',
                tension: 0.4,
                pointRadius: 3
            }]
        };
    });

    flashcardsChartData = computed(() => {
        const d = this.data();
        if (!d?.dailyFlashcards.length) return null;
        return {
            labels: d.dailyFlashcards.map(x => x.date),
            datasets: [{
                label: 'Cards Studied',
                data: d.dailyFlashcards.map(x => x.cardsStudied),
                backgroundColor: '#6366f1',
                borderRadius: 6
            }]
        };
    });

    gradesChartData = computed(() => {
        const d = this.data();
        if (!d?.gradeHistory.length) return null;
        return {
            labels: d.gradeHistory.map(x => `${x.category} ${x.gradeDate}`),
            datasets: [{
                label: 'Score %',
                data: d.gradeHistory.map(x => x.percentage),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16,185,129,0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4
            }]
        };
    });

    categoryChartData = computed(() => {
        const d = this.data();
        if (!d?.gradeHistory.length) return null;
        const cb = d.categoryBreakdown;
        return {
            labels: ['Vocabulary', 'Sentences', 'Memories', 'Pronunciation'],
            datasets: [{
                data: [
                    cb.avgVocabulary,
                    cb.avgSentences,
                    cb.avgMemories,
                    cb.avgPronunciation
                ],
                backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444'],
                borderWidth: 0
            }]
        };
    });

    get chartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true }
            }
        };
    }

    get doughnutOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 16, font: { size: 12 } }
                }
            }
        };
    }

    ngOnInit() {
        this.studentService.getStats().subscribe({
            next: (d) => { 
                this.data.set(d); 
                this.loading.set(false); 
            },
            error: () => {
                this.messageService.add({
                    severity: 'error', 
                    summary: 'Error',
                    detail: 'Could not load stats.', 
                    life: 3000
                });
                this.loading.set(false);
            }
        });
    }
}