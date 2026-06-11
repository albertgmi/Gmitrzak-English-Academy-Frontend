import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';
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
        ToastModule
    ],
    providers: [MessageService],
    templateUrl: './sentences.component.html'
})
export class SentencesComponent implements OnInit {
    private contentService = inject(ContentService);
    
    sentences = this.contentService.sentences;

    ngOnInit() {
        this.sentences.reload();
    }

    get currentData() {
        return this.sentences.value() || [];
    }

    get isLoading() {
        return this.sentences.isLoading();
    }

    onGlobalFilter(table: any, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }
}