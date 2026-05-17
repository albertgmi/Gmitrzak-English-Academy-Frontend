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
import { LessonService, SearchFlashcardResult } from '../../services/lesson.service';

@Component({
    selector: 'app-global-flashcard',
    standalone: true,
    imports: [
        CommonModule, 
        FormsModule, 
        RouterModule,
        TableModule, 
        ButtonModule, 
        InputTextModule,
        IconFieldModule, 
        InputIconModule, 
        TagModule,
        ToolbarModule, 
        ToastModule, 
        ConfirmDialogModule,
        TooltipModule, 
        ChipModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './global-flashcard.component.html'
})
export class GlobalFlashcardComponent implements OnInit {
    private lessonService: LessonService = inject(LessonService);
    private messageService: MessageService = inject(MessageService);
    private confirmationService: ConfirmationService = inject(ConfirmationService);

    flashcards = signal<SearchFlashcardResult[]>([]);
    isLoading = signal<boolean>(false);
    selectedFlashcard = signal<SearchFlashcardResult | null>(null);

    ngOnInit(): void {
        this.loadGlobalFlashcards();
    }

    loadGlobalFlashcards(): void {
        this.isLoading.set(true);
        this.lessonService.getAllGlobalFlashcards().subscribe({
            next: (data: SearchFlashcardResult[]) => {
                this.flashcards.set(data);
                this.isLoading.set(false);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to fetch global flashcards.',
                    life: 3000
                });
                this.isLoading.set(false);
            }
        });
    }

    selectFlashcard(flashcard: SearchFlashcardResult): void {
        this.selectedFlashcard.set(flashcard);
    }

    backToList(): void {
        this.selectedFlashcard.set(null);
    }

    onGlobalFilter(table: any, event: Event): void {
        const element = event.target as HTMLInputElement;
        if (element) {
            table.filterGlobal(element.value, 'contains');
        }
    }

    reload(): void {
        this.loadGlobalFlashcards();
    }
}