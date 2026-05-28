import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ContentService, PronunciationEntryDto } from '../../services/student-services/content.service';
import { SectionActivityService } from '../../services/section-activity.service';

@Component({
    selector: 'app-pronunciation',
    standalone: true,
    imports: [CommonModule, ToastModule, ButtonModule, TagModule],
    providers: [MessageService],
    templateUrl: './pronunciation.component.html'
})
export class PronunciationComponent {
    private contentService = inject(ContentService);
    private messageService = inject(MessageService);
    private activityService = inject(SectionActivityService);

    entries = this.contentService.pronunciation;

    unchecked = computed(() =>
        (this.entries.value() ?? []).filter(e => !e.isChecked)
    );

    checked = computed(() =>
        (this.entries.value() ?? []).filter(e => e.isChecked)
    );

    ngOnInit() {
        this.activityService.logActivity('pronunciation').subscribe();
        this.contentService.pronunciation.reload();
    }

    toggle(entry: PronunciationEntryDto) {
        const action = entry.isChecked
            ? this.contentService.uncheckPronunciation(entry.id)
            : this.contentService.checkPronunciation(entry.id);

        action.subscribe({
            next: () => this.contentService.pronunciation.reload(),
            error: () => this.messageService.add({
                severity: 'error', summary: 'Error',
                detail: 'Failed to update.', life: 3000
            })
        });
    }
    
    speak(word: string) {
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(word);

        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1;

        speechSynthesis.speak(utterance);
    }
}