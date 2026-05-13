import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ChipModule } from 'primeng/chip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Course, CourseService } from '../../../services/course.service';

@Component({
    selector: 'app-course',
    standalone: true,
    imports: [
        CommonModule, 
        FormsModule, 
        RouterModule,
        TableModule, 
        ButtonModule, 
        InputTextModule,
        IconFieldModule, 
        InputIconModule, 
        TagModule, 
        ToolbarModule, 
        ToastModule,
        RippleModule, 
        ConfirmDialogModule, 
        ChipModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './course.component.html'
})
export class CourseComponent {
    private courseService = inject(CourseService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    courses = this.courseService.courses;
    selectedCourse = signal<Course | null>(null);

    ngOnInit() {
        this.courseService.reloadCourses();
    }

    selectCourse(course: Course): void {
        this.selectedCourse.set(course);
    }

    backToList(): void {
        this.selectedCourse.set(null);
    }

    confirmDelete(course: Course): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete the course "${course.name}"?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.courseService.deleteCourse(course.id).subscribe({
                    next: () => {
                        this.courseService.reloadCourses();
                        if (this.selectedCourse()?.id === course.id) {
                            this.selectedCourse.set(null);
                        }
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Deleted',
                            detail: `Course "${course.name}" has been deleted.`,
                            life: 3000
                        });
                    },
                    error: () => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to delete course.',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    onGlobalFilter(table: any, event: Event): void {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    reload(): void {
        this.courseService.reloadCourses();
    }
}