import { inject, Injectable, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { StudentModuleDto } from './student-services/student.service';

export interface ModuleItem {
    id: number;
    name: string;
    description: string;
    category: string;
    isHidden: boolean;
    matrices: MatrixSimple[];
    theaterItemId?: number | null;
}

export interface MatrixSimple {
    id: number;
    name: string;
    refreshIntervalDays: number;
}

export interface CreateModuleRequest {
    name: string;
    description?: string;
    category: string;
    isHidden?: boolean;
    theaterItemId?: number | null;
    presentationUrl?: string | null;
    presentationText?: string | null;
}

export interface UpdateModuleRequest {
    name?: string;
    description?: string;
    isHidden?: boolean;
    category?: string;
    theaterItemId?: number | null;
    presentationUrl?: string | null;
    presentationText?: string | null;
}

export interface AssignModuleToMatrixRequest {
    weekNumber: number;
    dayOfWeek: number;
}

@Injectable({ providedIn: 'root' })
export class ModuleItemService {
    private apiUrl = '/api/module';
    http = inject(HttpClient);

    modules = resource<(ModuleItem & { matrixName: string })[], unknown>({
        loader: async () => {
            const data = await lastValueFrom(this.http.get<ModuleItem[]>(this.apiUrl));
            return data.map(m => ({
                ...m,
                matrixName: m.matrices?.length
                    ? m.matrices.map(x => x.name).join(', ')
                    : ''
            }));
        }
    });

    reloadModules() { this.modules.reload(); }

    createModule(request: CreateModuleRequest) {
        return this.http.post<ModuleItem>(this.apiUrl, request);
    }

    updateModule(moduleId: number, request: UpdateModuleRequest) {
        return this.http.put<ModuleItem>(`${this.apiUrl}/${moduleId}`, request);
    }

    deleteModule(moduleId: number) {
        return this.http.delete(`${this.apiUrl}/${moduleId}`);
    }

    assignMatrix(moduleId: number, matrixId: number, week: number, day: number) {
        return this.http.post(`${this.apiUrl}/${moduleId}/matrix/${matrixId}`,
            { weekNumber: week, dayOfWeek: day });
    }

    removeMatrix(moduleId: number, matrixId: number) {
        return this.http.delete(`${this.apiUrl}/${moduleId}/matrix/${matrixId}`);
    }

    getSentenceModulesForStudent(studentId: number) {
        return this.http.get<StudentModuleDto[]>(
            `${this.apiUrl}/student/${studentId}/sentences`);
    }

    getAllSentenceSetsGrouped() {
        return this.http.get<any[]>('/api/sentence/sets');
    }

    assignSentenceSetToModule(moduleId: number, sentenceSetId: number) {
        return this.http.post('/api/sentence/assign-to-module',
            { moduleId, sentenceSetId });
    }
}