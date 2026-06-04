import { inject, Injectable, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

export interface ModuleSimple {
    id: number;
    name: string;
    description: string;
    isHidden: boolean;
    order: number;
}

export interface CourseSimple {
    id: number;
    name: string;
}

export interface Matrix {
    id: number;
    name: string;
    description: string;
    refreshIntervalDays: number;
    isHidden: boolean;
    modules: ModuleSimple[];
    courses: CourseSimple[];
}

export interface CreateMatrixRequest {
    name: string;
    description: string;
    refreshIntervalDays: number;
    isHidden?: boolean;
}

export interface UpdateMatrixRequest {
    name?: string;
    description?: string;
    refreshIntervalDays?: number;
    isHidden?: boolean;
}

@Injectable({ providedIn: 'root' })
export class MatrixService {
    private apiUrl = '/api/matrix';
    http = inject(HttpClient);

    matrices = resource<Matrix[], unknown>({
        loader: () => lastValueFrom(this.http.get<Matrix[]>(this.apiUrl))
    });

    reloadMatrices() {
        this.matrices.reload();
    }

    createMatrix(request: CreateMatrixRequest) {
        return this.http.post<Matrix>(this.apiUrl, request);
    }

    updateMatrix(matrixId: number, request: UpdateMatrixRequest) {
        return this.http.put<Matrix>(`${this.apiUrl}/${matrixId}`, request);
    }

    deleteMatrix(matrixId: number) {
        return this.http.delete(`${this.apiUrl}/${matrixId}`);
    }

    assignCourse(matrixId: number, courseId: number) {
        return this.http.post(`${this.apiUrl}/${matrixId}/courses/${courseId}`, {});
    }

    removeCourse(matrixId: number, courseId: number) {
        return this.http.delete(`${this.apiUrl}/${matrixId}/courses/${courseId}`);
    }

    getAllMatrices() {
        return this.http.get<Matrix[]>('/api/matrix');
    }
}