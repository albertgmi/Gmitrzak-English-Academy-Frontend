import { inject, Injectable, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

export interface Matrix {
    id: number;
    name: string;
}

export interface Course {
    id: number;
    name: string;
    description: string;
    isHidden: boolean;
    matrixDtos: Matrix[];
}

@Injectable({
    providedIn: 'root'
})
export class CourseService {
    private apiUrl = '/api/course';

    http = inject(HttpClient);

    courses = resource<Course[], unknown>({
        loader: () => {
            const request$ = this.http.get<Course[]>(`${this.apiUrl}`);
            return lastValueFrom(request$);
        }
    });
}