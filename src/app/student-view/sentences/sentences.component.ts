import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ContentService } from '../../services/student-services/content.service';

@Component({
    selector: 'app-sentences',
    standalone: true,
    imports: [
        CommonModule, 
        FormsModule, 
        TableModule, 
        InputTextModule,
        IconFieldModule, 
        InputIconModule, 
        ToastModule, 
        SelectButtonModule, 
        TagModule
    ],
    providers: [MessageService],
    templateUrl: './sentences.component.html'
})
export class SentencesComponent implements OnInit {
    private contentService = inject(ContentService);
    
    sentences = this.contentService.sentences;
    otherSentences = this.contentService.otherSentences; 

    viewOptions = [
        { label: 'My Flashcards', value: 'flashcards' },
        { label: 'Assigned Sentences', value: 'other' }
    ];
    
    selectedView: 'flashcards' | 'other' = 'flashcards';

    ngOnInit() {
        this.sentences.reload();
        this.otherSentences.reload();
    }

    get currentData() {
        return this.selectedView === 'flashcards' 
            ? this.sentences.value() || [] 
            : this.otherSentences.value() || [];
    }

    get isLoading() {
        return this.selectedView === 'flashcards' 
            ? this.sentences.isLoading() 
            : this.otherSentences.isLoading();
    }

    onGlobalFilter(table: any, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    onViewChange() {
        if (this.selectedView === 'other' && !this.otherSentences.value()) {
            this.otherSentences.reload();
        }
    }
}