import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ModuleItemService, CreateModuleRequest } from '../../../services/module.service';
import { TheaterService } from '../../../services/theater.service';

@Component({
    selector: 'app-module-adding',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule,
        ButtonModule, InputTextModule, TextareaModule,
        CheckboxModule, SelectModule, ToastModule
    ],
    providers: [MessageService],
    templateUrl: './module-adding.component.html'
})
export class ModuleAddingComponent {
    private moduleService = inject(ModuleItemService);
    private messageService = inject(MessageService);
    private router = inject(Router);
    private theaterService = inject(TheaterService);

    theaterItemsOptions = computed(() => {
        const rawItems = this.theaterService.items.value() ?? [];
        return rawItems
            .filter(item => item.isActive)
            .map(item => ({
                label: `[${item.level}] ${item.title}`,
                value: item.id
            }));
    });

    newModule: CreateModuleRequest = {
        name: '',
        description: '',
        isHidden: false,
        category: 'General',
        theaterItemId: null
    };
    submitted = false;

    categories = [
        { label: 'General',    value: 'General' },
        { label: 'Sentences',  value: 'Sentences' },
        { label: 'Listening',  value: 'Listening' },
        { label: 'Grammar',    value: 'Grammar' },
        { label: 'Vocabulary', value: 'Vocabulary' },
        { label: 'Speaking',   value: 'Speaking' },
        { label: 'Watching',   value: 'Watching' },
        { label: 'Other',      value: 'Other' }
    ];

    save() {
        this.submitted = true;
        if (!this.newModule.name.trim()) return;

        if (this.newModule.category === 'Watching' && !this.newModule.theaterItemId) {
            this.messageService.add({
                severity: 'error',
                summary: 'Validation Error',
                detail: 'Please select a video for the Watching category.'
            });
            return;
        }

        if (this.newModule.category !== 'Watching') {
            this.newModule.theaterItemId = null;
        }

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