import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LessonPanelService, AgendaDto } from '../../services/lesson-panel.service';
import { LessonContextService } from '../../services/lesson-context.service';
import { AvatarComponent } from '../../other/avatar/avatar.component';

@Component({
    selector: 'app-lesson-agenda',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule,
        InputNumberModule, TextareaModule, ToastModule, AvatarComponent],
    providers: [MessageService],
    templateUrl: './lesson-agenda.component.html'
})
export class LessonAgendaComponent implements OnInit {
    private service = inject(LessonPanelService);
    private lessonContext = inject(LessonContextService);
    private router = inject(Router);
    private messageService = inject(MessageService);

    activeStudent = this.lessonContext.activeStudent;
    agenda = signal<AgendaDto | null>(null);
    loading = signal(true);
    saving = signal(false);

    ngOnInit() {
        const id = this.lessonContext.studentId;
        if (!id) return;
        this.service.getAgenda(id).subscribe({
            next: (d) => { this.agenda.set(d); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    save() {
        const id = this.lessonContext.studentId;
        const a = this.agenda();
        if (!id || !a) return;
        this.saving.set(true);
        this.service.updateAgenda(id, a).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Saved',
                    detail: 'Agenda updated', life: 3000
                });
                this.saving.set(false);
            },
            error: () => this.saving.set(false)
        });
    }

    goToSwitchClient() {
        this.router.navigate(['/lesson/switch-client']);
    }
}