import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import {
    ContentService,
    PronunciationEntryDto,
    CorrectPronunciationDto
} from '../../services/student-services/content.service';
import { SectionActivityService } from '../../services/section-activity.service';

type PronunciationView = 'practice' | 'mastered';

@Component({
    selector: 'app-pronunciation',
    standalone: true,
    imports: [CommonModule, ToastModule, ButtonModule, TagModule, TooltipModule],
    providers: [MessageService],
    templateUrl: './pronunciation.component.html'
})
export class PronunciationComponent implements OnInit {
    private contentService  = inject(ContentService);
    private messageService  = inject(MessageService);
    private activityService = inject(SectionActivityService);

    entries         = this.contentService.pronunciation;
    correctEntries  = signal<CorrectPronunciationDto[]>([]);
    loadingCorrect  = signal(false);
    activeView      = signal<PronunciationView>('practice');

    incorrectEntries = computed(() =>
        (this.entries.value() ?? []).filter(e => e.status === 'Incorrect')
    );

    pendingEntries = computed(() =>
        (this.entries.value() ?? []).filter(e => e.status === 'Pending')
    );

    sessionCount = computed(() =>
        (this.entries.value() ?? []).length
    );

    ngOnInit() {
        this.activityService.logActivity('pronunciation').subscribe();
        this.contentService.pronunciation.reload();
    }

    loadMastered() {
        this.loadingCorrect.set(true);
        this.contentService.getCorrectPronunciation().subscribe({
            next: (res) => {
                this.correctEntries.set(res ?? []);
                this.loadingCorrect.set(false);
            },
            error: () => this.loadingCorrect.set(false)
        });
    }

    setView(view: PronunciationView) {
        this.activeView.set(view);
        if (view === 'mastered' && !this.correctEntries().length) {
            this.loadMastered();
        }
    }

    speak(word: string) {
        speechSynthesis.cancel();
        const u  = new SpeechSynthesisUtterance(word);
        u.lang   = 'en-US';
        u.rate   = 0.9;
        u.pitch  = 1;
        speechSynthesis.speak(u);
    }
}