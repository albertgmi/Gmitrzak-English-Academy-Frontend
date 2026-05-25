import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LessonPanelService, ActivityPointsLessonSummaryDto } from '../../services/lesson-panel.service';
import { LessonContextService } from '../../services/lesson-context.service';
import { AvatarComponent } from '../../other/avatar/avatar.component';

@Component({
    selector: 'app-lesson-activity-points',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule,
        InputTextModule, InputNumberModule, ToastModule, AvatarComponent],
    providers: [MessageService],
    templateUrl: './lesson-activity-points.component.html'
})
export class LessonActivityPointsComponent implements OnInit {
    private service = inject(LessonPanelService);
    private lessonContext = inject(LessonContextService);
    private router = inject(Router);
    private messageService = inject(MessageService);

    activeStudent = this.lessonContext.activeStudent;
    data = signal<ActivityPointsLessonSummaryDto | null>(null);
    loading = signal(true);
    saving = signal(false);

    newPoints = signal(0);
    newReason = signal('');

    ngOnInit() {
        const id = this.lessonContext.studentId;
        if (!id) return;
        this.load(id);
    }

    load(id: number) {
        this.service.getActivityPoints(id).subscribe({
            next: (d) => { this.data.set(d); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    add() {
        const id = this.lessonContext.studentId;
        if (!id || this.newPoints() <= 0) return;
        this.saving.set(true);
        this.service.addActivityPoints(id, this.newPoints(), this.newReason()).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Points added',
                    detail: `+${this.newPoints()} points`, life: 3000
                });
                this.newPoints.set(0);
                this.newReason.set('');
                this.saving.set(false);
                this.load(id);
            },
            error: () => this.saving.set(false)
        });
    }

    goToSwitchClient() { this.router.navigate(['/lesson/switch-client']); }
}