import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { MessageService, ConfirmationService } from 'primeng/api';
import { LessonContextService } from '../../services/lesson-context.service';
import { AdminPronunciationService, AdminPronunciationDto, UpdatePronunciationRequest } from '../../services/admin-pronunciation.service';
import { AvatarComponent } from '../../other/avatar/avatar.component';

@Component({
  selector: 'app-lesson-pronunciation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    CheckboxModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    TagModule,
    AvatarComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './lesson-pronunciation.component.html'
})
export class LessonPronunciationComponent implements OnInit {
  private lessonContext = inject(LessonContextService);
  private pronunciationService = inject(AdminPronunciationService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  activeStudent = this.lessonContext.activeStudent;
  pronunciations = signal<AdminPronunciationDto[]>([]);
  loading = signal<boolean>(false);

  editingEntry = signal<AdminPronunciationDto | null>(null);
  editForm = signal<UpdatePronunciationRequest>({
    word: '',
    status: 'Pending',
    sortOrder: 0,
    isInCurrentSession: false
  });
  saving = signal<boolean>(false);

  statusOptions = [
    { label: 'Pending', value: 'Pending' },
    { label: 'Correct', value: 'Correct' },
    { label: 'Incorrect', value: 'Incorrect' }
  ];

  constructor() {
    effect(() => {
      const student = this.activeStudent();
      if (student) {
        this.loadPronunciation(student.id);
      } else {
        this.pronunciations.set([]);
      }
    });
  }

  ngOnInit(): void {}

  goToSwitchClient(): void {
    this.router.navigate(['/lesson/switch-client']);
  }

  loadPronunciation(studentId: number): void {
    this.loading.set(true);
    this.pronunciationService.getStudentPronunciation(studentId).subscribe({
      next: (data) => {
        this.pronunciations.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load pronunciation entries.'
        });
        this.loading.set(false);
      }
    });
  }

  statusSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (status?.toLowerCase()) {
      case 'correct': return 'success';
      case 'incorrect': return 'danger';
      case 'pending': return 'warn';
      default: return 'info';
    }
  }

  openEdit(item: AdminPronunciationDto): void {
    this.editingEntry.set(item);
    this.editForm.set({
      word: item.word || '',
      status: item.status || 'Pending',
      sortOrder: item.sortOrder || 0,
      isInCurrentSession: !!item.isInCurrentSession
    });
  }

  saveEdit(): void {
    const entry = this.editingEntry();
    if (!entry) return;

    const f = this.editForm();
    if (!f.word.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please provide a word.'
      });
      return;
    }

    this.saving.set(true);
    const payload: UpdatePronunciationRequest = {
      word: f.word.trim(),
      status: f.status,
      sortOrder: f.sortOrder || 0,
      isInCurrentSession: f.isInCurrentSession
    };

    this.pronunciationService.updatePronunciation(entry.id, payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Updated',
          detail: 'Pronunciation entry updated successfully.'
        });
        this.editingEntry.set(null);
        this.saving.set(false);
        const student = this.activeStudent();
        if (student) this.loadPronunciation(student.id);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update pronunciation entry.'
        });
        this.saving.set(false);
      }
    });
  }

  confirmDelete(item: AdminPronunciationDto): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${item.word}"?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger' },
      accept: () => {
        this.pronunciationService.deletePronunciation(item.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: 'Pronunciation entry deleted successfully.'
            });
            const student = this.activeStudent();
            if (student) this.loadPronunciation(student.id);
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete entry.'
            });
          }
        });
      }
    });
  }
}
