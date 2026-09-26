import { Component, inject, signal, computed, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule, Table } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { LessonPanelService, LessonSentenceSummaryDto } from '../../services/lesson-panel.service';
import { SentenceDto } from '../../services/student-services/content.service';
import { LessonContextService } from '../../services/lesson-context.service';
import { AvatarComponent } from '../../other/avatar/avatar.component';

@Component({
  selector: 'app-lesson-sentences',
  standalone: true,
  imports: [
    CommonModule, TableModule, TagModule, ToastModule, ConfirmDialogModule, CheckboxModule, ButtonModule,
    AvatarComponent, IconFieldModule, InputIconModule, InputTextModule,
    DialogModule, InputNumberModule, TextareaModule, TooltipModule, FormsModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './lesson-sentences.component.html'
})
export class LessonSentencesComponent implements OnInit {
  @ViewChild('dt') dt?: Table;
  private service = inject(LessonPanelService);
  private lessonContext = inject(LessonContextService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  activeStudent = this.lessonContext.activeStudent;
  data = signal<LessonSentenceSummaryDto | null>(null);
  loading = signal(true);
  allSentences = signal<SentenceDto[]>([]);
  loadingAll = signal(true);
  selectedSentences = signal<SentenceDto[]>([]);
  deletingBulk = signal<boolean>(false);

  editingId = signal<number | null>(null);
  savingId = signal<number | null>(null);

  editDialogVisible = signal(false);
  selectedSentence = signal<SentenceDto | null>(null);
  editTranslation = signal<string>('');
  editInterval = signal<number>(0);
  saving = signal(false);
  leechesExpanded = signal(false);

  isAllSelected = computed(() => {
    const all = this.allSentences();
    const selected = this.selectedSentences();
    return all.length > 0 && selected.length === all.length;
  });

  toggleSelectAll(checked: boolean) {
    if (checked) {
      this.selectedSentences.set([...this.allSentences()]);
    } else {
      this.selectedSentences.set([]);
    }
  }

  clearSelection() {
    this.selectedSentences.set([]);
  }

  confirmDeleteBulk() {
    const selected = this.selectedSentences();
    if (!selected.length) return;
    const student = this.activeStudent();
    this.confirmationService.confirm({
      message: `Are you sure you want to remove ${selected.length} selected sentence flashcard(s) from ${student?.username || 'this student'}'s deck?`,
      header: 'Confirm Sentence Flashcard Deletion',
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
    const ids = this.selectedSentences().map(s => s.id);
    if (!studentId || !ids.length) return;
    this.deletingBulk.set(true);
    this.service.deleteSentencesBulk(studentId, ids).subscribe({
      next: () => {
        this.allSentences.update(sentences => sentences.filter(s => !ids.includes(s.id)));
        this.selectedSentences.set([]);
        this.deletingBulk.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Removed',
          detail: `Successfully removed ${ids.length} sentence flashcard(s).`,
          life: 3000
        });
        this.service.getSentences(studentId).subscribe({
          next: (d) => this.data.set(d)
        });
      },
      error: () => {
        this.deletingBulk.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to remove sentence flashcards.',
          life: 3000
        });
      }
    });
  }

  toggleLeeches() {
    this.leechesExpanded.update(v => !v);
  }

  onGlobalFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.dt?.filterGlobal(value, 'contains');
  }

  ngOnInit() {
    const id = this.lessonContext.studentId;
    if (!id) return;
    this.service.getSentences(id).subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    this.service.getAllSentences(id).subscribe({
      next: (sentences) => { this.allSentences.set(sentences); this.loadingAll.set(false); },
      error: () => this.loadingAll.set(false)
    });
  }

  goToSwitchClient() {
    this.router.navigate(['/lesson/switch-client']);
  }

  startInlineEdit(card: SentenceDto, event?: Event) {
    if (event) event.stopPropagation();
    this.editingId.set(card.id);
    this.editTranslation.set(card.translation || '');
  }

  cancelInlineEdit() {
    this.editingId.set(null);
  }

  saveInlineEdit(card: SentenceDto) {
    const studentId = this.lessonContext.studentId;
    if (!studentId || !card.id) return;

    const newTranslation = this.editTranslation().trim();
    if (!newTranslation) return;

    this.savingId.set(card.id);
    this.service.updateSentence(studentId, card.id, {
      translation: newTranslation
    }).subscribe({
      next: () => {
        this.allSentences.update(sentences =>
          sentences.map(s => (s.id === card.id ? { ...s, translation: newTranslation } : s))
        );
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Translation updated' });
        this.editingId.set(null);
        this.savingId.set(null);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update translation' });
        this.savingId.set(null);
      }
    });
  }

  openEditDialog(sentence: SentenceDto) {
    this.selectedSentence.set(sentence);
    this.editTranslation.set(sentence.translation || '');
    this.editInterval.set(sentence.interval || 0);
    this.editDialogVisible.set(true);
  }

  saveSentence() {
    const sentence = this.selectedSentence();
    const studentId = this.lessonContext.studentId;
    if (!sentence || !studentId || !sentence.id) return;

    this.saving.set(true);
    const updatedTranslation = this.editTranslation().trim();
    const updatedInterval = this.editInterval();

    this.service.updateSentence(studentId, sentence.id, {
      translation: updatedTranslation,
      interval: updatedInterval
    }).subscribe({
      next: () => {
        this.allSentences.update(sentences =>
          sentences.map(s => (s.id === sentence.id ? { ...s, translation: updatedTranslation, interval: updatedInterval } : s))
        );
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Sentence updated successfully' });
        this.editDialogVisible.set(false);
        this.saving.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Update failed' });
        this.saving.set(false);
      }
    });
  }
}
