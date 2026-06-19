import { inject, Injectable, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ModuleUnlockDto {
    matrixModuleId: number;
    moduleId: number;
    moduleName: string;
    moduleDescription: string;
    weekNumber: number;
    dayOfWeek: number;
    unlockDate: string;
    isUnlocked: boolean;
    isCompleted: boolean;
}

export interface MatrixAssignmentDto {
    id: number;
    userId: number;
    username: string;
    matrixId: number;
    matrixName: string;
    refreshIntervalDays: number;
    startDate: string;
    modules: ModuleUnlockDto[];
}

export interface CreateMatrixAssignmentRequest {
    userId: number;
    matrixId: number;
    startDate: string;
}

export interface ModuleAssignmentDto {
    id: number;
    userId: number;
    username: string;
    moduleId: number;
    moduleName: string;
    moduleDescription: string;
    dueDate: string;
    isCompleted: boolean;
    isOverdue: boolean;
}

export interface CreateModuleAssignmentRequest {
    userId: number;
    moduleId: number;
    dueDate: string;
}

export type AssignmentDto = MatrixAssignmentDto;
export type CreateAssignmentRequest = CreateMatrixAssignmentRequest;

@Injectable({ providedIn: 'root' })
export class AssignmentService {
    private apiUrl = `${environment.apiUrl}/api/assignment`;
    http = inject(HttpClient);

    assignments = resource<MatrixAssignmentDto[], unknown>({
        loader: () => lastValueFrom(this.http.get<MatrixAssignmentDto[]>(`${this.apiUrl}/matrix`))
    });

    reloadAssignments() {
        this.assignments.reload();
    }

    createAssignment(request: CreateMatrixAssignmentRequest) {
        return this.http.post<MatrixAssignmentDto>(`${this.apiUrl}/matrix`, request);
    }

    deleteAssignment(id: number) {
        return this.http.delete(`${this.apiUrl}/matrix/${id}`);
    }

    getMatrixByUser(userId: number) {
        return this.http.get<MatrixAssignmentDto[]>(`${this.apiUrl}/matrix/user/${userId}`);
    }

    moduleAssignments = resource<ModuleAssignmentDto[], unknown>({
        loader: () => lastValueFrom(this.http.get<ModuleAssignmentDto[]>(`${this.apiUrl}/module`))
    });

    reloadModuleAssignments() {
        this.moduleAssignments.reload();
    }

    createModuleAssignment(request: CreateModuleAssignmentRequest) {
        return this.http.post<ModuleAssignmentDto>(`${this.apiUrl}/module`, request);
    }

    deleteModuleAssignment(id: number) {
        return this.http.delete(`${this.apiUrl}/module/${id}`);
    }

    completeModuleAssignment(id: number) {
        return this.http.patch(`${this.apiUrl}/module/${id}/complete`, {});
    }

    uncompleteModuleAssignment(id: number) {
        return this.http.patch(`${this.apiUrl}/module/${id}/uncomplete`, {});
    }

    getModuleByUser(userId: number) {
        return this.http.get<ModuleAssignmentDto[]>(`${this.apiUrl}/module/user/${userId}`);
    }
}