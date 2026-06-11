import { Injectable, signal } from '@angular/core';

export interface ActiveStudent {
    id: number;
    username: string;
    email: string;
    avatarUrl?: string | null;
}

@Injectable({ providedIn: 'root' })
export class LessonContextService {
    activeStudent = signal<ActiveStudent | null>(null);

    setStudent(student: ActiveStudent) {
        this.activeStudent.set(student);
    }

    clearStudent() {
        this.activeStudent.set(null);
    }

    get studentId(): number | null {
        return this.activeStudent()?.id ?? null;
    }
}