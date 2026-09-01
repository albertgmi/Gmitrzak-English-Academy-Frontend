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
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { QuillEditorComponent, QuillModule } from 'ngx-quill';
import { SentenceService, SentenceModuleLiveDto, SentenceAnswerLiveDto, SentenceAnswerCommentDto } from '../../services/sentence.service';
import { LiveSentenceCollaborationService, SentenceTeacherNoteEvent } from '../../services/live-sentence-collaboration.service';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { AvatarComponent } from '../../other/avatar/avatar.component';

@Component({
    selector: 'app-live-sentence-room',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, TagModule,
        ToastModule, InputTextModule, TextareaModule, DialogModule,
        SelectModule, QuillModule, TooltipModule, IconFieldModule, InputIconModule,
        TableModule, AvatarComponent
    ],
    providers: [MessageService],
    templateUrl: './live-sentence-room.component.html',
    styleUrls: ['./live-sentence-room.component.scss']
})
export class LiveSentenceRoomComponent implements OnInit, OnDestroy {
    @ViewChild('userEditor') userEditor!: QuillEditorComponent;
    @ViewChild('adminEditor') adminEditor!: QuillEditorComponent;

    private sentenceService = inject(SentenceService);
    private profileService = inject(ProfileService);
    public collaborationService = inject(LiveSentenceCollaborationService);
    private authService = inject(AuthService);
    private messageService = inject(MessageService);

    currentUser = computed(() => ({
        id: this.authService.getUserId(),
        username: this.authService.getUsername() || 'User',
        role: this.authService.getRole() || 'User'
    }));

    currentUserAvatarUrl = signal<string | null>(null);
    isAdmin = computed(() => this.currentUser().role === 'Admin');

    // Navigation State: 'modules' | 'sentences' | 'live'
    currentView = signal<'modules' | 'sentences' | 'live'>('modules');

    // Module Selection Level
    modules = signal<SentenceModuleLiveDto[]>([]);
    selectedModule = signal<SentenceModuleLiveDto | null>(null);

    // Sentence List Level
    sentencesInModule = signal<SentenceAnswerLiveDto[]>([]);
    selectedAnswer = signal<SentenceAnswerLiveDto | null>(null);

    loading = signal(true);
    saving = signal(false);

    // Filtering & Searching Modules
    searchQuery = signal('');
    selectedStudentFilter = signal<string | null>(null);

    studentFilterOptions = computed(() => {
        const set = new Set<string>();
        this.modules().forEach(m => {
            if (m.studentUsername) set.add(m.studentUsername);
        });

        const options = Array.from(set).sort().map(username => ({
            label: username,
            value: username
        }));

        return [{ label: 'All Students', value: null }, ...options];
    });

    filteredModules = computed(() => {
        let list = this.modules();
        const query = this.searchQuery().trim().toLowerCase();
        const studentFilter = this.selectedStudentFilter();

        if (studentFilter) {
            list = list.filter(m => m.studentUsername === studentFilter);
        }

        if (query) {
            list = list.filter(m =>
                (m.studentUsername && m.studentUsername.toLowerCase().includes(query)) ||
                (m.moduleName && m.moduleName.toLowerCase().includes(query))
            );
        }

        return list;
    });

    // Live Room Content Fields
    userContent = signal('');
    adminContent = signal('');
    activeTab = signal<'admin' | 'user'>('admin');
    selectedOverride = signal<string | null>(null);

    // Live Selection Sharing
    remoteSelection = signal<{ username: string; role: string; index: number; length: number } | null>(null);
    selectedTextSnippet = signal<string>('');
    selectedRangeIndex = signal<number>(0);
    selectedRangeLength = signal<number>(0);

    // Teacher Notes & Annotations
    teacherNotes = signal<SentenceTeacherNoteEvent[]>([]);
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

    quillReadOnlyModules = { toolbar: false };

    quillModules = {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['clean']
        ]
    };

    constructor() {
        effect(() => {
            const change = this.collaborationService.incomingContentChange();
            if (!change) return;

            if (change.senderUsername !== this.currentUser().username) {
                this.lastRemoteSelection = null;
                if (change.field === 'userAnswer') {
                    this.userContent.set(change.content);
                } else if (change.field === 'adminCorrection') {
                    this.adminContent.set(change.content);
                }
            }
        });

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

        effect(() => {
            const note = this.collaborationService.incomingTeacherNote();
            if (!note) return;

            this.teacherNotes.update(notes => {
                const id = note.noteId || (note as any).id;
                if (notes.some(n => (n.noteId || (n as any).id) === id)) return notes;
                return [note, ...notes];
            });

            this.messageService.add({
                severity: 'info',
                summary: 'New Teacher Note',
                detail: `Note added by ${note.author} on: "${note.selectedText}"`,
                life: 3000
            });
        });

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
        this.loadModules();
        const userId = this.currentUser().id;
        if (userId) {
            this.profileService.getProfile(userId).subscribe({
                next: (profile) => {
                    if (profile && profile.avatarUrl) {
                        this.currentUserAvatarUrl.set(profile.avatarUrl);
                    }
                },
                error: () => {}
            });
        }
    }

    ngOnDestroy(): void {
        this.collaborationService.stopConnection();
    }

    loadModules(): void {
        this.loading.set(true);
        this.sentenceService.getLiveRoomModules().subscribe({
            next: (data) => {
                this.modules.set(data);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    selectModule(moduleDto: SentenceModuleLiveDto): void {
        this.selectedModule.set(moduleDto);
        this.loading.set(true);
        this.sentenceService.getLiveRoomModuleAnswers(moduleDto.moduleId, moduleDto.studentId).subscribe({
            next: (answers) => {
                this.sentencesInModule.set(answers);
                this.loading.set(false);
                this.currentView.set('sentences');
            },
            error: () => this.loading.set(false)
        });
    }

    backToModules(): void {
        this.currentView.set('modules');
        this.selectedModule.set(null);
        this.sentencesInModule.set([]);
    }

    enterLiveRoom(answer: SentenceAnswerLiveDto): void {
        this.selectedAnswer.set(answer);
        this.userContent.set(answer.userAnswer || '');
        this.adminContent.set(answer.adminCorrection || answer.userAnswer || '');
        this.selectedOverride.set(answer.teacherOverride || null);
        this.activeTab.set('admin');
        this.remoteSelection.set(null);

        this.sentenceService.getSentenceComments(answer.id).subscribe({
            next: (comments) => {
                this.teacherNotes.set(comments as any);
            },
            error: () => this.teacherNotes.set([])
        });

        const avatarToUse = this.currentUserAvatarUrl() ||
            (answer.studentUsername === this.currentUser().username ? answer.studentAvatarUrl : undefined);

        this.collaborationService.joinRoom(
            answer.id,
            this.currentUser().username,
            this.currentUser().role,
            avatarToUse
        );

        this.currentView.set('live');
    }

    backToSentenceList(): void {
        if (this.selectedAnswer()) {
            this.collaborationService.leaveRoom(this.selectedAnswer()!.id);
        }
        this.selectedAnswer.set(null);
        this.currentView.set('sentences');
    }

    onUserContentChange(newContent: string): void {
        this.userContent.set(newContent);
        const ansId = this.selectedAnswer()?.id;
        if (ansId) {
            this.collaborationService.sendContentChange(
                ansId,
                newContent,
                'userAnswer',
                this.currentUser().username
            );
            this.notifyTyping();
        }
    }

    onAdminContentChange(newContent: string): void {
        this.adminContent.set(newContent);
        const ansId = this.selectedAnswer()?.id;
        if (ansId) {
            this.collaborationService.sendContentChange(
                ansId,
                newContent,
                'adminCorrection',
                this.currentUser().username
            );
            this.notifyTyping();
        }
    }

    onSelectionChanged(event: any): void {
        if (!event || !event.range) return;
        const range = event.range;
        const ansId = this.selectedAnswer()?.id;
        if (!ansId) return;

        if (range.length > 0 && event.editor) {
            const selectedText = event.editor.getText(range.index, range.length).trim();
            this.selectedTextSnippet.set(selectedText);
            this.selectedRangeIndex.set(range.index);
            this.selectedRangeLength.set(range.length);
        } else {
            this.selectedTextSnippet.set('');
        }

        this.collaborationService.sendSelectionChange(
            ansId,
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
                detail: 'Please select a text snippet in Teacher Corrections first.',
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
        const ans = this.selectedAnswer();
        if (!text || !snippet || !ans) return;

        const category = this.newNoteCategory();

        this.sentenceService.addSentenceComment(ans.id, {
            selectedText: snippet,
            noteContent: text,
            category: category
        }).subscribe({
            next: (createdComment) => {
                const noteObj: SentenceTeacherNoteEvent = {
                    noteId: createdComment.noteId,
                    selectedText: createdComment.selectedText,
                    noteContent: createdComment.noteContent,
                    category: createdComment.category,
                    author: createdComment.author,
                    timestamp: createdComment.timestamp,
                    isArchived: createdComment.isArchived
                };

                const editor = this.adminEditor?.quillEditor;
                if (editor) {
                    editor.formatText(this.selectedRangeIndex(), this.selectedRangeLength(), {
                        'background': '#FEF3C7',
                        'color': '#92400E'
                    });
                }

                this.teacherNotes.update(notes => [noteObj, ...notes]);

                this.collaborationService.sendTeacherNote(
                    ans.id,
                    createdComment.noteId,
                    snippet,
                    text,
                    category,
                    createdComment.author
                );

                this.showNoteModal.set(false);
                this.newNoteText.set('');

                this.messageService.add({
                    severity: 'success',
                    summary: 'Comment Attached',
                    detail: 'Comment linked to selected text passage.'
                });
            }
        });
    }

    archiveNote(noteId: string): void {
        const numericId = parseInt(noteId.replace('note_', ''), 10);
        if (!isNaN(numericId)) {
            this.sentenceService.archiveSentenceComment(numericId).subscribe();
        }

        this.teacherNotes.update(notes =>
            notes.map(n => n.noteId === noteId ? { ...n, isArchived: true } : n)
        );

        this.messageService.add({
            severity: 'info',
            summary: 'Comment Resolved',
            detail: 'Comment has been archived.'
        });
    }

    applyHighlight(bgColor: string, textColor: string): void {
        this.activeTab.set('admin');
        const editor = this.adminEditor?.quillEditor;
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

        const ansId = this.selectedAnswer()?.id;
        if (ansId) {
            this.collaborationService.sendSelectionChange(
                ansId,
                0,
                0,
                this.currentUser().username,
                this.currentUser().role
            );
        }

        setTimeout(() => {
            const freshHtml = editor.root.innerHTML;
            this.adminContent.set(freshHtml);
            this.onAdminContentChange(freshHtml);
        }, 10);
    }

    setOverride(result: 'Correct' | 'Partial' | 'Incorrect'): void {
        this.selectedOverride.set(result);
    }

    private lastRemoteSelection: { index: number; length: number; originalBg?: any; originalColor?: any } | null = null;

    private updateRemoteSelectionHighlight(index: number, length: number, role: string): void {
        const editor = this.adminEditor?.quillEditor || this.userEditor?.quillEditor;
        if (!editor) return;

        if (this.lastRemoteSelection) {
            editor.formatText(this.lastRemoteSelection.index, this.lastRemoteSelection.length, {
                'background': this.lastRemoteSelection.originalBg || false,
                'color': this.lastRemoteSelection.originalColor || false
            });
            this.lastRemoteSelection = null;
        }

        if (length > 0) {
            const currentFormat = editor.getFormat(index, length);
            const highlightBg = role === 'Admin' ? '#C7D2FE' : '#A7F3D0';

            this.lastRemoteSelection = {
                index,
                length,
                originalBg: currentFormat['background'],
                originalColor: currentFormat['color']
            };

            editor.formatText(index, length, {
                'background': highlightBg
            });
        }
    }

    private notifyTyping(): void {
        const ansId = this.selectedAnswer()?.id;
        if (!ansId) return;

        this.collaborationService.sendTypingStatus(ansId, true, this.currentUser().username);

        if (this.typingTimeout) clearTimeout(this.typingTimeout);

        this.typingTimeout = setTimeout(() => {
            this.collaborationService.sendTypingStatus(ansId, false, this.currentUser().username);
        }, 2000);
    }

    saveSentenceReview(): void {
        const ans = this.selectedAnswer();
        if (!ans) return;

        this.saving.set(true);

        const editor = this.adminEditor?.quillEditor;
        const correctionToSave = editor ? editor.root.innerHTML : this.adminContent();

        this.sentenceService.saveSentenceReview(ans.id, {
            adminCorrection: correctionToSave,
            teacherOverride: this.selectedOverride() || undefined
        }).subscribe({
            next: (updated) => {
                this.saving.set(false);
                this.selectedAnswer.set(updated);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Saved',
                    detail: 'Sentence review and teacher notes saved successfully!'
                });
            },
            error: () => this.saving.set(false)
        });
    }

    resultSeverity(res: string): 'success' | 'warn' | 'danger' | 'secondary' {
        if (res === 'Correct') return 'success';
        if (res === 'Partial') return 'warn';
        if (res === 'Incorrect') return 'danger';
        return 'secondary';
    }
}
