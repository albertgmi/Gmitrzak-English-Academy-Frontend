import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { EmailReminderService, FlashcardInactiveUser } from '../../services/email-reminder.service';

const DEFAULT_SUBJECT = 'Gmitrzak English Academy – Time for your flashcards review! 📇';
const DEFAULT_BODY = `We noticed that you haven't reviewed your flashcards for at least 3 days.

Consistency is key to mastering the English language! Log in to the platform and complete your daily review session.`;

@Component({
  selector: 'app-flashcard-reminders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    CheckboxModule,
    TagModule,
    ToolbarModule,
    ToastModule,
    ConfirmDialogModule,
    CardModule,
    TooltipModule,
    InputTextModule,
    TextareaModule,
    DialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './flashcard-reminders.component.html'
})
export class FlashcardRemindersComponent implements OnInit {
  private reminderService = inject(EmailReminderService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  allStudents = signal<FlashcardInactiveUser[]>([]);
  selectedStudents = signal<FlashcardInactiveUser[]>([]);
  loading = signal(true);
  sending = signal(false);

  // Toggle for custom selection mode (disabled/locked by default)
  allowCustomSelection = signal(false);

  // Customizable email subject and body (plain text)
  customSubject = signal<string>(DEFAULT_SUBJECT);
  customBody = signal<string>(DEFAULT_BODY);

  // Preview Dialog visibility
  showPreview = signal(false);

  // Inactive students (>= 3 days)
  inactiveStudents = computed(() =>
    this.allStudents().filter(s => s.isInactiveForThreeDays)
  );

  // Displayed students based on selection mode
  displayedStudents = computed(() => {
    return this.allowCustomSelection()
      ? this.allStudents()
      : this.inactiveStudents();
  });

  // Generated Live Email Preview HTML
  previewHtml = computed(() => {
    const text = this.customBody().replace('{username}', 'John Doe');
    const paragraphs = text
      .split('\n')
      .map(p => p.trim() ? `<p style="margin: 0 0 12px 0; line-height: 1.6;">${p}</p>` : '<br/>')
      .join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9; margin-bottom: 20px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 22px;">Gmitrzak English Academy</h1>
        </div>
        <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Hello John Doe! 👋</h2>
        <div style="font-size: 15px; color: #334155;">
          ${paragraphs}
        </div>
        <div style="text-align: center; margin: 28px 0;">
          <a href="https://www.gmitrzak-english-academy.pl" 
             style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 15px;">
            Go to Flashcards 🚀
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;"/>
        <p style="font-size: 13px; color: #64748b; margin: 0; text-align: center;">
          Best of luck with your studies,<br/><strong>The Gmitrzak English Academy Team</strong>
        </p>
      </div>`;
  });

  ngOnInit() {
    this.loadStudents();
  }

  loadStudents() {
    this.loading.set(true);
    this.reminderService.getStudentsForReminder().subscribe({
      next: (data) => {
        this.allStudents.set(data);
        // By default, pre-select all inactive students (>= 3 days)
        this.selectedStudents.set(data.filter(s => s.isInactiveForThreeDays));
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading students:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load students list.'
        });
        this.loading.set(false);
      }
    });
  }

  onCustomSelectionToggle() {
    if (!this.allowCustomSelection()) {
      // Reverting to default mode: pre-select all inactive students
      this.selectedStudents.set(this.inactiveStudents());
    }
  }

  resetTemplateToDefault() {
    this.customSubject.set(DEFAULT_SUBJECT);
    this.customBody.set(DEFAULT_BODY);
    this.messageService.add({
      severity: 'info',
      summary: 'Template Reset',
      detail: 'Restored default email text template.'
    });
  }

  confirmSendReminders() {
    const selected = this.selectedStudents();
    if (selected.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Selection',
        detail: 'Please select at least one student to send reminder emails.'
      });
      return;
    }

    this.confirmationService.confirm({
      message: `Are you sure you want to send flashcard reminder emails to ${selected.length} student(s)?`,
      header: 'Confirm Email Reminders',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.sendReminders();
      }
    });
  }

  sendReminders() {
    this.sending.set(true);
    const userIds = this.selectedStudents().map(s => s.id);

    this.reminderService.sendFlashcardReminders(userIds, this.customSubject(), this.customBody()).subscribe({
      next: (res) => {
        this.sending.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Sent ${res.sentCount} reminder email(s) successfully.${res.failedCount > 0 ? ` Failed: ${res.failedCount}` : ''}`
        });
      },
      error: (err) => {
        console.error('Error sending reminder emails:', err);
        this.sending.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to send reminder emails. Please check SMTP settings.'
        });
      }
    });
  }

  getDaysTagSeverity(days: number): 'danger' | 'warn' | 'info' | 'secondary' {
    if (days >= 7) return 'danger';
    if (days >= 3) return 'warn';
    return 'info';
  }
}
