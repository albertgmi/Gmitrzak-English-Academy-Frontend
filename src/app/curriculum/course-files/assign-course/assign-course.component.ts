import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AssignmentService, CreateCourseAssignmentRequest } from '../../../services/assignment.service';
import { UserService } from '../../../services/user.service';
import { CourseService } from '../../../services/course.service';

@Component({
    selector: 'app-assign-course',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        ButtonModule, SelectModule, MultiSelectModule,
        DatePickerModule, ToastModule
    ],
    providers: [MessageService],
    templateUrl: './assign-course.component.html'
})
export class AssignCourseComponent implements OnInit {
    private assignmentService = inject(AssignmentService);
    private userService = inject(UserService);
    private courseService = inject(CourseService);
    private messageService = inject(MessageService);

    submitted = false;
    loadingSubmit = false;

    selectedUserIds = signal<number[]>([]);
    selectedCourseId = signal<number | null>(null);
    selectedStartDate = signal<Date | null>(null);

    users = computed(() =>
        (this.userService.users.value() ?? [])
            .filter(u => u.role === 'User')
            .map(u => ({ id: u.id, label: `${u.username} (${u.email})` }))
    );

    courses = computed(() =>
        (this.courseService.courses.value() ?? [])
            .filter(c => !c.isHidden)
            .map(c => ({ id: c.id, label: `${c.name} (${c.matrixDtos.length} matrices)` }))
    );

    ngOnInit() {
        this.userService.users.reload();
        this.courseService.reloadCourses();
    }

    formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    reset() {
        this.selectedUserIds.set([]);
        this.selectedCourseId.set(null);
        this.selectedStartDate.set(null);
        this.submitted = false;
    }

    submitAssignment() {
        this.submitted = true;
        const userIds = this.selectedUserIds();
        const courseId = this.selectedCourseId();
        const date = this.selectedStartDate();

        if (!userIds.length || !courseId || !date) return;

        this.loadingSubmit = true;

        const request: CreateCourseAssignmentRequest = {
            courseId,
            startDate: this.formatDate(date),
            userIds
        };

        this.assignmentService.createCourseAssignment(request).subscribe({
            next: (result) => {
                if (result.assignedUsernames.length) {
                    this.messageService.add({
                        severity: 'success', summary: 'Course assigned',
                        detail: `Assigned to: ${result.assignedUsernames.join(', ')}`, life: 4000
                    });
                }
                if (result.skipped.length) {
                    this.messageService.add({
                        severity: 'warn', summary: 'Some assignments skipped',
                        detail: result.skipped.join(' • '), life: 6000
                    });
                }
                this.reset();
                this.loadingSubmit = false;
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({
                    severity: 'error', summary: 'Error',
                    detail: 'Failed to assign course.', life: 3000
                });
                this.loadingSubmit = false;
            }
        });
    }
}