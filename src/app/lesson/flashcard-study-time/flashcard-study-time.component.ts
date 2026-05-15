import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { AdminFlashcardService } from '../../services/admin-flashcard.service';

@Component({
  selector: 'app-flashcard-study-time',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    TableModule, 
    ButtonModule, 
    InputTextModule,
    IconFieldModule, 
    InputIconModule, 
    ToolbarModule, 
    TooltipModule
  ],
  templateUrl: './flashcard-study-time.component.html',
  styleUrl: './flashcard-study-time.component.scss'
})
export class FlashcardStudyTimeComponent implements OnInit {
  private adminFlashcardService = inject(AdminFlashcardService);

  summaries = this.adminFlashcardService.summaries;
  isLoading = this.adminFlashcardService.isLoading;

  ngOnInit(): void {
    this.reload();
  }

  onGlobalFilter(table: any, event: Event): void {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  reload(): void {
    this.adminFlashcardService.loadStudyLogsSummary();
  }
}