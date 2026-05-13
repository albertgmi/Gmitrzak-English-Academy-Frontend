import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ChipModule } from 'primeng/chip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ModuleItem, ModuleItemService } from '../../../services/module.service';

@Component({
    selector: 'app-module',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule,
        TableModule, ButtonModule, InputTextModule,
        IconFieldModule, InputIconModule, TagModule,
        ToolbarModule, ToastModule, ConfirmDialogModule,
        TooltipModule, ChipModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './module.component.html'
})
export class ModuleComponent implements OnInit {
    private moduleService = inject(ModuleItemService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    modules = this.moduleService.modules;
    selectedModule = signal<ModuleItem | null>(null);

    ngOnInit() {
        this.moduleService.reloadModules();
    }

    selectModule(module: ModuleItem) {
        this.selectedModule.set(module);
    }

    backToList() {
        this.selectedModule.set(null);
    }

    confirmDelete(module: ModuleItem) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${module.name}"?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.moduleService.deleteModule(module.id).subscribe({
                    next: () => {
                        this.moduleService.reloadModules();
                        if (this.selectedModule()?.id === module.id) {
                            this.selectedModule.set(null);
                        }
                        this.messageService.add({
                            severity: 'success', summary: 'Deleted',
                            detail: `Module "${module.name}" deleted.`, life: 3000
                        });
                    },
                    error: () => this.messageService.add({
                        severity: 'error', summary: 'Error',
                        detail: 'Failed to delete module.', life: 3000
                    })
                });
            }
        });
    }

    onGlobalFilter(table: any, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    reload() {
        this.moduleService.reloadModules();
    }
}