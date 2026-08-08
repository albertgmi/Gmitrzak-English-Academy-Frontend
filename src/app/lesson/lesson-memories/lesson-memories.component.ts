import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { MessageService, ConfirmationService } from 'primeng/api';
import { LessonContextService } from '../../services/lesson-context.service';
import { AdminMemoriesService, AdminMemoryDto, UpdateMemoryRequest } from '../../services/admin-memories.service';
import { AvatarComponent } from '../../other/avatar/avatar.component';

@Component({
  selector: 'app-lesson-memories',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    TagModule,
    AvatarComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './lesson-memories.component.html'
})
export class LessonMemoriesComponent implements OnInit {
  private lessonContext = inject(LessonContextService);
  private memoriesService = inject(AdminMemoriesService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  activeStudent = this.lessonContext.activeStudent;
  memories = signal<AdminMemoryDto[]>([]);
  loading = signal<boolean>(false);

  editingMemory = signal<AdminMemoryDto | null>(null);
  editForm = signal<UpdateMemoryRequest>({
    content: '',
    optionA: '',
    optionB: '',
    notes: '',
    category: ''
  });
  saving = signal<boolean>(false);

  constructor() {
    effect(() => {
      const student = this.activeStudent();
      if (student) {
        this.loadMemories(student.id);
      } else {
        this.memories.set([]);
      }
    });
  }

  ngOnInit(): void {
    const student = this.activeStudent();
    if (student) {
      this.loadMemories(student.id);
    }
  }

  goToSwitchClient(): void {
    this.router.navigate(['/lesson/switch-client']);
  }

  loadMemories(studentId: number): void {
    this.loading.set(true);
    this.memoriesService.getStudentMemories(studentId).subscribe({
      next: (data) => {
        this.memories.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load memories.'
        });
        this.loading.set(false);
      }
    });
  }

  openEdit(item: AdminMemoryDto): void {
    this.editingMemory.set(item);
    this.editForm.set({
      content: item.content || '',
      optionA: item.optionA || '',
      optionB: item.optionB || '',
      notes: item.notes || '',
      category: item.category || ''
    });
  }

  saveEdit(): void {
    const mem = this.editingMemory();
    if (!mem) return;

    const f = this.editForm();
    if (!f.content.trim() && !f.optionA.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please provide content or Option A.'
      });
      return;
    }

    this.saving.set(true);
    const payload: UpdateMemoryRequest = {
      content: f.content.trim(),
      optionA: f.optionA.trim(),
      optionB: f.optionB?.trim() || undefined,
      notes: f.notes?.trim() || undefined,
      category: f.category?.trim() || undefined
    };

    this.memoriesService.updateMemory(mem.id, payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Updated',
          detail: 'Memory updated successfully.'
        });
        this.editingMemory.set(null);
        this.saving.set(false);
        const student = this.activeStudent();
        if (student) this.loadMemories(student.id);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update memory.'
        });
        this.saving.set(false);
      }
    });
  }

  confirmDelete(item: AdminMemoryDto): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete this memory?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger' },
      accept: () => {
        this.memoriesService.deleteMemory(item.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: 'Memory deleted successfully.'
            });
            const student = this.activeStudent();
            if (student) this.loadMemories(student.id);
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete memory.'
            });
          }
        });
      }
    });
  }
}
