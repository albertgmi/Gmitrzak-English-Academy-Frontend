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
  WordfinderCatalogueEntryDto,
  WordfinderCatalogueStatus
} from '../../services/wordfinder.service';

type ViewMode = 'list' | 'editor';

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
  entries = signal<WordfinderCatalogueEntryDto[]>([]);
  translatingIndex = signal<number | null>(null);
  spellCheckingIndex = signal<number | null>(null);

  // New Catalogue Dialog Signals
  createDialogVisible = signal(false);
  newCatalogueName = signal('');
  newCatalogueEntries = signal<WordfinderCatalogueEntryDto[]>([
    { front: '', back: '' },
    { front: '', back: '' },
    { front: '', back: '' }
  ]);
  dialogTranslatingIndex = signal<number | null>(null);
  dialogSpellCheckingIndex = signal<number | null>(null);

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
    this.newCatalogueEntries.set([
      { front: '', back: '' },
      { front: '', back: '' },
      { front: '', back: '' }
    ]);
    this.createDialogVisible.set(true);
  }

  addDialogEntry() {
    this.newCatalogueEntries.update(list => [...list, { front: '', back: '' }]);
  }

  removeDialogEntry(index: number) {
    this.newCatalogueEntries.update(list => list.filter((_, i) => i !== index));
    if (this.newCatalogueEntries().length === 0) {
      this.addDialogEntry();
    }
  }

  onDialogFrontBlur(index: number) {
    const entry = this.newCatalogueEntries()[index];
    if (entry.front.trim() && !entry.back.trim()) {
      this.translateDialogRow(index);
    }
  }

  translateDialogRow(index: number) {
    const entry = this.newCatalogueEntries()[index];
    if (!entry.front.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Translate', detail: 'Please enter English text first' });
      return;
    }

    this.dialogTranslatingIndex.set(index);
    this.wordfinderService.translateEntry(entry.front).subscribe({
      next: (res) => {
        this.dialogTranslatingIndex.set(null);
        if (res.translatedText) {
          const updated = [...this.newCatalogueEntries()];
          updated[index] = { ...updated[index], back: res.translatedText };
          this.newCatalogueEntries.set(updated);
          this.messageService.add({ severity: 'info', summary: 'AI Translation', detail: 'Polish translation generated!' });
        }
      },
      error: () => {
        this.dialogTranslatingIndex.set(null);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'AI Translation failed' });
      }
    });
  }

  spellCheckDialogRow(index: number) {
    const entry = this.newCatalogueEntries()[index];
    if (!entry.front.trim()) return;

    this.dialogSpellCheckingIndex.set(index);
    this.wordfinderService.spellCheckEntry(entry.front).subscribe({
      next: (res) => {
        this.dialogSpellCheckingIndex.set(null);
        if (res.hasError && res.corrected) {
          this.messageService.add({
            severity: 'warn',
            summary: 'AI SpellCheck Suggestion',
            detail: `Found typo: "${entry.front}" -> Suggestion: "${res.corrected}" (${res.reason ?? 'Correction'})`,
            life: 6000
          });
        } else {
          this.messageService.add({ severity: 'success', summary: 'AI SpellCheck', detail: 'No spelling errors found!' });
        }
      },
      error: () => {
        this.dialogSpellCheckingIndex.set(null);
      }
    });
  }

  createCatalogue() {
    const name = this.newCatalogueName().trim();
    if (!name) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Catalogue name is required' });
      return;
    }

    const validEntries = this.newCatalogueEntries().filter(e => e.front.trim().length > 0);

    this.saving.set(true);
    this.wordfinderService.createDraft({ name, entries: validEntries }).subscribe({
      next: (created) => {
        this.saving.set(false);
        this.createDialogVisible.set(false);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: `Catalogue "${created.name}" created with ${created.entries?.length || 0} words!` });
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
        const initialEntries = full.entries && full.entries.length > 0
          ? full.entries.map(e => ({ ...e }))
          : [{ front: '', back: '' }, { front: '', back: '' }];
        this.entries.set(initialEntries);
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
    const entry = this.entries()[index];
    if (entry.front.trim() && !entry.back.trim()) {
      this.translateRow(index);
    }
  }

  translateRow(index: number) {
    const entry = this.entries()[index];
    if (!entry.front.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Translate', detail: 'Please enter English text first' });
      return;
    }

    this.translatingIndex.set(index);
    this.wordfinderService.translateEntry(entry.front).subscribe({
      next: (res) => {
        this.translatingIndex.set(null);
        if (res.translatedText) {
          const updated = [...this.entries()];
          updated[index] = { ...updated[index], back: res.translatedText };
          this.entries.set(updated);
          this.messageService.add({ severity: 'info', summary: 'AI Translation', detail: 'Polish translation generated!' });
        }
      },
      error: () => {
        this.translatingIndex.set(null);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'AI Translation failed' });
      }
    });
  }

  autoTranslateAll() {
    const currentEntries = this.entries();
    const untranslatedIndices = currentEntries
      .map((e, idx) => (e.front.trim() && !e.back.trim() ? idx : -1))
      .filter(idx => idx !== -1);

    if (untranslatedIndices.length === 0) {
      this.messageService.add({ severity: 'info', summary: 'Auto-Translate', detail: 'No empty Polish translations found' });
      return;
    }

    untranslatedIndices.forEach(idx => this.translateRow(idx));
  }

  spellCheckRow(index: number) {
    const entry = this.entries()[index];
    if (!entry.front.trim()) return;

    this.spellCheckingIndex.set(index);
    this.wordfinderService.spellCheckEntry(entry.front).subscribe({
      next: (res) => {
        this.spellCheckingIndex.set(null);
        if (res.hasError && res.corrected) {
          this.messageService.add({
            severity: 'warn',
            summary: 'AI SpellCheck Suggestion',
            detail: `Found typo: "${entry.front}" -> Suggestion: "${res.corrected}" (${res.reason ?? 'Correction'})`,
            life: 6000
          });
        } else {
          this.messageService.add({ severity: 'success', summary: 'AI SpellCheck', detail: 'No spelling errors found!' });
        }
      },
      error: () => {
        this.spellCheckingIndex.set(null);
      }
    });
  }

  saveDraft(silent = false): Promise<boolean> {
    const cat = this.activeCatalogue();
    if (!cat) return Promise.resolve(false);

    const name = this.catalogueName().trim();
    if (!name) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Catalogue name is required' });
      return Promise.resolve(false);
    }

    const validEntries = this.entries().filter(e => e.front.trim().length > 0);

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
      message: `Are you sure you want to delete "${catListDto.name}" and all its words? This action cannot be undone.`,
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
