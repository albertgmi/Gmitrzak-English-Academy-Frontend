import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { StudentService, WeeklyMoviesResponseDto } from '../../services/student-services/student.service';
import { AvatarComponent } from '../../other/avatar/avatar.component';

@Component({
  selector: 'app-weekly-movies',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TagModule,
    TableModule,
    CardModule,
    SkeletonModule,
    AvatarComponent
  ],
  templateUrl: './weekly-movies.component.html',
  styleUrls: ['./weekly-movies.component.scss']
})
export class WeeklyMoviesComponent implements OnInit {
  private studentService = inject(StudentService);

  data = signal<WeeklyMoviesResponseDto | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  top1Watcher = computed(() => this.data()?.topWatchers.find(w => w.rank === 1));
  top2Watcher = computed(() => this.data()?.topWatchers.find(w => w.rank === 2));
  top3Watcher = computed(() => this.data()?.topWatchers.find(w => w.rank === 3));

  ngOnInit() {
    this.loadWeeklyMovies();
  }

  loadWeeklyMovies() {
    this.loading.set(true);
    this.error.set(null);
    this.studentService.getWeeklyMoviesStats().subscribe({
      next: (res) => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load weekly movies stats:', err);
        this.error.set('Failed to load weekly movie statistics.');
        this.loading.set(false);
      }
    });
  }
}
