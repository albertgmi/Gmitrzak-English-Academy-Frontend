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
import { LessonPronunciationTestItemDto, LessonService} from '../../services/lesson.service';
import { VocabularyService, SearchVocabularyResult } from '../../services/vocabulary.service';
import { LessonContextService } from '../../services/lesson-context.service';
import { debounceTime, distinctUntilChanged, switchMap, tap, of } from 'rxjs';
import { AvatarComponent } from '../../other/avatar/avatar.component';
import { SpellCheckResult } from "../../services/lesson.service";
import { CatalogueService, CatalogueDto } from '../../services/catalogue.service';
import { SentenceService as SentenceSetsService } from '../../services/sentence.service';
import { AlphabetTestItemDto } from '../../services/lesson.service';
import { AdminMemoriesService } from '../../services/admin-memories.service';

type LessonTab = 'flashcard' | 'sentence' | 'memory' | 'pronunciation' | 'alphabet' | 'catalogues';

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
    private catalogueService = inject(CatalogueService);
    private sentenceSetsService = inject(SentenceSetsService);
    private adminMemoriesService = inject(AdminMemoriesService);

    activeStudent = this.lessonContext.activeStudent;
    activeTab = signal<LessonTab>('flashcard');

    setActiveTab(tab: LessonTab) {
        this.activeTab.set(tab);
        if (tab === 'catalogues') {
            this.catalogueService.reloadCatalogues();
            this.sentenceSetsService.reloadSets();
        }
        if (tab === 'alphabet') {
            this.loadAlphabetTest();
        }
    }

    searchQuery = signal('');
    searchResult = signal<SearchVocabularyResult[] | null>(null);
    searching = signal(false);
    saving = signal(false);
    newFront = signal('');
    newBack = signal('');
    newCategory = signal('Vocabulary');
    checkingDuplicateFlashcard = signal(false);
    isFlashcardDuplicate = signal(false);

    sentenceContent = signal('');
    sentenceTranslation = signal('');
    sentenceNotes = signal('');
    savingSentence = signal(false);
    sentenceSearchQuery = signal('');
    sentenceSearchResult = signal<any[] | null>(null);
    searchingSentence = signal(false);
    checkingDuplicateSentence = signal(false);
    isSentenceDuplicate = signal(false);

    spellCheckFront = signal<SpellCheckResult | null>(null);
    checkingSpellFront = signal(false);

    spellCheckBack = signal<SpellCheckResult | null>(null);
    checkingSpellBack = signal(false);

    spellCheckSentence = signal<SpellCheckResult | null>(null);
    checkingSpellSentence = signal(false);

    spellCheckTranslation = signal<SpellCheckResult | null>(null);
    checkingSpellTranslation = signal(false);

    allSentenceStock = signal<SentenceStockDto[]>([]);
    loadingSentenceStock = signal(false);

    existingMemories = signal<any[]>([]);
    existingPronunciations = signal<any[]>([]);

    memoryOptionA  = signal('');
    memoryOptionB  = signal('');
    memoryNotes    = signal('');
    memoryCategory = signal<string | null>(null);
    savingMemory   = signal(false);
    importingMemory = signal(false);

    onMemoryFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;
        if (this.studentId === null) {
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please select a student first.' });
            return;
        }

        const file = input.files[0];
        this.importingMemory.set(true);

        this.adminMemoriesService.importMemories(this.studentId, file).subscribe({
            next: (res) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Imported',
                    detail: `Successfully imported ${res.count} memories!`
                });
                this.importingMemory.set(false);
                input.value = '';
                this.loadStudentDataProtection(this.studentId!);
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err?.error?.message || 'Failed to import Excel file.'
                });
                this.importingMemory.set(false);
                input.value = '';
            }
        });
    }

    pronunciationTestList = signal<LessonPronunciationTestItemDto[]>([]);
    alphabetList = signal<AlphabetTestItemDto[]>([]);
    loadingAlphabet = signal(false);
    markingAlphabetId = signal<number | null>(null);
    loadingPronunciationTest = signal(false);
    markingId = signal<number | null>(null);
    correctPronunciationList  = signal<LessonPronunciationTestItemDto[]>([]);
    loadingCorrectPronunciation = signal(false);

    readonly SESSION_SIZE = 20;
    
    readonly TEMPLATES = [
        { key: 'difference',   label: 'Difference',   template: "What's the difference between {A} and {B}? Provide examples.",needsB: true  },
        { key: 'comma_before', label: 'Comma before',  template: "Do you put a comma before {A}? Are there any exceptions? Back it up with examples.", needsB: false },
        { key: 'position',     label: 'Position',      template: "Where do you put the word {A} in a sentence? Is there only one option? Give examples.", needsB: false },
        { key: 'past',         label: 'Past forms',    template: "What are the past forms of the word {A}? Is it regular or irregular? Use all in sentences.", needsB: false },
        { key: 'change',       label: 'Verb change',   template: "How do you change a verb after the word {A}?",needsB: false },
        { key: 'synonym',      label: 'Synonyms',      template: "What are the synonyms of {A}? Show the difference between them in context.", needsB: false },
        { key: 'antonym',      label: 'Antonyms',      template: "What are the antonyms of {A}? Provide example sentences.",needsB: false },
        { key: 'preposition',  label: 'Prepositions',  template: "What prepositions are used with {A}? Give examples for each.",needsB: false },
        { key: 'collocations', label: 'Collocations',  template: "What are the most common collocations with {A}? Use them in sentences.",needsB: false },
        { key: 'formal',       label: 'Formal/Informal', template: "Is {A} formal or informal? What's the formal/informal alternative?",needsB: false },
        { key: 'grammar',      label: 'Grammar rules', template: "Explain the grammar rules for using {A}. What are the most common mistakes?", needsB: false },
        { key: 'plural',       label: 'Plural forms', template: "What's the plural of the word {A}?", needsB: false }
        
    ];

    memoryCategoryOptions = this.TEMPLATES.map(t => ({ label: t.label, value: t.key }));

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
        { id: 'pronunciation', label: 'Pronunciation', icon: 'pi pi-microphone' },
        { id: 'catalogues', label: 'Catalogues', icon: 'pi pi-folder' },
        { id: 'alphabet', label: 'Alphabet', icon: 'pi pi-language' },
    ];

    incorrectInSession = computed(() =>
        this.pronunciationTestList().filter(e => e.status === 'Incorrect').length
    );

    get studentId(): number | null {
        return this.lessonContext.studentId;
    }

    isPronunciationDuplicate = computed(() => {
        const word = this.pronunciationWord().trim().toLowerCase();
        return this.existingPronunciations().some(p => p.word?.toLowerCase() === word);
    });

    generatedPrompts = computed(() => {
        const a        = this.memoryOptionA().trim();
        const b        = this.memoryOptionB().trim();
        const category = this.memoryCategory();
        if (!a || !category) return [];

        const templates = this.TEMPLATES.filter(t => t.key === category);

        return templates
            .filter(t => !t.needsB || !!b)
            .map(t => t.template
                .replace('{A}', a)
                .replace('{B}', b)
            );
    });

    isMemoryDuplicate = computed(() => {
        const a = this.memoryOptionA().trim().toLowerCase();
        const b = this.memoryOptionB().trim().toLowerCase();
        const currentCategory = this.memoryCategory()?.trim() || null;

        if (!a) return false;

        return this.existingMemories().some(m => {
            const sameWords = m.optionA?.toLowerCase() === a &&
                              (m.optionB?.toLowerCase() ?? '') === b;

            if (!sameWords) return false;
            const dbCategory = m.category?.trim() || null;

            return dbCategory === currentCategory;
        });
    });

    incorrectAlphabetInSession = computed(() =>
        this.alphabetList().filter(e => e.status === 'Incorrect').length
    );

    alphabetLetters = computed(() =>
        this.alphabetList().filter(e => e.type === 'Letters')
    );

    alphabetAbbreviations = computed(() =>
        this.alphabetList().filter(e => e.type === 'Abbreviation')
    );

    selectedCatalogueId = signal<number | null>(null);
    assigningCatalogue = signal(false);

    selectedSentenceSetId = signal<number | null>(null);
    assigningSentenceSet = signal(false);

    catalogueOptions = computed(() =>
        (this.catalogueService.catalogues.value() ?? [])
            .map(c => ({ label: `${c.name} (${c.entryCount} entries)`, value: c.id }))
    );

    sentenceSetOptions = computed(() =>
        (this.sentenceSetsService.sets.value() ?? [])
            .flatMap(g => g.sets.map(s => ({
                label: `${g.groupName} / ${s.name} (${s.itemCount} sentences)`,
                value: s.id
            })))
    );

    constructor() {
        effect(() => {
            const studentId = this.studentId;
            if (studentId) {
                this.loadStudentDataProtection(studentId);
                this.loadGlobalSentenceStock();
                this.catalogueService.reloadCatalogues();
                this.sentenceSetsService.reloadSets();
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
                next: (result: SearchVocabularyResult[] | null) => {
                    this.searching.set(false);
                    if (result !== null) {
                        this.searchResult.set(result);
                        if (result.length === 1 && !result[0].existsInGlobal) {
                            this.newFront.set(result[0].front);
                            this.newBack.set(result[0].back || '');
                        }
                    } else {
                        this.searchResult.set(null);
                    }
                },
                error: () => this.searching.set(false)
            });

        toObservable(this.newFront)
            .pipe(
                debounceTime(300),
                distinctUntilChanged(),
                tap((q) => {
                    if (!q.trim()) {
                        this.isFlashcardDuplicate.set(false);
                        this.checkingDuplicateFlashcard.set(false);
                    }
                }),
                switchMap((q) => {
                    const studentId = this.studentId;
                    if (!q.trim() || !studentId) return of(null);
                    this.checkingDuplicateFlashcard.set(true);
                    return this.vocabularyService.searchVocabulary(q.trim(), studentId);
                })
            )
            .subscribe({
                next: (result: SearchVocabularyResult[] | null) => {
                    this.checkingDuplicateFlashcard.set(false);
                
                    if (result && result.length > 0) {
                        const enteredWord = this.newFront().toLowerCase().trim();
                        const exactMatch = result.find(
                            r => r.existsInGlobal && r.front.toLowerCase().trim() === enteredWord
                        );
                    
                        if (exactMatch?.back) {
                            this.newBack.set(exactMatch.back);
                        }
                    
                        this.isFlashcardDuplicate.set(!!exactMatch);
                    } else {
                        this.isFlashcardDuplicate.set(false);
                    }
                },
                error: () => {
                    this.checkingDuplicateFlashcard.set(false);
                    this.isFlashcardDuplicate.set(false);
                }
            });

        toObservable(this.sentenceSearchQuery)
            .pipe(
                debounceTime(300),
                distinctUntilChanged(),
                tap((q) => {
                    if (!q.trim()) {
                        this.sentenceSearchResult.set(null);
                        this.searchingSentence.set(false);
                    }
                }),
                switchMap((q) => {
                    const studentId = this.studentId;
                    if (!q.trim() || !studentId) return of(null);
                    this.searchingSentence.set(true);
                    return this.lessonService.searchSentence(q.trim(), studentId);
                })
            )
            .subscribe({
                next: (result: any) => {
                    this.searchingSentence.set(false);
                    if (result) {
                        this.sentenceSearchResult.set(result);
                        if (result.length === 1 && !result[0].existsInGlobal) {
                            this.sentenceContent.set(result[0].englishTranslation);
                            this.sentenceTranslation.set(result[0].polish || '');
                        }
                    }
                },
                error: () => this.searchingSentence.set(false)
            });

        toObservable(this.sentenceContent)
            .pipe(
                debounceTime(300),
                distinctUntilChanged(),
                tap((q) => {
                    if (!q.trim()) {
                        this.isSentenceDuplicate.set(false);
                        this.checkingDuplicateSentence.set(false);
                    }
                }),
                switchMap((q) => {
                    const studentId = this.studentId;
                    if (!q.trim() || !studentId) return of(null);
                    this.checkingDuplicateSentence.set(true);
                    return this.lessonService.searchSentence(q.trim(), studentId);
                })
            )
            .subscribe({
                next: (result: any) => {
                    this.checkingDuplicateSentence.set(false);
                
                    const item = Array.isArray(result) ? result[0] : result;
                
                    if (item) {
                        const typedSentence = this.sentenceContent().toLowerCase().trim();
                        const foundSentence = item.englishTranslation.toLowerCase().trim();
                    
                        if (item.polish && !item.existsInGlobal) {
                            this.sentenceTranslation.set(item.polish);
                        }
                    
                        const isDuplicate = item.existsInGlobal && (foundSentence === typedSentence);
                        this.isSentenceDuplicate.set(isDuplicate);
                    } else {
                        this.isSentenceDuplicate.set(false);
                    }
                },
                error: () => {
                    this.checkingDuplicateSentence.set(false);
                    this.isSentenceDuplicate.set(false);
                }
            });

        toObservable(this.newFront)
            .pipe(
                debounceTime(600),
                distinctUntilChanged(),
                tap((q) => {
                    if (!q.trim() || q.trim().length < 2) {
                        this.spellCheckFront.set(null);
                        this.checkingSpellFront.set(false);
                    }
                }),
                switchMap((q) => {
                    if (!q.trim() || q.trim().length < 2) return of(null);
                    this.checkingSpellFront.set(true);
                    return this.lessonService.checkSpelling(q.trim(), 'English');
                })
            )
            .subscribe({
                next: (result) => {
                    this.checkingSpellFront.set(false);
                    if (result && result.hasError) {
                        this.spellCheckFront.set(result);
                    } else {
                        this.spellCheckFront.set(null);
                    }
                },
                error: () => {
                    this.checkingSpellFront.set(false);
                    this.spellCheckFront.set(null);
                }
            });

        toObservable(this.newBack)
            .pipe(
                debounceTime(600),
                distinctUntilChanged(),
                tap((q) => {
                    if (!q.trim() || q.trim().length < 2) {
                        this.spellCheckBack.set(null);
                        this.checkingSpellBack.set(false);
                    }
                }),
                switchMap((q) => {
                    if (!q.trim() || q.trim().length < 2) return of(null);
                    this.checkingSpellBack.set(true);
                    return this.lessonService.checkSpelling(q.trim(), 'Polish');
                })
            )
            .subscribe({
                next: (result) => {
                    this.checkingSpellBack.set(false);
                    if (result && result.hasError) {
                        this.spellCheckBack.set(result);
                    } else {
                        this.spellCheckBack.set(null);
                    }
                },
                error: () => {
                    this.checkingSpellBack.set(false);
                    this.spellCheckBack.set(null);
                }
            });

        toObservable(this.sentenceContent)
            .pipe(
                debounceTime(600),
                distinctUntilChanged(),
                tap((q) => {
                    if (!q.trim() || q.trim().length < 2) {
                        this.spellCheckSentence.set(null);
                        this.checkingSpellSentence.set(false);
                    }
                }),
                switchMap((q) => {
                    if (!q.trim() || q.trim().length < 2) return of(null);
                    this.checkingSpellSentence.set(true);
                    return this.lessonService.checkSpelling(q.trim(), 'English');
                })
            )
            .subscribe({
                next: (result) => {
                    this.checkingSpellSentence.set(false);
                    if (result && result.hasError) {
                        this.spellCheckSentence.set(result);
                    } else {
                        this.spellCheckSentence.set(null);
                    }
                },
                error: () => {
                    this.checkingSpellSentence.set(false);
                    this.spellCheckSentence.set(null);
                }
            });

        toObservable(this.sentenceTranslation)
            .pipe(
                debounceTime(600),
                distinctUntilChanged(),
                tap((q) => {
                    if (!q.trim() || q.trim().length < 2) {
                        this.spellCheckTranslation.set(null);
                        this.checkingSpellTranslation.set(false);
                    }
                }),
                switchMap((q) => {
                    if (!q.trim() || q.trim().length < 2) return of(null);
                    this.checkingSpellTranslation.set(true);
                    return this.lessonService.checkSpelling(q.trim(), 'Polish');
                })
            )
            .subscribe({
                next: (result) => {
                    this.checkingSpellTranslation.set(false);
                    if (result && result.hasError) {
                        this.spellCheckTranslation.set(result);
                    } else {
                        this.spellCheckTranslation.set(null);
                    }
                },
                error: () => {
                    this.checkingSpellTranslation.set(false);
                    this.spellCheckTranslation.set(null);
                }
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

    assignExisting(vocab: SearchVocabularyResult) {
        const studentId = this.studentId;
        if (!vocab?.id || !studentId) return;

        this.saving.set(true);
        this.vocabularyService.assignSingleVocabularyToStudent(vocab.id, studentId).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Assigned',
                    detail: `"${vocab.front}" assigned to student`, life: 3000
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
        this.isFlashcardDuplicate.set(false);
        this.spellCheckFront.set(null);
        this.spellCheckBack.set(null);
    }

    saveSentence() {
        const studentId = this.studentId;
        if (!this.sentenceContent().trim() || !studentId || this.isSentenceDuplicate()) return;

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
                this.resetSentenceForm();
                this.savingSentence.set(false);
                this.loadGlobalSentenceStock();
            },
            error: () => this.savingSentence.set(false)
        });
    }

    assignExistingSentence(sentence: any) {
        const studentId = this.studentId;
        if (!sentence?.id || !studentId) return;
        
        this.savingSentence.set(true);
        const request = {
            userId: studentId,
            sentenceStockId: sentence.id,
            dueDate: new Intl.DateTimeFormat('sv-SE').format(new Date())
        };
    
        this.lessonService.assignToUser(request).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Assigned',
                    detail: 'Sentence assigned from database', life: 3000
                });
                this.resetSentenceForm();
                this.savingSentence.set(false);
            },
            error: () => this.savingSentence.set(false)
        });
    }

    resetSentenceForm() {
        this.sentenceSearchQuery.set('');
        this.sentenceSearchResult.set(null);
        this.sentenceContent.set('');
        this.sentenceTranslation.set('');
        this.sentenceNotes.set('');
        this.isSentenceDuplicate.set(false);
        this.spellCheckSentence.set(null);
        this.spellCheckTranslation.set(null);
    }

    assignCatalogue() {
        const catalogueId = this.selectedCatalogueId();
        const studentId = this.studentId;
        if (!catalogueId || !studentId) return;
        
        this.assigningCatalogue.set(true);
        this.vocabularyService.assignCatalogueToStudent(catalogueId, studentId).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Assigned',
                    detail: 'Catalogue assigned to student', life: 3000
                });
                this.selectedCatalogueId.set(null);
                this.assigningCatalogue.set(false);
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error', summary: 'Error',
                    detail: err?.error?.message ?? 'Failed to assign catalogue', life: 4000
                });
                this.assigningCatalogue.set(false);
            }
        });
    }
    
    assignSentenceSet() {
        const sentenceSetId = this.selectedSentenceSetId();
        const studentId = this.studentId;
        if (!sentenceSetId || !studentId) return;
    
        this.assigningSentenceSet.set(true);
        const dueDate = new Intl.DateTimeFormat('sv-SE').format(new Date());
    
        this.sentenceSetsService.assignSentenceSetToStudent(studentId, sentenceSetId, dueDate).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Assigned',
                    detail: 'Sentence set assigned to student', life: 3000
                });
                this.selectedSentenceSetId.set(null);
                this.assigningSentenceSet.set(false);
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error', summary: 'Error',
                    detail: err?.error?.message ?? 'Failed to assign sentence set', life: 4000
                });
                this.assigningSentenceSet.set(false);
            }
        });
    }

    saveMemory() {
        const studentId = this.studentId;
        const a = this.memoryOptionA().trim();
        const category = this.memoryCategory();
        if (!a || !category || studentId === null || this.isMemoryDuplicate()) return;

        this.savingMemory.set(true);
        this.lessonService.addMemory(
            studentId,
            a,
            this.memoryOptionB().trim() || undefined,
            category,
            this.memoryNotes().trim() || undefined
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Saved',
                    detail: `Memory prompts generated for "${a}"`, life: 3000
                });
                this.existingMemories.update(list => [
                    ...list,
                    {
                        optionA: a,
                        optionB: this.memoryOptionB().trim(),
                        category
                    }
                ]);
                this.memoryOptionA.set('');
                this.memoryOptionB.set('');
                this.memoryCategory.set(null);
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
                this.loadPronunciationTest();
            },
            error: () => this.savingPronunciation.set(false)
        });
    }

    goToSwitchClient() {
        this.router.navigate(['/lesson/switch-client']);
    }

    loadPronunciationTest() {
        const studentId = this.studentId;
        if (!studentId) return;
        this.loadingPronunciationTest.set(true);
        this.lessonService.getPronunciationTest(studentId).subscribe({
            next: (res) => {
                this.pronunciationTestList.set(res || []);
                this.loadingPronunciationTest.set(false);
            },
            error: () => this.loadingPronunciationTest.set(false)
        });
    }
    
    markPronunciation(entryId: number, result: 'correct' | 'incorrect') {
        this.markingId.set(entryId);
        this.lessonService.markPronunciationResult(entryId, result).subscribe({
            next: () => {
                if (result === 'correct') {
                    const entry = this.pronunciationTestList().find(e => e.id === entryId);
                    this.pronunciationTestList.update(list =>
                        list.filter(e => e.id !== entryId)
                    );
                    if (entry) {
                        this.correctPronunciationList.update(list => [{
                            ...entry,
                            status: 'Correct',
                            markedCorrectAt: new Intl.DateTimeFormat('sv-SE').format(new Date()),
                            daysUntilRefresh: 30
                        }, ...list]);
                        this.loadCorrectPronunciation();
                    }
                } else {
                    this.pronunciationTestList.update(list =>
                        list.map(e => e.id === entryId
                            ? { ...e, status: 'Incorrect' } : e)
                    );
                }
                this.markingId.set(null);
            },
            error: () => this.markingId.set(null)
        });
    }

    loadCorrectPronunciation() {
        const studentId = this.studentId;
        if (!studentId) return;
        this.loadingCorrectPronunciation.set(true);
        this.lessonService.getCorrectPronunciationEntries(studentId).subscribe({
            next: (res) => {
                this.correctPronunciationList.set(res ?? []);
                this.loadingCorrectPronunciation.set(false);
            },
            error: () => this.loadingCorrectPronunciation.set(false)
        });
    }

    acceptSpellCorrection(field: 'front' | 'back' | 'sentence' | 'translation') {
        switch (field) {
            case 'front':
                const correctedFront = this.spellCheckFront()?.corrected;
                if (correctedFront) this.newFront.set(correctedFront);
                this.spellCheckFront.set(null);
                break;
            case 'back':
                const correctedBack = this.spellCheckBack()?.corrected;
                if (correctedBack) this.newBack.set(correctedBack);
                this.spellCheckBack.set(null);
                break;
            case 'sentence':
                const correctedSentence = this.spellCheckSentence()?.corrected;
                if (correctedSentence) this.sentenceContent.set(correctedSentence);
                this.spellCheckSentence.set(null);
                break;
            case 'translation':
                const correctedTranslation = this.spellCheckTranslation()?.corrected;
                if (correctedTranslation) this.sentenceTranslation.set(correctedTranslation);
                this.spellCheckTranslation.set(null);
                break;
        }
    }

    rejectSpellCorrection(field: 'front' | 'back' | 'sentence' | 'translation') {
        switch (field) {
            case 'front': this.spellCheckFront.set(null); break;
            case 'back': this.spellCheckBack.set(null); break;
            case 'sentence': this.spellCheckSentence.set(null); break;
            case 'translation': this.spellCheckTranslation.set(null); break;
        }
    }

    loadAlphabetTest() {
        const studentId = this.studentId;
        if (!studentId) return;
        this.loadingAlphabet.set(true);
        this.lessonService.getAlphabetTest(studentId).subscribe({
            next: (res) => {
                this.alphabetList.set(res || []);
                this.loadingAlphabet.set(false);
            },
            error: () => this.loadingAlphabet.set(false)
        });
    }
    
    markAlphabet(entryId: number, result: 'correct' | 'incorrect') {
        this.markingAlphabetId.set(entryId);
        this.lessonService.markAlphabetResult(entryId, result).subscribe({
            next: () => {
                this.alphabetList.update(list =>
                    list.map(e => e.id === entryId
                        ? { ...e, status: result === 'correct' ? 'Correct' : 'Incorrect' }
                        : e)
                );
                this.markingAlphabetId.set(null);
            },
            error: () => this.markingAlphabetId.set(null)
        });
    }
}