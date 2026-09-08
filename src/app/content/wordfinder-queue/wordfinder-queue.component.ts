import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AvatarComponent } from '../../other/avatar/avatar.component';
import {
  WordfinderService,
  WordfinderCatalogueListDto,
  WordfinderCatalogueDto,
  WordfinderCatalogueEntryDto,
  WordfinderCatalogueStatus
} from '../../services/wordfinder.service';

@Component({
  selector: 'app-wordfinder-queue',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    TooltipModule,
    TextareaModule,
    SelectModule,
    IconFieldModule,
    InputIconModule,
    AvatarComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './wordfinder-queue.component.html'
})
export class WordfinderQueueComponent implements OnInit {
  private wordfinderService = inject(WordfinderService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  WordfinderCatalogueStatus = WordfinderCatalogueStatus;

  pendingCatalogues = signal<WordfinderCatalogueListDto[]>([]);
  loading = signal(false);
  processing = signal(false);

  // Computed Stats for Admin KPI Cards
  pendingCount = computed(() => this.pendingCatalogues().filter(c => {
    const s = String(c.status).toLowerCase();
    return s === 'pendingapproval' || s === '1';
  }).length);
  draftCount = computed(() => this.pendingCatalogues().filter(c => {
    const s = String(c.status).toLowerCase();
    return s === 'draft' || s === '0';
  }).length);
  approvedCount = computed(() => this.pendingCatalogues().filter(c => {
    const s = String(c.status).toLowerCase();
    return s === 'approved' || s === '2';
  }).length);
  rejectedCount = computed(() => this.pendingCatalogues().filter(c => {
    const s = String(c.status).toLowerCase();
    return s === 'rejected' || s === '3';
  }).length);

  // Status Filter State
  selectedStatus = signal<WordfinderCatalogueStatus | null>(WordfinderCatalogueStatus.PendingApproval);

  statusOptions = [
    { label: 'Pending Approval (Default)', value: WordfinderCatalogueStatus.PendingApproval },
    { label: 'Drafts (In Progress)', value: WordfinderCatalogueStatus.Draft },
    { label: 'Approved', value: WordfinderCatalogueStatus.Approved },
    { label: 'Rejected', value: WordfinderCatalogueStatus.Rejected },
    { label: 'All Statuses', value: null }
  ];

  // Review Dialog State
  reviewDialogVisible = signal(false);
  selectedCatalogue = signal<WordfinderCatalogueDto | null>(null);
  editableEntries = signal<WordfinderCatalogueEntryDto[]>([]);

  // Reject Dialog State
  rejectDialogVisible = signal(false);
  rejectionReason = signal('');

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  manualTranslateEntry(index: number) {
    const list = [...this.editableEntries()];
    const entry = list[index];
    if (!entry || !entry.front.trim()) return;

    this.wordfinderService.translateEntry(entry.front.trim()).subscribe({
      next: (res) => {
        const current = [...this.editableEntries()];
        if (current[index]) {
          current[index] = { ...current[index], back: res.translatedText ?? '' };
          this.editableEntries.set(current);
          this.messageService.add({ severity: 'info', summary: 'AI Translation', detail: `Translated "${entry.front}"` });
        }
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Translation failed' });
      }
    });
  }

  ngOnInit() {
    this.loadCatalogues();
  }

  loadCatalogues() {
    this.loading.set(true);
    const filter = this.selectedStatus();
    this.wordfinderService.getPendingCatalogues(filter).subscribe({
      next: (data) => {
        this.pendingCatalogues.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load Wordfinder catalogues' });
        this.loading.set(false);
      }
    });
  }

  onStatusFilterChange(value: WordfinderCatalogueStatus | null) {
    this.selectedStatus.set(value);
    this.loadCatalogues();
  }

  openReview(item: WordfinderCatalogueListDto) {
    this.loading.set(true);
    this.wordfinderService.getById(item.id).subscribe({
      next: (full) => {
        this.selectedCatalogue.set(full);
        this.editableEntries.set((full.entries || []).map(e => ({ ...e })));
        this.reviewDialogVisible.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load catalogue details' });
      }
    });
  }

  addEntry() {
    this.editableEntries.update(list => [...list, { front: '', back: '' }]);
  }

  removeEntry(index: number) {
    this.editableEntries.update(list => list.filter((_, i) => i !== index));
  }

  getFinalNamePreview(): string {
    const cat = this.selectedCatalogue();
    if (!cat) return '';
    const initials = cat.studentInitials || 'XX';
    return `${initials}_${cat.name}`;
  }

  approveCatalogue() {
    const cat = this.selectedCatalogue();
    if (!cat) return;

    const validEntries = this.editableEntries().filter(e => e.front.trim().length > 0);
    if (validEntries.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Catalogue must contain at least one valid entry' });
      return;
    }

    this.processing.set(true);
    this.wordfinderService.approveCatalogue(cat.id, validEntries).subscribe({
      next: (approved) => {
        this.processing.set(false);
        this.reviewDialogVisible.set(false);
        const finalName = `${approved.studentInitials}_${approved.name}`;
        this.messageService.add({
          severity: 'success',
          summary: 'Approved & Saved!',
          detail: `Catalogue "${finalName}" saved to system Catalogues & assigned as Flashcards to ${approved.studentUsername}!`,
          life: 6000
        });
        this.loadCatalogues();
      },
      error: (err) => {
        this.processing.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Approval failed' });
      }
    });
  }

  openRejectDialog() {
    this.rejectionReason.set('');
    this.rejectDialogVisible.set(true);
  }

  submitRejection() {
    const cat = this.selectedCatalogue();
    if (!cat) return;

    const reason = this.rejectionReason().trim();
    if (!reason) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please provide a rejection reason/feedback' });
      return;
    }

    this.processing.set(true);
    this.wordfinderService.rejectCatalogue(cat.id, reason).subscribe({
      next: () => {
        this.processing.set(false);
        this.rejectDialogVisible.set(false);
        this.reviewDialogVisible.set(false);
        this.messageService.add({ severity: 'info', summary: 'Catalogue Rejected', detail: 'Feedback sent back to student.' });
        this.loadCatalogues();
      },
      error: (err) => {
        this.processing.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Rejection failed' });
      }
    });
  }

  getStatusSeverity(status: any): 'info' | 'warn' | 'success' | 'danger' {
    if (status === null || status === undefined) return 'info';
    const s = String(status).toLowerCase();
    if (s === '0' || s === 'draft') return 'info';
    if (s === '1' || s === 'pendingapproval') return 'warn';
    if (s === '2' || s === 'approved') return 'success';
    if (s === '3' || s === 'rejected') return 'danger';
    return 'info';
  }

  getStatusLabel(status: any): string {
    if (status === null || status === undefined) return 'Draft';
    const s = String(status).toLowerCase();
    if (s === '0' || s === 'draft') return 'Draft (In Progress)';
    if (s === '1' || s === 'pendingapproval') return 'Pending Approval';
    if (s === '2' || s === 'approved') return 'Approved';
    if (s === '3' || s === 'rejected') return 'Rejected';
    return String(status);
  }
}
