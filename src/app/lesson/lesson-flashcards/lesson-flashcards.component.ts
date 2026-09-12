import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { LessonPanelService, LessonFlashcardSummaryDto, LessonFlashcardDto } from '../../services/lesson-panel.service';
import { LessonContextService } from '../../services/lesson-context.service';
import { AvatarComponent } from '../../other/avatar/avatar.component';

@Component({
  selector: 'app-lesson-flashcards',
  standalone: true,
  imports: [
    CommonModule, TableModule, TagModule, ToastModule, ConfirmDialogModule, ButtonModule,
    AvatarComponent, IconFieldModule, InputIconModule, InputTextModule,
    DialogModule, InputNumberModule, FormsModule, SelectModule, TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './lesson-flashcards.component.html'
})
export class LessonFlashcardsComponent implements OnInit {
  private service = inject(LessonPanelService);
  private lessonContext = inject(LessonContextService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  activeStudent = this.lessonContext.activeStudent;
  data = signal<LessonFlashcardSummaryDto | null>(null);
  loading = signal(true);

  allFlashcards = signal<LessonFlashcardDto[]>([]);
  loadingAll = signal(true);

  selectedCards = signal<LessonFlashcardDto[]>([]);
  selectedCategoryToSelect = signal<string>('');
  deletingBulk = signal<boolean>(false);

  editDialogVisible = signal(false);
  selectedCard = signal<LessonFlashcardDto | null>(null);
  newInterval = signal<number>(0);
  saving = signal(false);

  exportingPdf = signal(false);
  exportingExcel = signal(false);

  categories = computed(() => {
    const set = new Set<string>();
    this.allFlashcards().forEach(c => {
      if (c.category && c.category.trim()) {
        set.add(c.category.trim());
      }
    });
    return Array.from(set).sort();
  });

  categoryOptions = computed(() => {
    const cats = this.categories();
    return [
      { label: 'Auto-select category...', value: '' },
      ...cats.map(c => ({ label: c, value: c }))
    ];
  });

  ngOnInit() {
    const id = this.lessonContext.studentId;
    if (!id) return;
    
    this.service.getFlashcards(id).subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });

    this.service.getAllFlashcards(id).subscribe({
      next: (cards) => { this.allFlashcards.set(cards); this.loadingAll.set(false); },
      error: () => this.loadingAll.set(false)
    });
  }

  onCategorySelect(categoryName: string) {
    if (!categoryName) return;
    const matchingCards = this.allFlashcards().filter(c => c.category === categoryName);
    const currentMap = new Map(this.selectedCards().map(c => [c.id, c]));
    matchingCards.forEach(c => currentMap.set(c.id, c));
    this.selectedCards.set(Array.from(currentMap.values()));
  }

  clearSelection() {
    this.selectedCards.set([]);
    this.selectedCategoryToSelect.set('');
  }

  confirmDeleteBulk() {
    const selected = this.selectedCards();
    if (!selected.length) return;
    const student = this.activeStudent();

    this.confirmationService.confirm({
      message: `Are you sure you want to remove ${selected.length} selected flashcard(s) from ${student?.username || 'this student'}'s deck?`,
      header: 'Confirm Flashcard Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { label: 'Remove', severity: 'danger' },
      rejectButtonProps: { label: 'Cancel', severity: 'secondary', outlined: true },
      accept: () => {
        this.executeDeleteBulk();
      }
    });
  }

  executeDeleteBulk() {
    const studentId = this.lessonContext.studentId;
    const ids = this.selectedCards().map(c => c.id);
    if (!studentId || !ids.length) return;

    this.deletingBulk.set(true);
    this.service.deleteFlashcardsBulk(studentId, ids).subscribe({
      next: () => {
        this.allFlashcards.update(cards => cards.filter(c => !ids.includes(c.id)));
        this.selectedCards.set([]);
        this.selectedCategoryToSelect.set('');
        this.deletingBulk.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Removed',
          detail: `Successfully removed ${ids.length} flashcard(s).`,
          life: 3000
        });

        this.service.getFlashcards(studentId).subscribe({
          next: (d) => this.data.set(d)
        });
      },
      error: () => {
        this.deletingBulk.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to remove flashcards.',
          life: 3000
        });
      }
    });
  }

  formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  goToSwitchClient() { 
    this.router.navigate(['/lesson/switch-client']); 
  }

  openEditDialog(card: LessonFlashcardDto) {
    this.selectedCard.set(card);
    this.newInterval.set(card.interval);
    this.editDialogVisible.set(true);
  }

  saveInterval() {
    const card = this.selectedCard();
    const studentId = this.lessonContext.studentId;
    
    if (!card || !studentId || !card.id) return;

    this.saving.set(true);
    const updatedInterval = this.newInterval();

    this.service.updateInterval(studentId, card.id, updatedInterval).subscribe({
      next: () => {
        this.allFlashcards.update(cards => 
          cards.map(c => (c.id === card.id ? { ...c, interval: updatedInterval } : c))
        );
        
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Interval updated' });
        this.editDialogVisible.set(false);
        this.saving.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Update failed' });
        this.saving.set(false);
      }
    });
  }

  exportPdf() {
    const studentId = this.lessonContext.studentId;
    if (!studentId) return;

    this.exportingPdf.set(true);
    this.service.exportFlashcardsPdf(studentId).subscribe({
      next: (blob) => {
        this.downloadFile(blob, `flashcards_${studentId}.pdf`);
        this.exportingPdf.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'PDF export failed' });
        this.exportingPdf.set(false);
      }
    });
  }

  exportExcel() {
    const studentId = this.lessonContext.studentId;
    if (!studentId) return;

    this.exportingExcel.set(true);
    this.service.exportFlashcardsExcel(studentId).subscribe({
      next: (blob) => {
        this.downloadFile(blob, `flashcards_${studentId}.xlsx`);
        this.exportingExcel.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Excel export failed' });
        this.exportingExcel.set(false);
      }
    });
  }

  private downloadFile(blob: Blob, fileName: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}