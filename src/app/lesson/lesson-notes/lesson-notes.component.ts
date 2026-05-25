import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { LessonService, TeacherNoteDto } from '../../services/lesson.service';
import { LessonContextService } from '../../services/lesson-context.service';
import { AvatarComponent } from '../../other/avatar/avatar.component';

@Component({
    selector: 'app-lesson-notes',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, TextareaModule,
        ToastModule, ConfirmDialogModule, AvatarComponent],
    providers: [MessageService, ConfirmationService],
    templateUrl: './lesson-notes.component.html'
})
export class LessonNotesComponent implements OnInit {
    private lessonService = inject(LessonService);
    private lessonContext = inject(LessonContextService);
    private router = inject(Router);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    activeStudent = this.lessonContext.activeStudent;
    notes = signal<TeacherNoteDto[]>([]);
    loading = signal(true);
    saving = signal(false);
    newNote = signal('');

    ngOnInit() {
        const studentId = this.lessonContext.studentId;
        if (!studentId) return;
        this.loadNotes(studentId);
    }

    loadNotes(studentId: number) {
        this.lessonService.getNotes(studentId).subscribe({
            next: (d) => { this.notes.set(d); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    save() {
        const studentId = this.lessonContext.studentId;
        if (!this.newNote().trim() || !studentId) return;

        this.saving.set(true);
        this.lessonService.saveNote(studentId, this.newNote()).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Note saved', life: 3000
                });
                this.newNote.set('');
                this.saving.set(false);
                this.loadNotes(studentId);
            },
            error: () => this.saving.set(false)
        });
    }

    confirmDelete(note: TeacherNoteDto) {
        this.confirmationService.confirm({
            message: 'Delete this note?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.lessonService.deleteNote(note.id).subscribe({
                    next: () => {
                        this.notes.update(list => list.filter(n => n.id !== note.id));
                        this.messageService.add({
                            severity: 'success', summary: 'Deleted', life: 3000
                        });
                    }
                });
            }
        });
    }

    goToSwitchClient() {
        this.router.navigate(['/lesson/switch-client']);
    }
}