import { Component, inject, computed, signal } from '@angular/core';
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
    private rawSentenceSets = signal<any[]>([]);

    theaterItemsOptions = computed(() => {
        const rawItems = this.theaterService.items.value() ?? [];
        return rawItems
            .filter(item => item.isActive)
            .map(item => ({
                label: `[${item.level}] ${item.title}`,
                value: item.id
            }));
    });

    sentenceSetsOptions = computed(() => {
        return this.rawSentenceSets().flatMap(group => 
            (group.sets || []).map((set: any) => ({
                label: `[${group.groupName}] ${set.name} (${set.itemCount} zdań)`,
                value: set.id
            }))
        );
    });

    selectedSentenceSetId: number | null = null;

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


    ngOnInit() {
        this.moduleService.getAllSentenceSetsGrouped().subscribe({
            next: (data) => this.rawSentenceSets.set(data),
            error: () => console.error('Failed to load sentence sets')
        });
    }

    save() {
        this.submitted = true;
        if (!this.newModule.name.trim()) return;

        // Walidacja dla Watching
        if (this.newModule.category === 'Watching' && !this.newModule.theaterItemId) {
            this.showError('Please select a video for the Watching category.');
            return;
        }

        // Walidacja dla Sentences
        if (this.newModule.category === 'Sentences' && !this.selectedSentenceSetId) {
            this.showError('Please select a sentence set for the Sentences category.');
            return;
        }

        // Czyszczenie nieaktywnych pól zależnych od kategorii
        if (this.newModule.category !== 'Watching') this.newModule.theaterItemId = null;

        // 1. Tworzymy moduł
        this.moduleService.createModule(this.newModule).subscribe({
            next: (createdModule) => {
                
                // 2. Jeśli kategoria to 'Sentences', wykonujemy DRUGI krok (przypisanie)
                if (this.newModule.category === 'Sentences' && this.selectedSentenceSetId) {
                    this.moduleService.assignSentenceSetToModule(createdModule.id, this.selectedSentenceSetId).subscribe({
                        next: () => this.handleSuccess(createdModule.name),
                        error: () => this.showError('Module created, but failed to assign sentence set.')
                    });
                } else {
                    // Dla pozostałych kategorii po prostu kończymy sukcesem
                    this.handleSuccess(createdModule.name);
                }
            },
            error: () => this.showError('Failed to create module.')
        });
    }

    private handleSuccess(moduleName: string) {
        this.messageService.add({
            severity: 'success',
            summary: 'Created',
            detail: `Module "${moduleName}" created successfully.`,
            life: 3000
        });
        this.moduleService.reloadModules(); // Odświeżamy listę zasobów
        this.router.navigate(['/curriculum/modules']);
    }

    private showError(message: string) {
        this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: message,
            life: 3000
        });
    }

    cancel() {
        this.router.navigate(['/curriculum/modules']);
    }
}