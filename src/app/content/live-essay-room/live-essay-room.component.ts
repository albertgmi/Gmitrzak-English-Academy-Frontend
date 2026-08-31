import { Component, inject, signal, computed, OnInit, OnDestroy, effect, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { QuillEditorComponent, QuillModule } from 'ngx-quill';
import { EssayService, UserEssayDto } from '../../services/essay.service';
import { EssayDetectorService, EssayAnalysisResult } from '../../services/essay-detector.service';
import { LiveEssayCollaborationService, TeacherNoteEvent } from '../../services/live-essay-collaboration.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-live-essay-room',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, TagModule,
        ToastModule, InputTextModule, TextareaModule, DialogModule,
        SelectModule, QuillModule, TooltipModule
    ],
    providers: [MessageService],
    templateUrl: './live-essay-room.component.html',
    styleUrls: ['./live-essay-room.component.scss']
})
export class LiveEssayRoomComponent implements OnInit, OnDestroy {
    @ViewChild('studentEditor') studentEditor!: QuillEditorComponent;
    @ViewChild('adminEditor') adminEditor!: QuillEditorComponent;

    private essayService = inject(EssayService);
    public essayDetectorService = inject(EssayDetectorService);
    public collaborationService = inject(LiveEssayCollaborationService);
    private authService = inject(AuthService);
    private messageService = inject(MessageService);

    currentUser = computed(() => ({
        id: this.authService.getUserId(),
        username: this.authService.getUsername() || 'User',
        role: this.authService.getRole() || 'User'
    }));

    isAdmin = computed(() => this.currentUser().role === 'Admin');

    // View state: 'selection' (cards grid) or 'room' (active essay session)
    currentView = signal<'selection' | 'room'>('selection');

    essays = signal<UserEssayDto[]>([]);
    selectedEssayId = signal<number | null>(null);
    selectedEssay = signal<UserEssayDto | null>(null);
    loading = signal(true);
    saving = signal(false);

    // Dynamic content fields
    studentContent = signal('');
    adminContent = signal('');
    activeTab = signal<'student' | 'admin'>('student');

    // Live Selection Sharing
    remoteSelection = signal<{ username: string; role: string; index: number; length: number } | null>(null);
    selectedTextSnippet = signal<string>('');
    selectedRangeIndex = signal<number>(0);
    selectedRangeLength = signal<number>(0);

    // Teacher Notes & Annotations
    teacherNotes = signal<TeacherNoteEvent[]>([]);
    showNoteModal = signal(false);
    newNoteText = signal('');
    newNoteCategory = signal<'Grammar' | 'Vocabulary' | 'Structure' | 'General'>('Grammar');

    categoryOptions = [
        { label: 'Grammar', value: 'Grammar' },
        { label: 'Vocabulary', value: 'Vocabulary' },
        { label: 'Structure', value: 'Structure' },
        { label: 'General Feedback', value: 'General' }
    ];

    // Typing debounce
    private typingTimeout: any = null;
    isRemoteTyping = signal(false);
    remoteTypingUser = signal<string>('');

    activeUsers = this.collaborationService.activeUsers;
    connectionState = this.collaborationService.connectionState;

    quillModules = {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'align': [] }],
            ['clean']
        ]
    };

    essayAnalysis = computed<EssayAnalysisResult | null>(() => {
        const content = this.studentContent();
        if (!content) return null;
        return this.essayDetectorService.analyzeEssay(content);
    });

    wordCount = computed(() => {
        const content = this.studentContent();
        if (!content) return 0;
        const text = content.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').trim();
        return text ? text.split(/\s+/).filter(w => w.length > 0).length : 0;
    });

    constructor() {
        // Handle incoming content changes
        effect(() => {
            const change = this.collaborationService.incomingContentChange();
            if (!change) return;

            if (change.senderUsername !== this.currentUser().username) {
                if (change.field === 'content') {
                    this.studentContent.set(change.content);
                } else if (change.field === 'adminContent') {
                    this.adminContent.set(change.content);
                }
            }
        });

        // Handle incoming remote selection
        effect(() => {
            const sel = this.collaborationService.incomingSelectionChange();
            if (!sel) return;

            if (sel.senderUsername !== this.currentUser().username) {
                this.remoteSelection.set({
                    username: sel.senderUsername,
                    role: sel.senderRole,
                    index: sel.index,
                    length: sel.length
                });

                this.updateRemoteSelectionHighlight(sel.index, sel.length, sel.senderRole);
            }
        });

        // Handle incoming teacher notes
        effect(() => {
            const note = this.collaborationService.incomingTeacherNote();
            if (!note) return;

            this.teacherNotes.update(notes => [note, ...notes]);
            this.messageService.add({
                severity: 'info',
                summary: 'New Teacher Note',
                detail: `Note added by ${note.author} on: "${note.selectedText}"`,
                life: 3000
            });
        });

        // Handle remote typing status
        effect(() => {
            const typing = this.collaborationService.typingUser();
            if (!typing) return;

            if (typing.senderUsername !== this.currentUser().username) {
                this.isRemoteTyping.set(typing.isTyping);
                this.remoteTypingUser.set(typing.senderUsername);
            }
        });
    }

    ngOnInit(): void {
        this.loadEssays();
    }

    ngOnDestroy(): void {
        this.collaborationService.stopConnection();
    }

    loadEssays(): void {
        this.loading.set(true);

        const fetch$ = this.isAdmin() 
            ? this.essayService.getAllForAdmin()
            : this.essayService.getMyEssays();

        fetch$.subscribe({
            next: (data) => {
                this.essays.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
            }
        });
    }

    enterRoom(essay: UserEssayDto): void {
        this.selectedEssayId.set(essay.id);
        this.selectedEssay.set(essay);
        this.studentContent.set(essay.content || '');
        this.adminContent.set(essay.adminContent || '');
        this.remoteSelection.set(null);
        this.teacherNotes.set([]);

        this.collaborationService.joinRoom(
            essay.id,
            this.currentUser().username,
            this.currentUser().role
        );

        this.currentView.set('room');
    }

    backToSelection(): void {
        if (this.selectedEssayId()) {
            this.collaborationService.leaveRoom(this.selectedEssayId()!);
        }
        this.currentView.set('selection');
    }

    onStudentContentChange(newContent: string): void {
        this.studentContent.set(newContent);
        const essayId = this.selectedEssayId();
        if (essayId) {
            this.collaborationService.sendContentChange(
                essayId,
                newContent,
                'content',
                this.currentUser().username
            );
            this.notifyTyping();
        }
    }

    onAdminContentChange(newContent: string): void {
        this.adminContent.set(newContent);
        const essayId = this.selectedEssayId();
        if (essayId) {
            this.collaborationService.sendContentChange(
                essayId,
                newContent,
                'adminContent',
                this.currentUser().username
            );
            this.notifyTyping();
        }
    }

    onSelectionChanged(event: any): void {
        if (!event || !event.range) return;
        const range = event.range;
        const essayId = this.selectedEssayId();
        if (!essayId) return;

        if (range.length > 0 && event.editor) {
            const selectedText = event.editor.getText(range.index, range.length).trim();
            this.selectedTextSnippet.set(selectedText);
            this.selectedRangeIndex.set(range.index);
            this.selectedRangeLength.set(range.length);
        } else {
            this.selectedTextSnippet.set('');
        }

        this.collaborationService.sendSelectionChange(
            essayId,
            range.index,
            range.length,
            this.currentUser().username,
            this.currentUser().role
        );
    }

    openNoteModal(): void {
        if (!this.selectedTextSnippet()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No text selected',
                detail: 'Please select a text passage in the essay first.',
                life: 2500
            });
            return;
        }
        this.newNoteText.set('');
        this.showNoteModal.set(true);
    }

    addTeacherNote(): void {
        const text = this.newNoteText().trim();
        const snippet = this.selectedTextSnippet();
        const essayId = this.selectedEssayId();
        if (!text || !snippet || !essayId) return;

        const noteId = 'note_' + Date.now();
        const category = this.newNoteCategory();
        const author = this.currentUser().username;

        // Apply distinct formatting overlay in Quill
        const editor = this.studentEditor?.quillEditor || this.adminEditor?.quillEditor;
        if (editor) {
            editor.formatText(this.selectedRangeIndex(), this.selectedRangeLength(), {
                'background': '#FEF3C7',
                'color': '#92400E'
            });
        }

        this.collaborationService.sendTeacherNote(
            essayId,
            noteId,
            snippet,
            text,
            category,
            author
        );

        this.showNoteModal.set(false);
        this.newNoteText.set('');

        this.messageService.add({
            severity: 'success',
            summary: 'Note Attached',
            detail: 'Teacher note linked to selected text snippet.'
        });
    }

    focusNoteText(snippet: string): void {
        const editor = this.studentEditor?.quillEditor || this.adminEditor?.quillEditor;
        if (!editor) return;

        const fullText = editor.getText();
        const index = fullText.indexOf(snippet);
        if (index >= 0) {
            editor.setSelection(index, snippet.length);
        }
    }

    applyHighlight(bgColor: string, textColor: string): void {
        const editor = this.studentEditor?.quillEditor || this.adminEditor?.quillEditor;
        if (!editor) return;

        const sel = editor.getSelection();
        if (!sel || sel.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No text selected',
                detail: 'Please select a text snippet to highlight.',
                life: 2500
            });
            return;
        }

        editor.formatText(sel.index, sel.length, {
            'background': bgColor,
            'color': textColor
        });

        const html = editor.root.innerHTML;
        if (this.activeTab() === 'student') {
            this.onStudentContentChange(html);
        } else {
            this.onAdminContentChange(html);
        }
    }

    private lastRemoteSelection: { index: number; length: number } | null = null;

    private updateRemoteSelectionHighlight(index: number, length: number, role: string): void {
        const editor = this.studentEditor?.quillEditor || this.adminEditor?.quillEditor;
        if (!editor) return;

        if (this.lastRemoteSelection && this.lastRemoteSelection.length > 0) {
            editor.formatText(this.lastRemoteSelection.index, this.lastRemoteSelection.length, {
                'background': false,
                'color': false
            });
            this.lastRemoteSelection = null;
        }

        if (length > 0) {
            const highlightBg = role === 'Admin' ? '#E0E7FF' : '#DCFCE7';
            const highlightColor = role === 'Admin' ? '#3730A3' : '#166534';

            editor.formatText(index, length, {
                'background': highlightBg,
                'color': highlightColor
            });

            this.lastRemoteSelection = { index, length };
        }
    }

    private notifyTyping(): void {
        const essayId = this.selectedEssayId();
        if (!essayId) return;

        this.collaborationService.sendTypingStatus(essayId, true, this.currentUser().username);

        if (this.typingTimeout) clearTimeout(this.typingTimeout);

        this.typingTimeout = setTimeout(() => {
            this.collaborationService.sendTypingStatus(essayId, false, this.currentUser().username);
        }, 2000);
    }

    saveEssay(): void {
        const essay = this.selectedEssay();
        if (!essay) return;

        this.saving.set(true);

        if (this.isAdmin()) {
            this.essayService.review(essay.id, this.adminContent()).subscribe({
                next: (updated: UserEssayDto) => {
                    this.saving.set(false);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Saved',
                        detail: 'Essay review saved successfully!'
                    });
                },
                error: () => {
                    this.saving.set(false);
                }
            });
        } else {
            this.essayService.submit(essay.moduleId, this.studentContent()).subscribe({
                next: () => {
                    this.saving.set(false);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Saved',
                        detail: 'Essay saved successfully!'
                    });
                },
                error: () => {
                    this.saving.set(false);
                }
            });
        }
    }

    exportDocx(): void {
        const essay = this.selectedEssay();
        if (!essay) return;

        this.essayService.exportDocx(essay.id).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `essay_${essay.id}_${essay.username}.docx`;
                a.click();
                window.URL.revokeObjectURL(url);
            }
        });
    }
}
