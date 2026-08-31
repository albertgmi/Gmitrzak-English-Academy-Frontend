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
import { MessageService } from 'primeng/api';
import { QuillEditorComponent, QuillModule } from 'ngx-quill';
import { EssayService, UserEssayDto } from '../../services/essay.service';
import { LiveEssayCollaborationService, TeacherNoteEvent } from '../../services/live-essay-collaboration.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { AvatarComponent } from '../../other/avatar/avatar.component';

@Component({
    selector: 'app-live-essay-room',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, TagModule,
        ToastModule, InputTextModule, TextareaModule, DialogModule,
        SelectModule, QuillModule, TooltipModule, IconFieldModule, InputIconModule,
        AvatarComponent
    ],
    providers: [MessageService],
    templateUrl: './live-essay-room.component.html',
    styleUrls: ['./live-essay-room.component.scss']
})
export class LiveEssayRoomComponent implements OnInit, OnDestroy {
    @ViewChild('studentEditor') studentEditor!: QuillEditorComponent;
    @ViewChild('adminEditor') adminEditor!: QuillEditorComponent;

    private essayService = inject(EssayService);
    private userService = inject(UserService);
    public collaborationService = inject(LiveEssayCollaborationService);
    private authService = inject(AuthService);
    private messageService = inject(MessageService);

    currentUser = computed(() => ({
        id: this.authService.getUserId(),
        username: this.authService.getUsername() || 'User',
        role: this.authService.getRole() || 'User'
    }));

    currentUserAvatarUrl = signal<string | null>(null);

    isAdmin = computed(() => this.currentUser().role === 'Admin');

    currentView = signal<'selection' | 'room'>('selection');

    essays = signal<UserEssayDto[]>([]);
    selectedEssayId = signal<number | null>(null);
    selectedEssay = signal<UserEssayDto | null>(null);
    loading = signal(true);
    saving = signal(false);

    // Filtering & Searching
    searchQuery = signal('');
    selectedStudentFilter = signal<string | null>(null);

    studentFilterOptions = computed(() => {
        const set = new Set<string>();
        this.essays().forEach(e => {
            if (e.username) set.add(e.username);
        });

        const options = Array.from(set).sort().map(username => ({
            label: username,
            value: username
        }));

        return [{ label: 'All Students', value: null }, ...options];
    });

    filteredEssays = computed(() => {
        let list = this.essays();
        const query = this.searchQuery().trim().toLowerCase();
        const studentFilter = this.selectedStudentFilter();

        if (studentFilter) {
            list = list.filter(e => e.username === studentFilter);
        }

        if (query) {
            list = list.filter(e => 
                (e.username && e.username.toLowerCase().includes(query)) ||
                (e.moduleName && e.moduleName.toLowerCase().includes(query)) ||
                (e.essayPrompt && e.essayPrompt.toLowerCase().includes(query))
            );
        }

        return list;
    });

    // Dynamic content fields
    studentContent = signal('');
    adminContent = signal('');
    activeTab = signal<'admin' | 'student'>('admin');

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

    quillReadOnlyModules = {
        toolbar: false
    };

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

    wordCount = computed(() => {
        const content = this.studentContent();
        if (!content) return 0;
        const text = content.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').trim();
        return text ? text.split(/\s+/).filter(w => w.length > 0).length : 0;
    });

    constructor() {
        effect(() => {
            const change = this.collaborationService.incomingContentChange();
            if (!change) return;

            if (change.senderUsername !== this.currentUser().username) {
                this.lastRemoteSelection = null;
                if (change.field === 'content') {
                    this.studentContent.set(change.content);
                } else if (change.field === 'adminContent') {
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
        this.loadEssays();
        this.userService.getProfile().subscribe({
            next: (profile) => {
                if (profile && profile.avatarUrl) {
                    this.currentUserAvatarUrl.set(profile.avatarUrl);
                }
            },
            error: () => {}
        });
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
        this.activeTab.set('admin');
        this.remoteSelection.set(null);

        this.essayService.getComments(essay.id).subscribe({
            next: (comments) => {
                this.teacherNotes.set(comments as any);
            },
            error: () => {
                this.teacherNotes.set([]);
            }
        });

        this.collaborationService.joinRoom(
            essay.id,
            this.currentUser().username,
            this.currentUser().role,
            this.currentUserAvatarUrl() || undefined
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

    private syncAdminContentWithNotes(): void {
        const editor = this.adminEditor?.quillEditor;
        const rawHtml = editor ? editor.root.innerHTML : this.adminContent();
        this.onAdminContentChange(rawHtml);
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
                detail: 'Please select a text passage in Teacher Corrections first.',
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

        const category = this.newNoteCategory();

        this.essayService.addComment(essayId, {
            selectedText: snippet,
            noteContent: text,
            category: category
        }).subscribe({
            next: (createdComment) => {
                const noteObj: TeacherNoteEvent = {
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
                    essayId,
                    createdComment.noteId,
                    snippet,
                    text,
                    category,
                    createdComment.author
                );

                setTimeout(() => {
                    this.syncAdminContentWithNotes();
                }, 10);

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

    hasSavedChanges(essay: UserEssayDto): boolean {
        if (!essay || !essay.adminContent) return false;
        const text = essay.adminContent.replace(/<[^>]*>/g, '').trim();
        if (!text) return false;
        return essay.adminContent !== essay.content || essay.adminContent.includes('style=') || essay.adminContent.includes('background');
    }

    archiveNote(noteId: string): void {
        const numericId = parseInt(noteId.replace('note_', ''), 10);
        if (!isNaN(numericId)) {
            this.essayService.archiveComment(numericId).subscribe();
        }

        this.teacherNotes.update(notes =>
            notes.map(n => n.noteId === noteId ? { ...n, isArchived: true } : n)
        );

        this.syncAdminContentWithNotes();

        this.messageService.add({
            severity: 'info',
            summary: 'Comment Resolved',
            detail: 'Comment has been archived and marked as resolved.'
        });
    }

    focusNoteText(snippet: string): void {
        this.activeTab.set('admin');
        const editor = this.adminEditor?.quillEditor;
        if (!editor) return;

        const fullText = editor.getText();
        const index = fullText.indexOf(snippet);
        if (index >= 0) {
            editor.setSelection(index, snippet.length);
        }
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
                detail: 'Please select a text snippet in Teacher Corrections to highlight.',
                life: 2500
            });
            return;
        }

        editor.formatText(sel.index, sel.length, {
            'background': bgColor,
            'color': textColor
        });

        const essayId = this.selectedEssayId();
        if (essayId) {
            this.collaborationService.sendSelectionChange(
                essayId,
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

    private lastRemoteSelection: { index: number; length: number; originalBg?: any; originalColor?: any } | null = null;

    private updateRemoteSelectionHighlight(index: number, length: number, role: string): void {
        const editor = this.adminEditor?.quillEditor || this.studentEditor?.quillEditor;
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
            const editor = this.adminEditor?.quillEditor;
            let contentToSave = this.adminContent();
            if (editor) {
                let rawHtml = editor.root.innerHTML;
                rawHtml = rawHtml.replace(/<!--NOTES_DATA:[\s\S]*?-->/g, '');
                contentToSave = rawHtml + `<!--NOTES_DATA:${JSON.stringify(this.teacherNotes())}-->`;
            } else {
                let rawHtml = contentToSave.replace(/<!--NOTES_DATA:[\s\S]*?-->/g, '');
                contentToSave = rawHtml + `<!--NOTES_DATA:${JSON.stringify(this.teacherNotes())}-->`;
            }

            this.essayService.review(essay.id, contentToSave).subscribe({
                next: (updated: UserEssayDto) => {
                    this.saving.set(false);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Saved',
                        detail: 'Teacher corrections and notes saved successfully!'
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
