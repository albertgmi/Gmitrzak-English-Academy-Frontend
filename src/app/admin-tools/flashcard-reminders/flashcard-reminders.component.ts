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
import { AccordionModule } from 'primeng/accordion';
import { MessageService, ConfirmationService } from 'primeng/api';
import { EmailReminderService, FlashcardInactiveUser } from '../../services/email-reminder.service';

const DEFAULT_SUBJECT = 'Gmitrzak English Academy – Time for your flashcards review! 📇';
const DEFAULT_BODY = `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
    <h2>Hello {username}! 👋</h2>
    <p>We noticed that you haven't reviewed your flashcards for at least 3 days.</p>
    <p>Consistency is key to mastering the English language! Log in to the platform and complete your daily review session.</p>
    <br/>
    <a href="https://www.gmitrzak-english-academy.pl" 
       style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Go to Flashcards 🚀
    </a>
    <br/><br/>
    <p>Best of luck with your studies,<br/>The Gmitrzak English Academy Team</p>
</div>`;

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
    AccordionModule
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

  // Customizable email subject and body template
  customSubject = signal<string>(DEFAULT_SUBJECT);
  customBody = signal<string>(DEFAULT_BODY);

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
      detail: 'Restored default email subject and body template.'
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
