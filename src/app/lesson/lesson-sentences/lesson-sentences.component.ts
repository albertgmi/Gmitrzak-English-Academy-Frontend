import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule, Table } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { LessonPanelService, LessonSentenceSummaryDto } from '../../services/lesson-panel.service';
import { SentenceDto } from '../../services/student-services/content.service';
import { LessonContextService } from '../../services/lesson-context.service';
import { AvatarComponent } from '../../other/avatar/avatar.component';

@Component({
  selector: 'app-lesson-sentences',
  standalone: true,
  imports: [
    CommonModule, TableModule, TagModule, ToastModule, ButtonModule,
    AvatarComponent, IconFieldModule, InputIconModule, InputTextModule,
    DialogModule, InputNumberModule, TextareaModule, FormsModule
  ],
  providers: [MessageService],
  templateUrl: './lesson-sentences.component.html'
})
export class LessonSentencesComponent implements OnInit {
  @ViewChild('dt') dt?: Table;
  private service = inject(LessonPanelService);
  private lessonContext = inject(LessonContextService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  activeStudent = this.lessonContext.activeStudent;
  data = signal<LessonSentenceSummaryDto | null>(null);
  loading = signal(true);
  allSentences = signal<SentenceDto[]>([]);
  loadingAll = signal(true);

  editDialogVisible = signal(false);
  selectedSentence = signal<SentenceDto | null>(null);
  editTranslation = signal<string>('');
  editInterval = signal<number>(0);
  saving = signal(false);
  leechesExpanded = signal(false);

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
