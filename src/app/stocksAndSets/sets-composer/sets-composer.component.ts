import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { SentenceService, SentenceSetGroupDto } from '../../services/sentence.service';
import { ModuleItemService } from '../../services/module.service';

type View = 'groups' | 'create' | 'assign-module';

interface ModuleSimple {
    id: number;
    name: string;
}

@Component({
    selector: 'app-sets-composer',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, InputTextModule,
        InputNumberModule, SelectModule, MultiSelectModule, TagModule,
        ToastModule, ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './sets-composer.component.html'
})
export class SetsComposerComponent implements OnInit {
    private sentenceService     = inject(SentenceService);
    private moduleItemService   = inject(ModuleItemService);
    private messageService      = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    groups  = this.sentenceService.sets;
    stock   = this.sentenceService.stock;
    view    = signal<View>('groups');
    saving  = signal(false);
    submitted = false;

    newName      = signal('');
    newGroupName = signal('');
    newOrder     = signal(1);
    selectedStockIds = signal<number[]>([]);

    assignModuleId  = signal<number | null>(null);
    assignSetId     = signal<number | null>(null);
    assignSubmitted = false;
    assigning       = signal(false);

    modules = signal<ModuleSimple[]>([]);

    allSets = computed(() =>
        (this.sentenceService.sets.value() ?? [])
            .flatMap(g => g.sets)
            .map(s => ({ id: s.id, label: `${s.groupName} / ${s.name} (${s.itemCount} sentences)` }))
    );

    stockOptions = computed(() =>
        (this.stock.value() ?? [])
            .map(s => ({ id: s.id, label: `${s.polish} → ${s.englishTranslation}` }))
    );

    ngOnInit() {
        this.sentenceService.reloadSets();
        this.sentenceService.reloadStock();

        this.moduleItemService.modules.reload();

        const interval = setInterval(() => {
            const data = this.moduleItemService.modules.value();
            if (data !== undefined) {
                clearInterval(interval);
                this.modules.set(data.map(m => ({ id: m.id, name: m.name })));
            }
        }, 100);
    }

    createSet() {
        this.submitted = true;
        if (!this.newName().trim() || !this.newGroupName().trim()
            || this.selectedStockIds().length === 0) return;

        this.saving.set(true);
        this.sentenceService.createSet({
            name: this.newName(),
            groupName: this.newGroupName(),
            order: this.newOrder(),
            sentenceStockIds: this.selectedStockIds()
        }).subscribe({
            next: () => {
                this.sentenceService.reloadSets();
                this.messageService.add({
                    severity: 'success', summary: 'Created',
                    detail: `Set "${this.newName()}" created`, life: 3000
                });
                this.resetCreateForm();
                this.view.set('groups');
            },
            error: () => this.saving.set(false)
        });
    }

    assignToModule() {
        this.assignSubmitted = true;
        const mid = this.assignModuleId();
        const sid = this.assignSetId();
        if (!mid || !sid) return;

        this.assigning.set(true);
        this.sentenceService.assignSetToModule(mid, sid).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Assigned',
                    detail: 'Sentence set assigned to module', life: 3000
                });
                this.assignModuleId.set(null);
                this.assignSetId.set(null);
                this.assignSubmitted = false;
                this.assigning.set(false);
            },
            error: () => this.assigning.set(false)
        });
    }

    confirmDeleteSet(setId: number, name: string) {
        this.confirmationService.confirm({
            message: `Delete set "${name}"?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.sentenceService.deleteSet(setId).subscribe({
                    next: () => {
                        this.sentenceService.reloadSets();
                        this.messageService.add({
                            severity: 'success', summary: 'Deleted', life: 3000
                        });
                    }
                });
            }
        });
    }

    resetCreateForm() {
        this.newName.set('');
        this.newGroupName.set('');
        this.newOrder.set(1);
        this.selectedStockIds.set([]);
        this.submitted = false;
        this.saving.set(false);
    }
}