import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { StudentService, StudentModuleDto } from '../../services/student-services/student.service';

@Component({
    selector: 'app-presentation',
    standalone: true,
    imports: [
        CommonModule, RouterModule, ButtonModule,
        DividerModule, ProgressSpinnerModule, TagModule, ToastModule
    ],
    providers: [MessageService],
    templateUrl: './presentation.component.html'
})
export class PresentationComponent implements OnInit {
    private route          = inject(ActivatedRoute);
    private studentService  = inject(StudentService);
    private messageService = inject(MessageService);

    module      = signal<StudentModuleDto | null>(null);
    loading     = signal(true);
    markingDone = signal(false);
    completed   = signal(false);

    private isMatrix = true;
    private entityId = 0;

    ngOnInit() {
        const matrixModuleId = this.route.snapshot.paramMap.get('matrixModuleId');
        const singleId = this.route.snapshot.paramMap.get('id');
        const legacyModuleId = this.route.snapshot.paramMap.get('moduleId');

        if (matrixModuleId && !isNaN(Number(matrixModuleId))) {
            this.isMatrix = true;
            this.entityId = Number(matrixModuleId);
            this.load();
        } else if (singleId && !isNaN(Number(singleId))) {
            this.isMatrix = false;
            this.entityId = Number(singleId);
            this.load();
        } else if (legacyModuleId && !isNaN(Number(legacyModuleId))) {
            this.loading.set(true);
            this.studentService.getStudentModule(Number(legacyModuleId)).subscribe({
                next: (m) => {
                    this.module.set(m);
                    this.completed.set(m.isCompleted);
                    this.loading.set(false);
                },
                error: () => {
                    this.loading.set(false);
                    this.messageService.add({
                        severity: 'error', summary: 'Error',
                        detail: 'Could not load presentation.', life: 3000
                    });
                }
            });
        } else {
            this.loading.set(false);
            this.messageService.add({
                severity: 'error', summary: 'Error',
                detail: 'Invalid module ID.', life: 3000
            });
        }
    }

    private load() {
        this.loading.set(true);
        const request$ = this.isMatrix
            ? this.studentService.getStudentMatrixModule(this.entityId)
            : this.studentService.getSingleModuleById(this.entityId);

        request$.subscribe({
            next: (m) => {
                this.module.set(m);
                this.completed.set(m.isCompleted);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error', summary: 'Error',
                    detail: 'Could not load presentation.', life: 3000
                });
            }
        });
    }

    markAsDone() {
        if (this.markingDone() || this.completed()) return;

        this.markingDone.set(true);

        const request$ = this.isMatrix
            ? this.studentService.completeModule(this.entityId)
            : this.studentService.completeSingleModule(this.entityId);

        request$.subscribe({
            next: () => {
                this.completed.set(true);
                this.markingDone.set(false);
                this.messageService.add({
                    severity: 'success', summary: 'Completed',
                    detail: 'Presentation marked as done.', life: 3000
                });
            },
            error: () => {
                this.markingDone.set(false);
                this.messageService.add({
                    severity: 'error', summary: 'Error',
                    detail: 'Could not complete module.', life: 3000
                });
            }
        });
    }
}