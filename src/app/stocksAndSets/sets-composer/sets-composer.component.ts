import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { SentenceService, SentenceSetGroupDto, SentenceStockDto } from '../../services/sentence.service';
import { UserService } from '../../services/user.service';
import { MultiSelectModule } from 'primeng/multiselect';

type View = 'groups' | 'create' | 'assign';

@Component({
    selector: 'app-sets-composer',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, InputTextModule,
        InputNumberModule, SelectModule, DatePickerModule, TagModule,
        ToastModule, ConfirmDialogModule, MultiSelectModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './sets-composer.component.html'
})
export class SetsComposerComponent implements OnInit {
    private sentenceService = inject(SentenceService);
    private userService = inject(UserService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    groups = this.sentenceService.sets;
    stock = this.sentenceService.stock;
    view = signal<View>('groups');
    saving = signal(false);
    submitted = false;

    // create form
    newName = signal('');
    newGroupName = signal('');
    newOrder = signal(1);
    selectedStockIds = signal<number[]>([]);

    // assign form
    assignUserId = signal<number | null>(null);
    assignSetId = signal<number | null>(null);
    assignDueDate = signal<Date | null>(null);
    assignSubmitted = false;
    assigning = signal(false);

    students = computed(() =>
        (this.userService.users.value() ?? [])
            .filter(u => u.role === 'User')
            .map(u => ({ id: u.id, label: u.username }))
    );

    allSets = computed(() =>
        (this.sentenceService.sets.value() ?? [])
            .flatMap(g => g.sets)
            .map(s => ({ id: s.id, label: `${s.groupName} / ${s.name}` }))
    );

    stockOptions = computed(() =>
        (this.stock.value() ?? [])
            .map(s => ({ id: s.id, label: `${s.polish} → ${s.englishTranslation}` }))
    );

    ngOnInit() {
        this.sentenceService.reloadSets();
        this.sentenceService.reloadStock();
        this.userService.users.reload();
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

    assignSet() {
        this.assignSubmitted = true;
        const uid  = this.assignUserId();
        const sid  = this.assignSetId();
        const date = this.assignDueDate();
        if (!uid || !sid || !date) return;

        this.assigning.set(true);
        this.sentenceService.assign(uid, this.formatDate(date), sid).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Assigned', life: 3000
                });
                this.assignUserId.set(null);
                this.assignSetId.set(null);
                this.assignDueDate.set(null);
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

    formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }
}