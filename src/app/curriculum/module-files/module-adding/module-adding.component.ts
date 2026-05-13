import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ModuleItemService, CreateModuleRequest } from '../../../services/module.service';

@Component({
    selector: 'app-module-adding',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule,
        ButtonModule, InputTextModule, TextareaModule, 
        CheckboxModule, ToastModule
    ],
    providers: [MessageService],
    templateUrl: './module-adding.component.html'
})
export class ModuleAddingComponent {
    private moduleService = inject(ModuleItemService);
    private messageService = inject(MessageService);
    private router = inject(Router);

    newModule: CreateModuleRequest = { name: '', description: '', isHidden: false };
    submitted = false;

    save() {
        this.submitted = true;
        if (!this.newModule.name.trim()) return;

        this.moduleService.createModule(this.newModule).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', 
                    summary: 'Created',
                    detail: `Module "${this.newModule.name}" created.`, 
                    life: 3000
                });
                this.router.navigate(['/curriculum/modules']);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error', 
                    summary: 'Error',
                    detail: 'Failed to create module.', 
                    life: 3000
                });
            }
        });
    }

    cancel() {
        this.router.navigate(['/curriculum/modules']);
    }
}