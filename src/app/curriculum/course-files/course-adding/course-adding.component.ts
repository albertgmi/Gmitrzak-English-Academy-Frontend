import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CourseService, CreateCourseRequest } from '../../../services/course.service';

@Component({
    selector: 'app-course-adding',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule, ButtonModule, 
        InputTextModule, TextareaModule, CheckboxModule, ToastModule
    ],
    providers: [MessageService],
    templateUrl: './course-adding.component.html'
})
export class CourseAddingComponent {
    private router = inject(Router);
    private courseService = inject(CourseService);
    private messageService = inject(MessageService);

    course: CreateCourseRequest = {
        name: '',
        description: '',
        isHidden: false
    };

    submitted = false;

    saveCourse() {
        this.submitted = true;

        if (!this.course.name?.trim()) {
            return;
        }

        this.courseService.createCourse(this.course).subscribe({
            next: () => {
                this.courseService.reloadCourses();
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Course created' });
                setTimeout(() => this.router.navigate(['/curriculum/courses']), 1000);
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Creation failed' })
        });
    }
}