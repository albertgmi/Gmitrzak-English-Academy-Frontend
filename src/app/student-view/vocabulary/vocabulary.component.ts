import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FlashcardService } from '../../services/student-services/flashcard.service';

@Component({
    selector: 'app-vocabulary',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, InputTextModule,
        IconFieldModule, InputIconModule, TagModule, ToastModule],
    providers: [MessageService],
    templateUrl: './vocabulary.component.html'
})
export class VocabularyComponent {
    private flashcardService = inject(FlashcardService);
    flashcards = this.flashcardService.flashcards;

    ngOnInit() {
        this.flashcardService.flashcards.reload();
    }

    onGlobalFilter(table: any, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }
}