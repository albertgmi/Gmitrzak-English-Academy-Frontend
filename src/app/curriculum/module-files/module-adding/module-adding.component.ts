import { Component, inject, signal, computed, OnInit } from '@angular/core';
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
        CommonModule, FormsModule, RouterModule, ButtonModule,
        InputTextModule, TextareaModule, CheckboxModule, SelectModule, ToastModule
    ],
    providers: [MessageService],
    templateUrl: './module-adding.component.html'
})
export class ModuleAddingComponent implements OnInit {
    private moduleService  = inject(ModuleItemService);
    private messageService = inject(MessageService);
    private router         = inject(Router);
    private theaterService = inject(TheaterService);

    private rawSentenceSets = signal<any[]>([]);

    submitted              = false;
    selectedSentenceSetId: number | null = null;

    newModule: CreateModuleRequest = {
        name: '',
        description: '',
        isHidden: false,
        category: 'General',
        theaterItemId: null,
        presentationUrl: null,
        presentationText: null,
        essayPrompt: null
    };

    categories = [
        { label: 'General', value: 'General'},
        { label: 'Sentences', value: 'Sentences'},
        { label: 'Sentence Flashcards', value: 'SentenceFlashcards'},
        { label: 'Flashcards', value: 'Flashcards'},
        { label: 'Memories', value: 'Memories'},
        { label: 'Pronunciation', value: 'Pronunciation'},
        { label: 'Listening', value: 'Listening'},
        { label: 'Grammar', value: 'Grammar'},
        { label: 'Vocabulary', value: 'Vocabulary'},
        { label: 'Speaking', value: 'Speaking'},
        { label: 'Watching', value: 'Watching'},
        { label: 'Presentation', value: 'Presentation'},
        { label: 'Essay', value: 'Essay'},
        { label: 'Comment', value: 'Comment'},
        { label: 'Other', value: 'Other'}
    ];

    theaterItemsOptions = computed(() =>
        (this.theaterService.items.value() ?? [])
            .filter(i => i.isActive)
            .map(i => ({ label: `[${i.level}] ${i.title}`, value: i.id }))
    );

    sentenceSetsOptions = computed(() =>
        this.rawSentenceSets().flatMap(group =>
            (group.sets || []).map((set: any) => ({
                label: `[${group.groupName}] ${set.name} (${set.itemCount} zdań)`,
                value: set.id
            }))
        )
    );

    ngOnInit() {
        this.theaterService.items.reload();
        this.moduleService.getAllSentenceSetsGrouped().subscribe({
            next: (data) => this.rawSentenceSets.set(data),
            error: () => console.error('Failed to load sentence sets')
        });
    }

    onCategoryChange() {
        this.newModule.theaterItemId    = null;
        this.newModule.presentationUrl  = null;
        this.newModule.presentationText = null;
        this.newModule.essayPrompt      = null;
        this.selectedSentenceSetId      = null;
    }

    save() {
        this.submitted = true;
        if (!this.newModule.name.trim()) return;

        if (this.newModule.category === 'Watching' && !this.newModule.theaterItemId) {
            this.showError('Please select a video for the Watching category.');
            return;
        }

        if (this.newModule.category === 'Sentences' && !this.selectedSentenceSetId) {
            this.showError('Please select a sentence set for the Sentences category.');
            return;
        }

        if (this.newModule.category === 'Essay' && !this.newModule.essayPrompt?.trim()) {
            this.showError('Please enter an essay prompt.');
            return;
        }

        this.moduleService.createModule(this.newModule).subscribe({
            next: (createdModule) => {
                if (this.newModule.category === 'Sentences' && this.selectedSentenceSetId) {
                    this.moduleService.assignSentenceSetToModule(
                        createdModule.id, this.selectedSentenceSetId
                    ).subscribe({
                        next: () => this.handleSuccess(createdModule.name),
                        error: () => this.showError('Module created but failed to assign sentence set.')
                    });
                } else {
                    this.handleSuccess(createdModule.name);
                }
            },
            error: () => this.showError('Failed to create module.')
        });
    }

    private handleSuccess(name: string) {
        this.messageService.add({
            severity: 'success', summary: 'Created',
            detail: `Module "${name}" created.`, life: 3000
        });
        this.moduleService.reloadModules();
        this.router.navigate(['/curriculum/modules']);
    }

    private showError(msg: string) {
        this.messageService.add({
            severity: 'error', summary: 'Error', detail: msg, life: 3000
        });
    }

    cancel() { this.router.navigate(['/curriculum/modules']); }
}