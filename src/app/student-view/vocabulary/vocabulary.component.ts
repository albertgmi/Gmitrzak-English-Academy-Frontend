import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ContentService } from '../../services/student-services/content.service';

@Component({
    selector: 'app-vocabulary',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, InputTextModule,
        IconFieldModule, InputIconModule, TagModule, ToastModule],
    providers: [MessageService],
    templateUrl: './vocabulary.component.html'
})
export class VocabularyComponent {
    private contentService = inject(ContentService);

    flashcards = this.contentService.flashcards;

    ngOnInit() {
        this.contentService.flashcards.reload();
    }

    onGlobalFilter(table: any, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    intervalLabel(interval: number): string {
        if (interval === 0) return 'New';
        if (interval === 1) return '1 day';
        return `${interval} days`;
    }
}