import { Component, inject, signal, computed, effect } from '@angular/core';
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
import { AvatarComponent } from '../../other/avatar/avatar.component';

type LessonTab = 'flashcard' | 'sentence' | 'memory' | 'pronunciation';

export interface SentenceStockDto {
    id: number;
    polish: string;
    englishTranslation: string;
    category: string;
}

@Component({
    selector: 'app-lesson-mode',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule,
        TextareaModule, SelectModule, TagModule, ToastModule, AvatarComponent],
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
    
    sentenceSearchQuery = signal('');
    allSentenceStock = signal<SentenceStockDto[]>([]);
    loadingSentenceStock = signal(false);

    existingMemories = signal<any[]>([]);
    existingPronunciations = signal<any[]>([]);

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

    filteredSentenceStock = computed(() => {
        const query = this.sentenceSearchQuery().trim().toLowerCase();
        if (!query) return [];
        return this.allSentenceStock().filter(s => 
            s.polish.toLowerCase().includes(query) || 
            s.englishTranslation.toLowerCase().includes(query)
        );
    });

    isPronunciationDuplicate = computed(() => {
        const word = this.pronunciationWord().trim().toLowerCase();
        return this.existingPronunciations().some(p => p.word?.toLowerCase() === word);
    });

    isMemoryDuplicate = computed(() => {
        const content = this.memoryContent().trim().toLowerCase();
        return this.existingMemories().some(m => m.content?.toLowerCase() === content);
    });

    constructor() {
        effect(() => {
            const studentId = this.studentId;
            if (studentId) {
                this.loadStudentDataProtection(studentId);
                this.loadGlobalSentenceStock();
            }
        });

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
                    if (!q.trim() || !studentId) return of(null);
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

    loadStudentDataProtection(studentId: number) {
        this.lessonService.getMemories(studentId).subscribe({
            next: (res) => this.existingMemories.set(res || []),
            error: () => this.existingMemories.set([])
        });
        
        this.lessonService.getPronunciationTest(studentId).subscribe({
            next: (res) => this.existingPronunciations.set(res || []),
            error: () => this.existingPronunciations.set([])
        });
    }

    loadGlobalSentenceStock() {
        this.loadingSentenceStock.set(true);
        this.lessonService.getAllStock().subscribe({
            next: (res: any) => {
                this.allSentenceStock.set(res || []);
                this.loadingSentenceStock.set(false);
            },
            error: () => this.loadingSentenceStock.set(false)
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

    assignSentenceFromStock(sentence: SentenceStockDto) {
        const studentId = this.studentId;
        if (!studentId) return;

        this.savingSentence.set(true);
        const request = {
            userId: studentId,
            sentenceStockId: sentence.id,
            dueDate: new Date().toISOString().split('T')[0]
        };

        this.lessonService.assignToUser(request).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Assigned',
                    detail: 'Sentence assigned from database', life: 3000
                });
                this.sentenceSearchQuery.set('');
                this.savingSentence.set(false);
            },
            error: () => this.savingSentence.set(false)
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
                this.loadGlobalSentenceStock();
            },
            error: () => this.savingSentence.set(false)
        });
    }

    saveMemory() {
        const studentId = this.studentId;
        if (!this.memoryContent().trim() || studentId === null || this.isMemoryDuplicate()) return;

        this.savingMemory.set(true);
        this.lessonService.addMemory(
            studentId, this.memoryContent(), this.memoryNotes() || undefined
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Saved',
                    detail: 'Memory added', life: 3000
                });
                this.existingMemories.set([...this.existingMemories(), { content: this.memoryContent() }]);
                this.memoryContent.set('');
                this.memoryNotes.set('');
                this.savingMemory.set(false);
            },
            error: () => this.savingMemory.set(false)
        });
    }

    savePronunciation() {
        const studentId = this.studentId;
        if (!this.pronunciationWord().trim() || studentId === null || this.isPronunciationDuplicate()) return;

        this.savingPronunciation.set(true);
        this.lessonService.addPronunciation(studentId, this.pronunciationWord()).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Saved',
                    detail: `"${this.pronunciationWord()}" added`, life: 3000
                });
                this.existingPronunciations.set([...this.existingPronunciations(), { word: this.pronunciationWord() }]);
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