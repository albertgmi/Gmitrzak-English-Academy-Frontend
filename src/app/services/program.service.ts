import { inject, Injectable, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Course {
    id: number;
    name: string;
    description?: string;
}

export interface Program {
    id: number;
    name: string;
    description: string;
    isHidden: boolean;
    courseDtos: Course[];
}

export interface UpdateProgramRequest {
    name?: string;
    description?: string;
    isHidden?: boolean;
}

export interface CreateProgramRequest {
    name: string;
    description: string;
    isHidden?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class ProgramService {
    private apiUrl = `${environment.apiUrl}/api/program`;

    http = inject(HttpClient);

    programs = resource<Program[], unknown>({
        loader: () => {
            const request$ = this.http.get<Program[]>(`${this.apiUrl}`);
            return lastValueFrom(request$);
        }
    });

    reloadPrograms() {
        this.programs.reload();
    }

    updateProgram(programId: number, request: UpdateProgramRequest) {
        return this.http.put<Program>(`${this.apiUrl}/${programId}`, request);
    }

    deleteProgram(programId: number) {
        return this.http.delete(`${this.apiUrl}/${programId}`);
    }

    createProgram(request: CreateProgramRequest) {
        return this.http.post<Program>(`${this.apiUrl}`, request);
    }
}