import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ChipModule } from 'primeng/chip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Matrix, MatrixService, UpdateMatrixRequest, CourseSimple } from '../../../services/matrix.service';
import { CourseService } from '../../../services/course.service';

@Component({
    selector: 'app-matrix-edit',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule,
        ButtonModule, InputTextModule, TextareaModule,
        CheckboxModule, InputNumberModule, SelectModule,
        ChipModule, ToastModule
    ],
    providers: [MessageService],
    templateUrl: './matrix-edit.component.html'
})
export class MatrixEditComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private matrixService = inject(MatrixService);
    private courseService = inject(CourseService);
    private messageService = inject(MessageService);

    matrixId!: number;
    editedMatrix = signal<Matrix | null>(null);
    submitted = false;
    selectedCourseToAdd = signal<CourseSimple | null>(null);

    intervalPresets = [
        { label: 'Daily',     value: 1  },
        { label: 'Weekly',    value: 7  },
        { label: 'Bi-weekly', value: 14 },
        { label: 'Monthly',   value: 30 },
    ];

    availableCourses = computed(() => {
        const all = this.courseService.courses.value() ?? [];
        const assigned = this.editedMatrix()?.courses ?? [];
        return all.filter(c => !assigned.some(a => a.id === c.id));
    });

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.matrixId = +id;
            this.loadMatrix();
        }
    }

    loadMatrix() {
        const matrix = this.matrixService.matrices.value()?.find(m => m.id === this.matrixId);
        if (matrix) {
            this.editedMatrix.set({ ...matrix, courses: [...(matrix.courses ?? [])] });
        } else {
            this.router.navigate(['/curriculum/matrices']);
        }
    }

    save() {
        const current = this.editedMatrix();
        if (!current?.name?.trim()) {
            this.submitted = true;
            return;
        }

        const request: UpdateMatrixRequest = {
            name: current.name,
            description: current.description,
            refreshIntervalDays: current.refreshIntervalDays,
            isHidden: current.isHidden
        };

        this.matrixService.updateMatrix(this.matrixId, request).subscribe({
            next: () => {
                this.matrixService.reloadMatrices();
                this.messageService.add({
                    severity: 'success', summary: 'Saved',
                    detail: 'Matrix updated.', life: 3000
                });
                setTimeout(() => this.router.navigate(['/curriculum/matrices']), 1000);
            },
            error: () => this.messageService.add({
                severity: 'error', summary: 'Error',
                detail: 'Update failed.', life: 3000
            })
        });
    }

    assignCourse() {
        const course = this.selectedCourseToAdd();
        const current = this.editedMatrix();
        if (!course || !current) return;

        this.matrixService.assignCourse(this.matrixId, course.id).subscribe({
            next: () => {
                this.editedMatrix.set({ ...current, courses: [...current.courses, course] });
                this.selectedCourseToAdd.set(null);
                this.matrixService.reloadMatrices();
            },
            error: () => this.messageService.add({
                severity: 'error', summary: 'Error',
                detail: 'Failed to assign course.', life: 3000
            })
        });
    }

    removeCourse(course: CourseSimple) {
        const current = this.editedMatrix();
        if (!current) return;

        this.matrixService.removeCourse(this.matrixId, course.id).subscribe({
            next: () => {
                this.editedMatrix.set({
                    ...current,
                    courses: current.courses.filter(c => c.id !== course.id)
                });
                this.matrixService.reloadMatrices();
            },
            error: () => this.messageService.add({
                severity: 'error', summary: 'Error',
                detail: 'Failed to remove course.', life: 3000
            })
        });
    }

    goBack() {
        this.router.navigate(['/curriculum/matrices']);
    }
}