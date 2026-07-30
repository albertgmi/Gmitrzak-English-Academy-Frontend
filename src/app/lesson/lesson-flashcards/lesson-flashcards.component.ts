import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { LessonPanelService, LessonFlashcardSummaryDto, LessonFlashcardDto } from '../../services/lesson-panel.service';
import { LessonContextService } from '../../services/lesson-context.service';
import { AvatarComponent } from '../../other/avatar/avatar.component';

@Component({
  selector: 'app-lesson-flashcards',
  standalone: true,
  imports: [
    CommonModule, TableModule, TagModule, ToastModule, ButtonModule,
    AvatarComponent, IconFieldModule, InputIconModule, InputTextModule,
    DialogModule, InputNumberModule, FormsModule
  ],
  providers: [MessageService],
  templateUrl: './lesson-flashcards.component.html'
})
export class LessonFlashcardsComponent implements OnInit {
  private service = inject(LessonPanelService);
  private lessonContext = inject(LessonContextService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  activeStudent = this.lessonContext.activeStudent;
  data = signal<LessonFlashcardSummaryDto | null>(null);
  loading = signal(true);

  allFlashcards = signal<LessonFlashcardDto[]>([]);
  loadingAll = signal(true);

  editDialogVisible = signal(false);
  selectedCard = signal<LessonFlashcardDto | null>(null);
  newInterval = signal<number>(0);
  saving = signal(false);

  exportingPdf = signal(false);
  exportingExcel = signal(false);

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