import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AcademyExamService, AcademyExamDto, ExamLevel, ExamSignupStatus, CreateAcademyExamDto, ExamMaterialDto } from '../../services/academy-exam.service';
import { AuthService } from '../../services/auth.service';
import { AvatarComponent } from '../../other/avatar/avatar.component';

@Component({
  selector: 'app-academy-exams',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TagModule,
    ToastModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    DatePickerModule,
    CheckboxModule,
    TooltipModule,
    ConfirmDialogModule,
    AvatarComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './academy-exams.component.html',
  styleUrls: ['./academy-exams.component.scss']
})
export class AcademyExamsComponent implements OnInit {
  private examService = inject(AcademyExamService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  activeTab = signal<ExamLevel>('Junior');
  exams = signal<AcademyExamDto[]>([]);
  loading = signal<boolean>(true);

  isAdmin = computed(() => this.authService.getRole() === 'Admin');

  // Form state
  showForm = signal<boolean>(false);
  editingExam = signal<AcademyExamDto | null>(null);
  saving = signal<boolean>(false);

  formTitle = signal<string>('');
  formDescription = signal<string>('');
  formLevel = signal<ExamLevel>('Junior');
  formMaterials = signal<ExamMaterialDto[]>([]);
  formRewardCredits = signal<number>(50);
  formPassingThreshold = signal<string>('80%');
  formSignupDeadline = signal<Date | null>(null);
  formIsActive = signal<boolean>(true);

  // Takers modal state
  selectedExamForTakers = signal<AcademyExamDto | null>(null);
  showTakersDialog = signal<boolean>(false);

  levelOptions = [
    { label: 'Junior', value: 'Junior' },
    { label: 'Senior', value: 'Senior' }
  ];

  levelTabs: { id: ExamLevel; label: string; icon: string }[] = [
    { id: 'Junior', label: 'Junior Exams', icon: 'pi pi-user' },
    { id: 'Senior', label: 'Senior Exams', icon: 'pi pi-star' }
  ];

  statusOptions = [
    { label: 'Registered', value: 'Registered' },
    { label: 'Passed (Awards Credits)', value: 'Passed' },
    { label: 'Failed', value: 'Failed' },
    { label: 'Cancelled', value: 'Cancelled' }
  ];

  ngOnInit() {
    this.loadExams();
  }

  setTab(level: ExamLevel) {
    this.activeTab.set(level);
    this.loadExams();
  }

  loadExams() {
    this.loading.set(true);
    this.examService.getExams(this.activeTab()).subscribe({
      next: (data) => {
        this.exams.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load exams',
          life: 3000
        });
        this.loading.set(false);
      }
    });
  }

  signUp(exam: AcademyExamDto) {
    this.examService.signUp(exam.id).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Signed Up',
          detail: res.message || 'Successfully registered for exam.',
          life: 3000
        });
        this.loadExams();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Registration Failed',
          detail: err?.error?.message || 'Could not sign up for exam.',
          life: 3000
        });
      }
    });
  }

  unsign(exam: AcademyExamDto) {
    this.confirmationService.confirm({
      message: `Are you sure you want to cancel your registration for "${exam.title}"?`,
      header: 'Cancel Registration',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.examService.unsign(exam.id).subscribe({
          next: (res) => {
            this.messageService.add({
              severity: 'info',
              summary: 'Unsigned',
              detail: res.message || 'Successfully cancelled registration.',
              life: 3000
            });
            this.loadExams();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err?.error?.message || 'Could not cancel registration.',
              life: 3000
            });
          }
        });
      }
    });
  }

  openCreateDialog() {
    this.editingExam.set(null);
    this.formTitle.set('');
    this.formDescription.set('');
    this.formLevel.set(this.activeTab());
    this.formMaterials.set([{ title: 'Study Resource 1', url: '' }]);
    this.formRewardCredits.set(50);
    this.formPassingThreshold.set('80%');

    // Default deadline: 7 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    this.formSignupDeadline.set(defaultDate);

    this.formIsActive.set(true);
    this.showForm.set(true);
  }

  openEditDialog(exam: AcademyExamDto) {
    this.editingExam.set(exam);
    this.formTitle.set(exam.title);
    this.formDescription.set(exam.description);
    this.formLevel.set(exam.level);

    const materials = exam.materials && exam.materials.length
      ? exam.materials.map(m => ({ ...m }))
      : (exam.materialsUrl ? [{ title: 'Study Materials', url: exam.materialsUrl }] : []);
    this.formMaterials.set(materials);

    this.formRewardCredits.set(exam.rewardCredits);
    this.formPassingThreshold.set(exam.passingThreshold);
    this.formSignupDeadline.set(exam.signupDeadline ? new Date(exam.signupDeadline) : new Date());
    this.formIsActive.set(exam.isActive);
    this.showForm.set(true);
  }

  addMaterial() {
    this.formMaterials.update(list => [...list, { title: '', url: '' }]);
  }

  removeMaterial(index: number) {
    this.formMaterials.update(list => list.filter((_, i) => i !== index));
  }

  formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  saveExam() {
    const deadline = this.formSignupDeadline();
    if (!this.formTitle().trim() || !this.formDescription().trim() || !deadline) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill in title, description, and valid deadline.',
        life: 3000
      });
      return;
    }

    this.saving.set(true);

    const validMaterials = this.formMaterials()
      .filter(m => m.url && m.url.trim().length > 0)
      .map(m => ({ title: m.title.trim() || 'Study Resource', url: m.url.trim() }));

    const payload: CreateAcademyExamDto = {
      title: this.formTitle().trim(),
      description: this.formDescription().trim(),
      level: this.formLevel(),
      materialsUrl: validMaterials.length > 0 ? validMaterials[0].url : undefined,
      materials: validMaterials,
      rewardCredits: this.formRewardCredits(),
      passingThreshold: this.formPassingThreshold().trim(),
      signupDeadline: this.formatDateTimeLocal(deadline),
      isActive: this.formIsActive()
    };

    const currentEditing = this.editingExam();
    if (currentEditing) {
      this.examService.updateExam(currentEditing.id, payload).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Exam updated successfully.', life: 3000 });
          this.saving.set(false);
          this.showForm.set(false);
          this.loadExams();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update exam.', life: 3000 });
          this.saving.set(false);
        }
      });
    } else {
      this.examService.createExam(payload).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Exam created successfully.', life: 3000 });
          this.saving.set(false);
          this.showForm.set(false);
          this.loadExams();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create exam.', life: 3000 });
          this.saving.set(false);
        }
      });
    }
  }

  confirmDelete(exam: AcademyExamDto) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete exam "${exam.title}"?`,
      header: 'Delete Exam',
      icon: 'pi pi-trash',
      accept: () => {
        this.examService.deleteExam(exam.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Exam deleted successfully.', life: 3000 });
            this.loadExams();
          }
        });
      }
    });
  }

  openTakersDialog(exam: AcademyExamDto) {
    this.selectedExamForTakers.set(exam);
    this.showTakersDialog.set(true);
  }

  markTakerStatus(examId: number, userId: number, status: ExamSignupStatus) {
    this.examService.markTakerStatus(examId, userId, status).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Status Updated',
          detail: res.message || `Status changed to ${status}.`,
          life: 3000
        });
        // Refresh exam details
        this.examService.getExamById(examId).subscribe(updated => {
          this.selectedExamForTakers.set(updated);
          this.loadExams();
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Failed to update status.',
          life: 3000
        });
      }
    });
  }

  getStatusSeverity(status: ExamSignupStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'Passed': return 'success';
      case 'Registered': return 'info';
      case 'Failed': return 'danger';
      case 'Cancelled': return 'secondary';
      default: return 'info';
    }
  }
}
