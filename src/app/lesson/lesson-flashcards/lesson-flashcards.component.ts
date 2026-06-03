import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LessonPanelService, LessonFlashcardSummaryDto, LessonFlashcardDto } from '../../services/lesson-panel.service';
import { LessonContextService } from '../../services/lesson-context.service';
import { ButtonModule } from 'primeng/button';
import { AvatarComponent } from '../../other/avatar/avatar.component';

@Component({
    selector: 'app-lesson-flashcards',
    standalone: true,
    imports: [CommonModule, TableModule, TagModule, ToastModule, ButtonModule, AvatarComponent],
    providers: [MessageService],
    templateUrl: './lesson-flashcards.component.html'
})
export class LessonFlashcardsComponent implements OnInit {
    private service = inject(LessonPanelService);
    private lessonContext = inject(LessonContextService);
    private router = inject(Router);

    activeStudent = this.lessonContext.activeStudent;
    data = signal<LessonFlashcardSummaryDto | null>(null);
    loading = signal(true);

    allFlashcards = signal<LessonFlashcardDto[]>([]);
    loadingAll = signal(true);

    ngOnInit() {
        const id = this.lessonContext.studentId;
        if (!id) return;
        this.service.getFlashcards(id).subscribe({
            next: (d) => { this.data.set(d); this.loading.set(false); },
            error: () => this.loading.set(false)
        });

        this.service.getAllFlashcards(id).subscribe({
            next: (cards) => { this.allFlashcards.set(cards); this.loadingAll.set(false); },
            error: () => this.loadingAll.set(false)
        });
    }

    formatTime(seconds: number): string {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    }

    goToSwitchClient() { this.router.navigate(['/lesson/switch-client']); }
}