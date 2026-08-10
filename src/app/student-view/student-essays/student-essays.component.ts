import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { EssayService, UserEssayDto } from '../../services/essay.service';

@Component({
  selector: 'app-student-essays',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TagModule,
    TableModule,
    DialogModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule
  ],
  templateUrl: './student-essays.component.html'
})
export class StudentEssaysComponent implements OnInit {
  private essayService = inject(EssayService);

  essays = signal<UserEssayDto[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  searchQuery = signal<string>('');
  statusFilter = signal<'all' | 'reviewed' | 'pending'>('all');

  selectedEssay = signal<UserEssayDto | null>(null);
  showDialog = signal<boolean>(false);

  totalEssays = computed(() => this.essays().length);
  reviewedCount = computed(() => this.essays().filter(e => e.isReviewed).length);
  pendingCount = computed(() => this.essays().filter(e => !e.isReviewed).length);

  filteredEssays = computed(() => {
    let list = this.essays();
    const query = this.searchQuery().toLowerCase().trim();
    const filter = this.statusFilter();

    if (filter === 'reviewed') {
      list = list.filter(e => e.isReviewed);
    } else if (filter === 'pending') {
      list = list.filter(e => !e.isReviewed);
    }

    if (query) {
      list = list.filter(e =>
        e.moduleName.toLowerCase().includes(query) ||
        e.essayPrompt.toLowerCase().includes(query)
      );
    }

    return list;
  });

  ngOnInit() {
    this.loadMyEssays();
  }

  loadMyEssays() {
    this.loading.set(true);
    this.error.set(null);
    this.essayService.getMyEssays().subscribe({
      next: (res) => {
        this.essays.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load essays:', err);
        this.error.set('Failed to load your essays. Please try again.');
        this.loading.set(false);
      }
    });
  }

  getWordCount(htmlString?: string): number {
    if (!htmlString) return 0;
    const cleanText = htmlString
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .trim();
    if (!cleanText) return 0;
    return cleanText.split(/\s+/).filter(word => word.length > 0).length;
  }

  openEssay(essay: UserEssayDto) {
    this.selectedEssay.set(essay);
    this.showDialog.set(true);
  }

  setStatusFilter(status: 'all' | 'reviewed' | 'pending') {
    this.statusFilter.set(status);
  }
}
