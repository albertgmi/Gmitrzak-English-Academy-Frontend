import { inject, Injectable, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

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
}

export interface UpdateModuleRequest {
    name?: string;
    description?: string;
    isHidden?: boolean;
    category?: string;
    theaterItemId?: number | null;
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
                matrixName: m.matrices && m.matrices.length > 0 
                    ? m.matrices.map(x => x.name).join(', ') 
                    : ''
            }));
        }
    });

    reloadModules() {
        this.modules.reload();
    }

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
        const payload: AssignModuleToMatrixRequest = {
            weekNumber: week,
            dayOfWeek: day
        };
        return this.http.post(`${this.apiUrl}/${moduleId}/matrix/${matrixId}`, payload);
    }

    removeMatrix(moduleId: number, matrixId: number) {
        return this.http.delete(`${this.apiUrl}/${moduleId}/matrix/${matrixId}`);
    }
}