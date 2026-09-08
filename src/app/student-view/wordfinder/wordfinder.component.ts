import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import {
  WordfinderService,
  WordfinderCatalogueListDto,
  WordfinderCatalogueDto,
  WordfinderCatalogueStatus,
  SpellCheckResult
} from '../../services/wordfinder.service';

type ViewMode = 'list' | 'editor';

export interface EditableEntry {
  id?: number;
  front: string;
  back: string;
  spellCheckResult?: SpellCheckResult | null;
  checkingSpell?: boolean;
  translating?: boolean;
}

@Component({
  selector: 'app-wordfinder',
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
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './wordfinder.component.html'
})
export class WordfinderComponent implements OnInit {
  private wordfinderService = inject(WordfinderService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  WordfinderCatalogueStatus = WordfinderCatalogueStatus;

  catalogues = signal<WordfinderCatalogueListDto[]>([]);
  loading = signal(false);
  saving = signal(false);

  viewMode = signal<ViewMode>('list');
  activeCatalogue = signal<WordfinderCatalogueDto | null>(null);

  catalogueName = signal('');
  entries = signal<EditableEntry[]>([]);

  // Create Catalogue Modal
  createDialogVisible = signal(false);
  newCatalogueName = signal('');

  ngOnInit() {
    this.loadCatalogues();
  }

  loadCatalogues() {
    this.loading.set(true);
    this.wordfinderService.getMyCatalogues().subscribe({
      next: (data) => {
        this.catalogues.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load your Wordfinder catalogues' });
        this.loading.set(false);
      }
    });
  }

  openCreateDialog() {
    this.newCatalogueName.set('');
    this.createDialogVisible.set(true);
  }

  createCatalogue() {
    const name = this.newCatalogueName().trim();
    if (!name) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Catalogue name is required' });
      return;
    }

    this.saving.set(true);
    this.wordfinderService.createDraft({ name }).subscribe({
      next: (created) => {
        this.saving.set(false);
        this.createDialogVisible.set(false);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: `Catalogue "${created.name}" created!` });
        this.openEditor(created);
        this.loadCatalogues();
      },
      error: (err) => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to create catalogue' });
      }
    });
  }

  openEditor(catalogueListDto: WordfinderCatalogueListDto | WordfinderCatalogueDto) {
    this.loading.set(true);
    this.wordfinderService.getById(catalogueListDto.id).subscribe({
      next: (full) => {
        this.activeCatalogue.set(full);
        this.catalogueName.set(full.name);
        const mappedEntries: EditableEntry[] = full.entries && full.entries.length > 0
          ? full.entries.map(e => ({ id: e.id, front: e.front, back: e.back, spellCheckResult: null }))
          : [{ front: '', back: '' }, { front: '', back: '' }];
        this.entries.set(mappedEntries);
        this.viewMode.set('editor');
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load catalogue details' });
      }
    });
  }

  backToList() {
    this.viewMode.set('list');
    this.activeCatalogue.set(null);
    this.loadCatalogues();
  }

  addEntry() {
    this.entries.update(list => [...list, { front: '', back: '' }]);
  }

  removeEntry(index: number) {
    this.entries.update(list => list.filter((_, i) => i !== index));
    if (this.entries().length === 0) {
      this.addEntry();
    }
  }

  onFrontBlur(index: number) {
    const list = [...this.entries()];
    const entry = list[index];
    if (!entry || !entry.front.trim()) return;

    const trimmedFront = entry.front.trim();

    // 1. Auto-Translate Polish if Back is empty
    if (!entry.back.trim() && !entry.translating) {
      entry.translating = true;
      this.entries.set(list);

      this.wordfinderService.translateEntry(trimmedFront).subscribe({
        next: (res) => {
          const current = [...this.entries()];
          if (current[index]) {
            current[index] = { ...current[index], back: res.translatedText ?? '', translating: false };
            this.entries.set(current);
          }
        },
        error: () => {
          const current = [...this.entries()];
          if (current[index]) {
            current[index] = { ...current[index], translating: false };
            this.entries.set(current);
          }
        }
      });
    }

    // 2. Auto-SpellCheck English front
    if (trimmedFront.length >= 2 && !entry.checkingSpell) {
      entry.checkingSpell = true;
      this.entries.set(list);

      this.wordfinderService.spellCheckEntry(trimmedFront).subscribe({
        next: (res) => {
          const current = [...this.entries()];
          if (current[index]) {
            current[index] = {
              ...current[index],
              checkingSpell: false,
              spellCheckResult: (res && res.hasError && res.corrected) ? res : null
            };
            this.entries.set(current);
          }
        },
        error: () => {
          const current = [...this.entries()];
          if (current[index]) {
            current[index] = { ...current[index], checkingSpell: false };
            this.entries.set(current);
          }
        }
      });
    }
  }

  acceptSpellCorrection(index: number) {
    const list = [...this.entries()];
    const entry = list[index];
    if (entry && entry.spellCheckResult?.corrected) {
      entry.front = entry.spellCheckResult.corrected;
      entry.spellCheckResult = null;
      this.entries.set(list);
      // Re-trigger translation for the corrected word
      this.onFrontBlur(index);
    }
  }

  rejectSpellCorrection(index: number) {
    const list = [...this.entries()];
    const entry = list[index];
    if (entry) {
      entry.spellCheckResult = null;
      this.entries.set(list);
    }
  }

  saveDraft(silent = false): Promise<boolean> {
    const cat = this.activeCatalogue();
    if (!cat) return Promise.resolve(false);

    const name = this.catalogueName().trim();
    if (!name) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Catalogue name is required' });
      return Promise.resolve(false);
    }

    const validEntries = this.entries()
      .filter(e => e.front.trim().length > 0)
      .map(e => ({ front: e.front.trim(), back: e.back.trim() }));

    this.saving.set(true);
    return new Promise((resolve) => {
      this.wordfinderService.updateDraft(cat.id, { name, entries: validEntries }).subscribe({
        next: (updated) => {
          this.saving.set(false);
          this.activeCatalogue.set(updated);
          if (!silent) {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Draft saved successfully' });
          }
          resolve(true);
        },
        error: (err) => {
          this.saving.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to save draft' });
          resolve(false);
        }
      });
    });
  }

  async submitForApproval() {
    const validEntries = this.entries().filter(e => e.front.trim().length > 0);
    if (validEntries.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please add at least one vocabulary entry before submitting' });
      return;
    }

    const saved = await this.saveDraft(true);
    if (!saved) return;

    const cat = this.activeCatalogue();
    if (!cat) return;

    this.saving.set(true);
    this.wordfinderService.submit(cat.id).subscribe({
      next: (submitted) => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Submitted!',
          detail: `Catalogue "${submitted.name}" was sent for Admin approval!`
        });
        this.backToList();
      },
      error: (err) => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Submission failed' });
      }
    });
  }

  confirmDelete(catListDto: WordfinderCatalogueListDto | WordfinderCatalogueDto) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete catalogue "${catListDto.name}" and all its words? This action cannot be undone.`,
      header: 'Confirm Delete Catalogue',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Delete Catalogue' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancel' },
      accept: () => {
        this.wordfinderService.deleteDraft(catListDto.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Catalogue deleted' });
            if (this.viewMode() === 'editor') {
              this.backToList();
            } else {
              this.loadCatalogues();
            }
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Delete failed' });
          }
        });
      }
    });
  }

  getStatusSeverity(status: WordfinderCatalogueStatus): 'info' | 'warn' | 'success' | 'danger' {
    switch (status) {
      case WordfinderCatalogueStatus.Draft: return 'info';
      case WordfinderCatalogueStatus.PendingApproval: return 'warn';
      case WordfinderCatalogueStatus.Approved: return 'success';
      case WordfinderCatalogueStatus.Rejected: return 'danger';
      default: return 'info';
    }
  }

  getStatusLabel(status: WordfinderCatalogueStatus): string {
    switch (status) {
      case WordfinderCatalogueStatus.Draft: return 'Draft';
      case WordfinderCatalogueStatus.PendingApproval: return 'Pending Approval';
      case WordfinderCatalogueStatus.Approved: return 'Approved';
      case WordfinderCatalogueStatus.Rejected: return 'Rejected';
      default: return 'Draft';
    }
  }

  isEditable(cat: WordfinderCatalogueDto | null): boolean {
    if (!cat) return false;
    return cat.status === WordfinderCatalogueStatus.Draft || cat.status === WordfinderCatalogueStatus.Rejected;
  }
}
