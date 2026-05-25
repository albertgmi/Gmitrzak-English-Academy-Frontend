import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LessonService, StudentSimple } from '../../services/lesson.service';
import { LessonContextService } from '../../services/lesson-context.service';
import { AvatarComponent } from '../../other/avatar/avatar.component';

@Component({
    selector: 'app-switch-client',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule,
        InputTextModule, IconFieldModule, InputIconModule, TagModule, ToastModule, AvatarComponent],
    providers: [MessageService],
    templateUrl: './switch-client.component.html'
})
export class SwitchClientComponent implements OnInit {
    private lessonService = inject(LessonService);
    private lessonContext = inject(LessonContextService);
    private router = inject(Router);
    private messageService = inject(MessageService);

    students = signal<StudentSimple[]>([]);
    loading = signal(true);
    activeStudent = this.lessonContext.activeStudent;
    ngOnInit() {
        this.lessonService.getStudents().subscribe({
            next: (d) => { this.students.set(d); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    selectStudent(student: StudentSimple) {
        this.lessonContext.setStudent(student);
        this.messageService.add({
            severity: 'success', summary: 'Client switched',
            detail: `Now working with ${student.username}`, life: 2000
        });
        setTimeout(() => this.router.navigate(['/lesson/mode']), 800);
    }

    onGlobalFilter(table: any, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }
}