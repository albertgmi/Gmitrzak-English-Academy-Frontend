import { Component, OnInit, OnDestroy, signal, effect, ViewChild, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { QuillEditorComponent, QuillModule } from 'ngx-quill';
import { LiveNotepadService, LiveNoteSummaryDto, LiveNoteDetailDto } from '../../services/live-notepad.service';
import { LiveNotepadCollaborationService, LiveNoteCollaborativeUser } from '../../services/live-notepad-collaboration.service';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { UserService, User } from '../../services/user.service';
import { AvatarComponent } from '../../other/avatar/avatar.component';

@Component({
    selector: 'app-live-notepad',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        TagModule,
        TooltipModule,
        ToastModule,
        DialogModule,
        InputTextModule,
        SelectModule,
        IconFieldModule,
        InputIconModule,
        QuillModule,
        AvatarComponent
    ],
    providers: [MessageService],
    templateUrl: './live-notepad.component.html',
    styleUrls: ['./live-notepad.component.scss']
})
export class LiveNotepadComponent implements OnInit, OnDestroy {
    private noteService = inject(LiveNotepadService);
    private collaborationService = inject(LiveNotepadCollaborationService);
    private authService = inject(AuthService);
    private profileService = inject(ProfileService);
    private userService = inject(UserService);
    private messageService = inject(MessageService);

    @ViewChild('quillEditor') editorComponent!: QuillEditorComponent;

    currentView = signal<'grid' | 'editor'>('grid');
    notes = signal<LiveNoteSummaryDto[]>([]);
    selectedNote = signal<LiveNoteDetailDto | null>(null);
    noteContent = signal<string>('');
    searchQuery = signal<string>('');

    // State
    loading = signal<boolean>(false);
    saving = signal<boolean>(false);
    activeUsers = signal<LiveNoteCollaborativeUser[]>([]);
    currentUserAvatarUrl = signal<string | undefined>(undefined);
    isRemoteTyping = signal<boolean>(false);
    remoteTypingUser = signal<string>('');
    remoteSelection = signal<{ username: string; index: number; length: number } | null>(null);

    // Modal Create Note State
    showCreateModal = signal<boolean>(false);
    newNoteTitle = signal<string>('');
    selectedStudentId = signal<number | null>(null);
    studentsList = signal<User[]>([]);

    currentUser = computed(() => ({
        id: this.authService.getUserId(),
        username: this.authService.getUsername() || 'User',
        role: this.authService.getRole() || 'User'
    }));

    isAdmin = computed(() => this.currentUser().role === 'Admin');

    private typingTimeout: any = null;
    private autoSaveTimeout: any = null;
    private isRemoteUpdating = false;

    constructor() {
        // SignalR Remote Content Sync Effect
        effect(() => {
            const change = this.collaborationService.contentChange();
            if (!change) return;

            const note = this.selectedNote();
            if (!note || change.noteId !== note.id) return;

            if (change.senderUsername !== this.currentUser().username) {
                this.isRemoteUpdating = true;
                this.noteContent.set(change.content);

                setTimeout(() => {
                    if (this.editorComponent && this.editorComponent.quillEditor) {
                        const editor = this.editorComponent.quillEditor;
                        const currSel = editor.getSelection();
                        editor.root.innerHTML = change.content;
                        if (currSel) {
                            editor.setSelection(currSel.index, currSel.length);
                        }
                    }
                    this.isRemoteUpdating = false;
                }, 0);
            }
        });

        // SignalR Remote Selection Sync Effect
        effect(() => {
            const sel = this.collaborationService.selectionChange();
            if (!sel) return;

            if (sel.username !== this.currentUser().username) {
                this.remoteSelection.set({
                    username: sel.username,
                    index: sel.index,
                    length: sel.length
                });
                this.updateRemoteSelectionHighlight(sel.index, sel.length, sel.role);
            }
        });

        // SignalR Active Users Sync Effect
        effect(() => {
            const users = this.collaborationService.activeUsers();
            this.activeUsers.set(users);
        });

        // SignalR Typing Status Sync Effect
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
        this.loadNotes();
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

        if (this.isAdmin()) {
            this.userService.getAllUsers().subscribe({
                next: (users: User[]) => {
                    this.studentsList.set(users.filter(u => u.role !== 'Admin'));
                },
                error: () => {}
            });
        }
    }

    ngOnDestroy(): void {
        this.collaborationService.stopConnection();
        if (this.autoSaveTimeout) clearTimeout(this.autoSaveTimeout);
    }

    loadNotes(): void {
        this.loading.set(true);
        this.noteService.getNotes().subscribe({
            next: (data) => {
                this.notes.set(data);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    filteredNotes(): LiveNoteSummaryDto[] {
        const query = this.searchQuery().toLowerCase().trim();
        if (!query) return this.notes();
        return this.notes().filter(n =>
            n.title.toLowerCase().includes(query) ||
            n.studentUsername.toLowerCase().includes(query) ||
            n.previewText.toLowerCase().includes(query)
        );
    }

    openCreateModal(): void {
        this.newNoteTitle.set('');
        this.selectedStudentId.set(null);
        if (this.isAdmin()) {
            this.userService.getAllUsers().subscribe({
                next: (users: User[]) => {
                    this.studentsList.set(users.filter(u => u.role !== 'Admin'));
                }
            });
        }
        this.showCreateModal.set(true);
    }

    createNewNote(): void {
        const title = this.newNoteTitle().trim();
        if (!title) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Title Required',
                detail: 'Please enter a title for the new note.'
            });
            return;
        }

        if (this.isAdmin() && !this.selectedStudentId()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Student Required',
                detail: 'Please select a student for this note.'
            });
            return;
        }

        this.loading.set(true);
        this.noteService.createNote({
            title,
            studentId: this.isAdmin() ? (this.selectedStudentId() || undefined) : undefined
        }).subscribe({
            next: (note) => {
                this.loading.set(false);
                this.showCreateModal.set(false);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Note Created',
                    detail: `Note "${note.title}" created successfully!`
                });
                this.openNoteEditor(note.id);
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to create note.'
                });
            }
        });
    }

    openNoteEditor(noteId: number): void {
        this.loading.set(true);
        this.noteService.getNoteById(noteId).subscribe({
            next: (note) => {
                this.selectedNote.set(note);
                this.noteContent.set(note.content || '');
                this.currentView.set('editor');
                this.loading.set(false);

                const avatarToUse = this.currentUserAvatarUrl() ||
                    (note.studentUsername === this.currentUser().username ? note.studentAvatarUrl : undefined);

                this.collaborationService.startConnection(
                    note.id,
                    this.currentUser().username,
                    this.currentUser().role,
                    avatarToUse
                );
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load note details.'
                });
            }
        });
    }

    backToGrid(): void {
        if (this.autoSaveTimeout) clearTimeout(this.autoSaveTimeout);
        this.collaborationService.stopConnection();
        this.currentView.set('grid');
        this.selectedNote.set(null);
        this.noteContent.set('');
        this.loadNotes();
    }

    onContentChange(event: any): void {
        if (this.isRemoteUpdating) return;

        const newContent = typeof event === 'string' ? event : (event.html || '');
        this.noteContent.set(newContent);
        const note = this.selectedNote();
        if (!note) return;

        this.collaborationService.sendContentChange(
            note.id,
            newContent,
            this.currentUser().username
        );
        this.notifyTyping();

        // Auto-save debounce (3 seconds)
        if (this.autoSaveTimeout) clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.saveNoteSilent();
        }, 3000);
    }

    onSelectionChanged(event: any): void {
        if (!event || !event.range) return;
        const note = this.selectedNote();
        if (!note) return;

        this.collaborationService.sendSelectionChange(
            note.id,
            event.range.index,
            event.range.length,
            this.currentUser().username,
            this.currentUser().role
        );
    }

    saveNoteManual(): void {
        const note = this.selectedNote();
        if (!note) return;

        this.saving.set(true);
        const editor = this.editorComponent?.quillEditor;
        const contentToSave = editor ? editor.root.innerHTML : this.noteContent();

        this.noteService.saveNote(note.id, {
            title: note.title,
            content: contentToSave
        }).subscribe({
            next: (updated) => {
                this.saving.set(false);
                this.selectedNote.set(updated);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Saved',
                    detail: 'Live note saved successfully!'
                });
            },
            error: () => this.saving.set(false)
        });
    }

    private saveNoteSilent(): void {
        const note = this.selectedNote();
        if (!note) return;

        const editor = this.editorComponent?.quillEditor;
        const contentToSave = editor ? editor.root.innerHTML : this.noteContent();

        this.noteService.saveNote(note.id, {
            title: note.title,
            content: contentToSave
        }).subscribe();
    }

    deleteNote(event: Event, note: LiveNoteSummaryDto): void {
        event.stopPropagation();
        if (confirm(`Are you sure you want to delete "${note.title}"?`)) {
            this.noteService.deleteNote(note.id).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Deleted',
                        detail: 'Note deleted successfully.'
                    });
                    this.loadNotes();
                }
            });
        }
    }

    private lastRemoteSelection: { index: number; length: number; originalBg?: any; originalColor?: any } | null = null;

    private updateRemoteSelectionHighlight(index: number, length: number, role: string): void {
        const editor = this.editorComponent?.quillEditor;
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
        const note = this.selectedNote();
        if (!note) return;

        this.collaborationService.sendTypingStatus(note.id, true, this.currentUser().username);

        if (this.typingTimeout) clearTimeout(this.typingTimeout);

        this.typingTimeout = setTimeout(() => {
            this.collaborationService.sendTypingStatus(note.id, false, this.currentUser().username);
        }, 2000);
    }
}
