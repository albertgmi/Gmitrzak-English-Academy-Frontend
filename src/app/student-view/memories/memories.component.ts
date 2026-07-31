import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ContentService, MemoryDto } from '../../services/student-services/content.service';
import { SectionActivityService } from '../../services/section-activity.service';

@Component({
    selector: 'app-memories',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, InputTextModule,
        IconFieldModule, InputIconModule, ButtonModule, TooltipModule, ToastModule],
    providers: [MessageService],
    templateUrl: './memories.component.html'
})
export class MemoriesComponent implements OnInit {
    private contentService = inject(ContentService);
    private activityService = inject(SectionActivityService);
    private messageService = inject(MessageService);

    memories = this.contentService.memories;

    revealedIds = signal<Set<number>>(new Set());
    editingId = signal<number | null>(null);
    editValue = signal('');
    savingId = signal<number | null>(null);

    ngOnInit() {
        this.activityService.logActivity('memories').subscribe({
            next: () => console.log('memories activity logged'),
            error: (e) => console.error('Failed to log memories activity', e)
        });
        this.contentService.memories.reload();
    }

    onGlobalFilter(table: any, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    isRevealed(id: number): boolean {
        return this.revealedIds().has(id);
    }

    toggleReveal(id: number, event?: Event) {
        event?.stopPropagation();
        this.revealedIds.update(set => {
            const next = new Set(set);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    startEdit(m: MemoryDto, event?: Event) {
        event?.stopPropagation();
        this.editingId.set(m.id);
        this.editValue.set(m.notes || '');
        this.revealedIds.update(set => new Set(set).add(m.id));

        setTimeout(() => {
            document.getElementById('note-input-' + m.id)?.focus();
        });
    }

    saveNote(id: number) {
        const value = this.editValue().trim();
        this.savingId.set(id);

        this.contentService.addNotes(id, value).subscribe({
            next: () => {
                this.memories.value.update(list =>
                    (list || []).map(m => m.id === id ? { ...m, notes: value } : m)
                );
                this.savingId.set(null);
                this.editingId.set(null);
                this.hideAgain(id);
            },
            error: () => {
                this.savingId.set(null);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Nie udało się zapisać notatki.'
                });
            }
        });
    }

    cancelEdit(id: number, event?: Event) {
        event?.stopPropagation();
        this.editingId.set(null);
        this.editValue.set('');
        this.hideAgain(id);
    }

    private hideAgain(id: number) {
        this.revealedIds.update(set => {
            const next = new Set(set);
            next.delete(id);
            return next;
        });
    }
}