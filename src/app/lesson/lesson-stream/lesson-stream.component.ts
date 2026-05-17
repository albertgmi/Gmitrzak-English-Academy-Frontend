import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { LessonPanelService, StreamEntryDto } from '../../services/lesson-panel.service';
import { LessonContextService } from '../../services/lesson-context.service';

@Component({
    selector: 'app-lesson-stream',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule,
        InputTextModule, ToastModule, ConfirmDialogModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './lesson-stream.component.html'
})
export class LessonStreamComponent implements OnInit {
    private service = inject(LessonPanelService);
    private lessonContext = inject(LessonContextService);
    private router = inject(Router);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    activeStudent = this.lessonContext.activeStudent;
    entries = signal<StreamEntryDto[]>([]);
    loading = signal(true);
    saving = signal(false);

    newCommand = signal('');
    newPayload = signal('');

    ngOnInit() {
        const id = this.lessonContext.studentId;
        if (!id) return;
        this.load(id);
    }

    load(id: number) {
        this.service.getStream(id).subscribe({
            next: (d) => { this.entries.set(d); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    add() {
        const id = this.lessonContext.studentId;
        if (!id || !this.newCommand().trim()) return;
        this.saving.set(true);
        this.service.addStream(id, this.newCommand(), this.newPayload()).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Added', life: 3000
                });
                this.newCommand.set('');
                this.newPayload.set('');
                this.saving.set(false);
                this.load(id);
            },
            error: () => this.saving.set(false)
        });
    }

    confirmDelete(entry: StreamEntryDto) {
        this.confirmationService.confirm({
            message: `Delete entry "${entry.command}"?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.service.deleteStream(entry.id).subscribe({
                    next: () => {
                        this.entries.update(list => list.filter(e => e.id !== entry.id));
                        this.messageService.add({ severity: 'success', summary: 'Deleted', life: 3000 });
                    }
                });
            }
        });
    }

    goToSwitchClient() { this.router.navigate(['/lesson/switch-client']); }
}