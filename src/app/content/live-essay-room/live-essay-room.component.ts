import { Component, inject, signal, computed, OnInit, OnDestroy, effect, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TabsModule } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip';
import { RatingModule } from 'primeng/rating';
import { MessageService } from 'primeng/api';
import { QuillEditorComponent, QuillModule } from 'ngx-quill';
import { EssayService, UserEssayDto } from '../../services/essay.service';
import { EssayDetectorService, EssayAnalysisResult } from '../../services/essay-detector.service';
import { LiveEssayCollaborationService, SelectionChangeEvent, LiveGradeEvent } from '../../services/live-essay-collaboration.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-live-essay-room',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, TagModule,
        ToastModule, SelectModule, InputTextModule,
        QuillModule, TabsModule, TooltipModule, RatingModule
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

    essays = signal<UserEssayDto[]>([]);
    selectedEssayId = signal<number | null>(null);
    selectedEssay = signal<UserEssayDto | null>(null);
    loading = signal(true);
    saving = signal(false);

    // Dynamic content fields
    studentContent = signal('');
    adminContent = signal('');
    activeTab = signal<'student' | 'admin' | 'split'>('student');

    // Live Selection Sharing
    remoteSelection = signal<{ username: string; role: string; index: number; length: number } | null>(null);
    selectedTextSnippet = signal<string>('');

    // Live Grading Signals
    grammarScore = signal(5);
    vocabScore = signal(5);
    structureScore = signal(5);
    teacherFeedbackNotes = signal('');
    liveGradeTimestamp = signal<string | null>(null);

    // Chat
    chatInput = signal('');

    // Typing debounce
    private typingTimeout: any = null;
    isRemoteTyping = signal(false);
    remoteTypingUser = signal<string>('');

    essayOptions = computed(() => {
        return this.essays().map(e => ({
            label: `${e.username} - ${e.moduleName} (${e.isReviewed ? 'Reviewed' : 'Pending'})`,
            value: e.id,
            essay: e
        }));
    });

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

                // Highlight remote selection in local Quill instance
                if (sel.length > 0) {
                    this.highlightRemoteSelectionInEditor(sel.index, sel.length, sel.senderRole);
                }
            }
        });

        // Handle incoming live grades
        effect(() => {
            const grade = this.collaborationService.incomingLiveGrade();
            if (!grade) return;

            this.grammarScore.set(grade.grammarScore);
            this.vocabScore.set(grade.vocabScore);
            this.structureScore.set(grade.structureScore);
            this.teacherFeedbackNotes.set(grade.feedbackNotes);
            this.liveGradeTimestamp.set(grade.timestamp);

            this.messageService.add({
                severity: 'info',
                summary: 'Live Grade Updated!',
                detail: 'Teacher updated essay feedback scores in real-time.',
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

                if (data.length > 0) {
                    this.selectEssay(data[0].id);
                }
            },
            error: () => {
                this.loading.set(false);
            }
        });
    }

    selectEssay(essayId: number): void {
        const found = this.essays().find(e => e.id === essayId);
        if (!found) return;

        this.selectedEssayId.set(essayId);
        this.selectedEssay.set(found);
        this.studentContent.set(found.content || '');
        this.adminContent.set(found.adminContent || '');
        this.remoteSelection.set(null);

        this.collaborationService.joinRoom(
            essayId,
            this.currentUser().username,
            this.currentUser().role
        );
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
            const selectedText = event.editor.getText(range.index, range.length);
            this.selectedTextSnippet.set(selectedText);
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

        // Trigger change sync
        const html = editor.root.innerHTML;
        if (this.activeTab() === 'student') {
            this.onStudentContentChange(html);
        } else {
            this.onAdminContentChange(html);
        }
    }

    insertStamp(stampText: string, bgColor: string, textColor: string): void {
        const editor = this.studentEditor?.quillEditor || this.adminEditor?.quillEditor;
        if (!editor) return;

        const range = editor.getSelection() || { index: editor.getLength(), length: 0 };
        const textToInsert = ` [${stampText}] `;
        
        editor.insertText(range.index, textToInsert, {
            'background': bgColor,
            'color': textColor,
            'bold': true
        });

        const html = editor.root.innerHTML;
        if (this.activeTab() === 'student') {
            this.onStudentContentChange(html);
        } else {
            this.onAdminContentChange(html);
        }
    }

    sendLiveGrade(): void {
        const essayId = this.selectedEssayId();
        if (!essayId) return;

        this.collaborationService.sendLiveGrade(
            essayId,
            this.grammarScore(),
            this.vocabScore(),
            this.structureScore(),
            this.teacherFeedbackNotes()
        );

        this.messageService.add({
            severity: 'success',
            summary: 'Live Grade Broadcasted!',
            detail: 'Student receives score updates on their screen live.',
            life: 2500
        });
    }

    private highlightRemoteSelectionInEditor(index: number, length: number, role: string): void {
        const editor = this.studentEditor?.quillEditor;
        if (!editor) return;

        const highlightBg = role === 'Admin' ? '#E0E7FF' : '#DCFCE7';
        const highlightColor = role === 'Admin' ? '#3730A3' : '#166534';

        editor.formatText(index, length, {
            'background': highlightBg,
            'color': highlightColor
        });
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

    sendChatMessage(): void {
        const msg = this.chatInput().trim();
        const essayId = this.selectedEssayId();
        if (!msg || !essayId) return;

        this.collaborationService.sendChatMessage(
            essayId,
            msg,
            this.currentUser().username,
            this.currentUser().role
        );
        this.chatInput.set('');
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
