import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { LessonPanelService, LessonStatsDto } from '../../services/lesson-panel.service';
import { LessonContextService } from '../../services/lesson-context.service';
import { AvatarComponent } from '../../other/avatar/avatar.component';

@Component({
  selector: 'app-lesson-stats',
  standalone: true,
  imports: [CommonModule, ChartModule, ToastModule, ButtonModule, AvatarComponent],
  providers: [MessageService],
  templateUrl: './lesson-stats.component.html'
})
export class LessonStatsComponent implements OnInit {
  private service = inject(LessonPanelService);
  private lessonContext = inject(LessonContextService);
  private router = inject(Router);

  activeStudent = this.lessonContext.activeStudent;
  data = signal<LessonStatsDto | null>(null);
  loading = signal(true);

  ngOnInit() {
    const id = this.lessonContext.studentId;
    if (!id) return;
    this.service.getStats(id).subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  get totalActivityPoints(): number {
    const d = this.data();
    if (!d?.dailyActivity) return 0;
    return d.dailyActivity.reduce((a, x) => a + (x.points || 0), 0);
  }

  get activityChart() {
    const d = this.data();
    if (!d?.dailyActivity.length) return null;
    return {
      labels: d.dailyActivity.map(x => x.date),
      datasets: [{ 
        label: 'Points', 
        data: d.dailyActivity.map(x => x.points),
        fill: true, 
        borderColor: '#6366f1', 
        backgroundColor: 'rgba(99,102,241,0.1)',
        tension: 0.4, 
        pointRadius: 3 
      }]
    };
  }

  get flashcardsChart() {
    const d = this.data();
    if (!d?.dailyFlashcards.length) return null;
    return {
      labels: d.dailyFlashcards.map(x => x.date),
      datasets: [{ 
        label: 'Cards', 
        data: d.dailyFlashcards.map(x => x.cardsStudied),
        backgroundColor: '#6366f1', 
        borderRadius: 4 
      }]
    };
  }

  get categoryChart() {
    const d = this.data();
    if (!d?.gradeHistory.length) return null;
    const cb = d.categoryBreakdown;
    return {
      labels: ['Vocabulary', 'Sentences', 'Memories', 'Pronunciation'],
      datasets: [{ 
        data: [cb.avgVocabulary, cb.avgSentences, cb.avgMemories, cb.avgPronunciation],
        backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444'], 
        borderWidth: 0 
      }]
    };
  }

  get lineOptions() {
    return { 
      responsive: true, 
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } 
    };
  }

  get doughnutOptions() {
    return { 
      responsive: true, 
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' as const } } 
    };
  }

  get avgGrade(): string {
    const grades = this.data()?.gradeHistory;
    if (!grades?.length) return '—';
    return (grades.reduce((a, x) => a + x.percentage, 0) / grades.length).toFixed(1);
  }

  goToSwitchClient() { this.router.navigate(['/lesson/switch-client']); }
}