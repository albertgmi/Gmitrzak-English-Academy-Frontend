import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ChipModule } from 'primeng/chip';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Course, CourseService, UpdateCourseRequest, ProgramSimple } from '../../../services/course.service';
import { ProgramService } from '../../../services/program.service';

@Component({
    selector: 'app-course-edit',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule, ButtonModule, InputTextModule,
        TextareaModule, CheckboxModule, ChipModule, SelectModule, ToastModule
    ],
    providers: [MessageService],
    templateUrl: './course-edit.component.html'
})
export class CourseEditComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private courseService = inject(CourseService);
    private programService = inject(ProgramService);
    private messageService = inject(MessageService);

    courseId!: number;
    editedCourse = signal<Course | null>(null);
    submitted = false;
    selectedProgramToAdd = signal<ProgramSimple | null>(null);

    availablePrograms = computed(() => {
        const all = this.programService.programs.value() ?? [];
        const assigned = this.editedCourse()?.programs ?? [];
        return all.filter(p => !assigned.some(a => a.id === p.id));
    });

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.courseId = +id;
            this.loadCourse();
        }
    }

    loadCourse() {
        const course = this.courseService.courses.value()?.find(c => c.id === this.courseId);
        if (course) {
            this.editedCourse.set({ ...course, programs: [...(course.programs ?? [])] });
        } else {
            this.router.navigate(['/curriculum/courses']);
        }
    }

    saveCourse() {
        const current = this.editedCourse();
        if (!current || !current.name?.trim()) {
            this.submitted = true;
            return;
        }

        const request: UpdateCourseRequest = {
            name: current.name,
            description: current.description,
            isHidden: current.isHidden
        };

        this.courseService.updateCourse(this.courseId, request).subscribe({
            next: () => {
                this.courseService.reloadCourses();
                this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Course updated successfully' });
                setTimeout(() => this.router.navigate(['/curriculum/courses']), 1000);
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Update failed' })
        });
    }

    goBack() {
        this.router.navigate(['/curriculum/courses']);
    }

    assignProgram() {
        const program = this.selectedProgramToAdd();
        const current = this.editedCourse();
        if (!program || !current) return;

        this.courseService.assignProgram(this.courseId, program.id).subscribe({
            next: () => {
                this.editedCourse.set({ ...current, programs: [...current.programs, program] });
                this.selectedProgramToAdd.set(null);
                this.courseService.reloadCourses();
            }
        });
    }

    removeProgram(program: ProgramSimple) {
        const current = this.editedCourse();
        if (!current) return;

        this.courseService.removeProgram(this.courseId, program.id).subscribe({
            next: () => {
                this.editedCourse.set({
                    ...current,
                    programs: current.programs.filter(p => p.id !== program.id)
                });
                this.courseService.reloadCourses();
            }
        });
    }
}