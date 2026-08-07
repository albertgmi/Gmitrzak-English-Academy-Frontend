import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import {
    LessonService,
    AlphabetAbbreviationDto,
    AlphabetHistoryItemDto,
    StudentSimple
} from '../../services/lesson.service';

@Component({
    selector: 'app-alphabet-pool',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, SelectModule, ToastModule, TagModule],
    providers: [MessageService],
    templateUrl: './alphabet-pool.component.html'
})
export class AlphabetPoolComponent implements OnInit {
    private lessonService = inject(LessonService);
    private messageService = inject(MessageService);

    pool = signal<AlphabetAbbreviationDto[]>([]);
    loadingPool = signal(true);
    newText = signal('');
    saving = signal(false);
    deletingId = signal<number | null>(null);

    students = signal<StudentSimple[]>([]);
    studentOptions = computed(() => this.students().map(s => ({ label: s.username, value: s.id })));
    selectedStudentId = signal<number | null>(null);

    history = signal<AlphabetHistoryItemDto[]>([]);
    loadingHistory = signal(false);

    ngOnInit() {
        this.loadPool();
        this.lessonService.getStudents().subscribe({
            next: (s) => this.students.set(s ?? []),
            error: () => this.students.set([])
        });
    }

    loadPool() {
        this.loadingPool.set(true);
        this.lessonService.getAlphabetPool().subscribe({
            next: (res) => { this.pool.set(res ?? []); this.loadingPool.set(false); },
            error: () => this.loadingPool.set(false)
        });
    }

    addAbbreviation() {
        const text = this.newText().trim();
        if (!text) return;

        this.saving.set(true);
        this.lessonService.addAlphabetAbbreviation(text).subscribe({
            next: () => {
                this.newText.set('');
                this.saving.set(false);
                this.loadPool();
                this.messageService.add({ severity: 'success', summary: 'Added', detail: `"${text}" added to the pool`, life: 3000 });
            },
            error: () => {
                this.saving.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to add', life: 3000 });
            }
        });
    }

    removeAbbreviation(item: AlphabetAbbreviationDto) {
        this.deletingId.set(item.id);
        this.lessonService.deleteAlphabetAbbreviation(item.id).subscribe({
            next: () => {
                this.pool.update(list => list.filter(x => x.id !== item.id));
                this.deletingId.set(null);
            },
            error: () => this.deletingId.set(null)
        });
    }

    onStudentChange(studentId: number | null) {
        this.selectedStudentId.set(studentId);
        if (!studentId) { this.history.set([]); return; }

        this.loadingHistory.set(true);
        this.lessonService.getAlphabetHistory(studentId).subscribe({
            next: (res) => { this.history.set(res ?? []); this.loadingHistory.set(false); },
            error: () => this.loadingHistory.set(false)
        });
    }

    problemLetterList(problemLetters: string): string[] {
        return problemLetters ? problemLetters.split(',').filter(Boolean) : [];
    }
}