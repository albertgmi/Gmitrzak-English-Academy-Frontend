import { inject, Injectable, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProgramSimple {
    id: number;
    name: string;
}

export interface Matrix {
    id: number;
    name: string;
    refreshIntervalDays: number;
}

export interface Course {
    id: number;
    name: string;
    description: string;
    isHidden: boolean;
    matrixDtos: Matrix[];
    programs: ProgramSimple[];
}

export interface UpdateCourseRequest {
    name?: string;
    description?: string;
    isHidden?: boolean;
}

export interface CreateCourseRequest {
    name: string;
    description: string;
    isHidden?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class CourseService {
    private apiUrl = `${environment.apiUrl}/api/course`;
    http = inject(HttpClient);

    courses = resource<Course[], unknown>({
        loader: () => lastValueFrom(this.http.get<Course[]>(this.apiUrl))
    });

    reloadCourses() {
        this.courses.reload();
    }

    updateCourse(courseId: number, request: UpdateCourseRequest) {
        return this.http.put<Course>(`${this.apiUrl}/${courseId}`, request);
    }

    deleteCourse(courseId: number) {
        return this.http.delete(`${this.apiUrl}/${courseId}`);
    }

    createCourse(request: CreateCourseRequest) {
        return this.http.post<Course>(this.apiUrl, request);
    }

    assignProgram(courseId: number, programId: number) {
        return this.http.post(`${this.apiUrl}/${courseId}/programs/${programId}`, {});
    }

    removeProgram(courseId: number, programId: number) {
        return this.http.delete(`${this.apiUrl}/${courseId}/programs/${programId}`);
    }
}