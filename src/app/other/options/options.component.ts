import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { OptionsService, UserOptionsDto } from '../../services/options.service';

@Component({
    selector: 'app-options',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule,
        InputNumberModule, CheckboxModule, DialogModule, ToastModule, TagModule
    ],
    providers: [MessageService],
    templateUrl: './options.component.html'
})
export class OptionsComponent implements OnInit {
    private optionsService = inject(OptionsService);
    private messageService = inject(MessageService);

    allOptions = signal<UserOptionsDto[]>([]);
    loading    = signal(true);
    editDialog = signal(false);
    saving     = signal(false);
    edited     = signal<UserOptionsDto | null>(null);

    ngOnInit() {
        this.optionsService.getAll().subscribe({
            next: (d) => { this.allOptions.set(d); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    openEdit(opts: UserOptionsDto) {
        this.edited.set({ ...opts });
        this.editDialog.set(true);
    }

    save() {
        const o = this.edited();
        if (!o) return;
        this.saving.set(true);
        this.optionsService.update(o.userId, o).subscribe({
            next: () => {
                this.allOptions.update(list =>
                    list.map(x => x.userId === o.userId ? o : x)
                );
                this.messageService.add({
                    severity: 'success', summary: 'Saved',
                    detail: `Options for ${o.username} updated`, life: 3000
                });
                this.editDialog.set(false);
                this.saving.set(false);
            },
            error: () => this.saving.set(false)
        });
    }
}