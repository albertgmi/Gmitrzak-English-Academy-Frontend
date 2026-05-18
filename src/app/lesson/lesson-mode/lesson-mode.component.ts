import { Component, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LessonService } from '../../services/lesson.service';
import { VocabularyService, SearchVocabularyResult } from '../../services/vocabulary.service';
import { LessonContextService } from '../../services/lesson-context.service';
import { debounceTime, distinctUntilChanged, switchMap, tap, of } from 'rxjs';

type LessonTab = 'flashcard' | 'sentence' | 'memory' | 'pronunciation';

@Component({
    selector: 'app-lesson-mode',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule,
        TextareaModule, SelectModule, TagModule, ToastModule],
    providers: [MessageService],
    templateUrl: './lesson-mode.component.html'
})
export class LessonModeComponent {
    private lessonService = inject(LessonService);
    private vocabularyService = inject(VocabularyService);
    private lessonContext = inject(LessonContextService);
    private router = inject(Router);
    private messageService = inject(MessageService);

    activeStudent = this.lessonContext.activeStudent;
    activeTab = signal<LessonTab>('flashcard');

    searchQuery = signal('');
    searchResult = signal<SearchVocabularyResult | null>(null);
    searching = signal(false);
    saving = signal(false);

    newFront = signal('');
    newBack = signal('');
    newCategory = signal('Vocabulary');

    sentenceContent = signal('');
    sentenceTranslation = signal('');
    sentenceNotes = signal('');
    savingSentence = signal(false);

    memoryContent = signal('');
    memoryNotes = signal('');
    savingMemory = signal(false);

    pronunciationWord = signal('');
    savingPronunciation = signal(false);

    categories = [
        { label: 'Vocabulary', value: 'Vocabulary' },
        { label: 'Phrase', value: 'Phrase' },
        { label: 'Idiom', value: 'Idiom' },
        { label: 'Grammar', value: 'Grammar' },
        { label: 'Other', value: 'Other' }
    ];

    tabs: { id: LessonTab; label: string; icon: string }[] = [
        { id: 'flashcard', label: 'Flashcard', icon: 'pi pi-clone' },
        { id: 'sentence', label: 'Sentence', icon: 'pi pi-align-left' },
        { id: 'memory', label: 'Memory', icon: 'pi pi-lightbulb' },
        { id: 'pronunciation', label: 'Pronunciation', icon: 'pi pi-microphone' }
    ];

    get studentId(): number | null {
        return this.lessonContext.studentId;
    }

    constructor() {
        toObservable(this.searchQuery)
            .pipe(
                debounceTime(300),
                distinctUntilChanged(),
                tap((q) => {
                    if (!q.trim()) {
                        this.searchResult.set(null);
                        this.searching.set(false);
                    }
                }),
                switchMap((q) => {
                    const studentId = this.studentId;
                    if (!q.trim() || !studentId) {
                        return of(null);
                    }
                    this.searching.set(true);
                    return this.vocabularyService.searchVocabulary(q.trim(), studentId);
                })
            )
            .subscribe({
                next: (result) => {
                    this.searching.set(false);
                    if (result) {
                        this.searchResult.set(result);
                        if (!result.existsInGlobal) {
                            this.newFront.set(result.front);
                        }
                    }
                },
                error: () => this.searching.set(false)
            });
    }

    assignExisting() {
        const result = this.searchResult();
        const studentId = this.studentId;
        if (!result?.id || !studentId) return;

        this.saving.set(true);
        this.vocabularyService.assignSingleVocabularyToStudent(result.id, studentId).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Assigned',
                    detail: `"${result.front}" assigned to student`, life: 3000
                });
                this.resetFlashcardForm();
                this.saving.set(false);
            },
            error: () => this.saving.set(false)
        });
    }

    addManualAndAssign() {
        const studentId = this.studentId;
        if (!this.newFront().trim() || !this.newBack().trim() || !studentId) return;

        this.saving.set(true);
        this.vocabularyService.addTranslation(
            this.newFront(),
            this.newBack(),
            this.newCategory()
        ).pipe(
            switchMap((global) => {
                return this.vocabularyService.assignSingleVocabularyToStudent(global.id, studentId);
            })
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Added & assigned',
                    detail: `"${this.newFront()}" added to global DB and assigned to student`,
                    life: 3000
                });
                this.resetFlashcardForm();
                this.saving.set(false);
            },
            error: () => this.saving.set(false)
        });
    }

    resetFlashcardForm() {
        this.searchQuery.set('');
        this.searchResult.set(null);
        this.newFront.set('');
        this.newBack.set('');
        this.newCategory.set('Vocabulary');
    }

    saveSentence() {
        const studentId = this.studentId;
        if (!this.sentenceContent().trim() || !studentId) return;

        this.savingSentence.set(true);
        this.lessonService.addSentence(
            studentId, this.sentenceContent(),
            this.sentenceTranslation(), this.sentenceNotes() || undefined
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Saved',
                    detail: 'Sentence added', life: 3000
                });
                this.sentenceContent.set('');
                this.sentenceTranslation.set('');
                this.sentenceNotes.set('');
                this.savingSentence.set(false);
            },
            error: () => this.savingSentence.set(false)
        });
    }

    saveMemory() {
        const studentId = this.studentId;
        if (!this.memoryContent().trim() || !studentId) return;

        this.savingMemory.set(true);
        this.lessonService.addMemory(
            studentId, this.memoryContent(), this.memoryNotes() || undefined
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Saved',
                    detail: 'Memory added', life: 3000
                });
                this.memoryContent.set('');
                this.memoryNotes.set('');
                this.savingMemory.set(false);
            },
            error: () => this.savingMemory.set(false)
        });
    }

    savePronunciation() {
        const studentId = this.studentId;
        if (!this.pronunciationWord().trim() || !studentId) return;

        this.savingPronunciation.set(true);
        this.lessonService.addPronunciation(studentId, this.pronunciationWord()).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Saved',
                    detail: `"${this.pronunciationWord()}" added`, life: 3000
                });
                this.pronunciationWord.set('');
                this.savingPronunciation.set(false);
            },
            error: () => this.savingPronunciation.set(false)
        });
    }

    goToSwitchClient() {
        this.router.navigate(['/lesson/switch-client']);
    }
}