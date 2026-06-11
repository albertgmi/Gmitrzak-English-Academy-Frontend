import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { StudentService } from '../../services/student-services/student.service';
import confetti from 'canvas-confetti';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-module-player',
    standalone: true,
    imports: [CommonModule, ButtonModule, ToastModule, TagModule],
    providers: [MessageService],
    templateUrl: './module-player.component.html',
    styleUrls: ['./module-player.component.scss']
})
export class ModulePlayerComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private studentService = inject(StudentService);
    private messageService = inject(MessageService);
    private sanitizer = inject(DomSanitizer);
    private destroy$ = new Subject<void>();

    moduleId!: number;
    moduleData = signal<any>(null);
    safeVideoUrl = signal<SafeResourceUrl | null>(null);
    loading = signal<boolean>(true);
    isSingleModule = signal<boolean>(false);

    ngOnInit() {
        this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
            const idParam = params.get('moduleId');
            if (!idParam) return;
            this.moduleId = +idParam;
            
            this.isSingleModule.set(
                this.route.snapshot.queryParamMap.get('isSingle') === 'true'
            );

            this.studentService.reloadSingleModules();
            this.studentService.reloadCourses();

            this.startDataResolution();
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private startDataResolution() {
        this.loading.set(true);
        let attempts = 0;

        const interval = setInterval(() => {
            attempts++;
            const courses = this.studentService.courses.value() ?? [];
            const singles = this.studentService.singleModules.value() ?? [];

            if (courses.length > 0 || singles.length > 0 || attempts > 40) {
                clearInterval(interval);
                this.findModuleInAvailableData(courses, singles);
            }
        }, 100);
    }

    private findModuleInAvailableData(courses: any[], singles: any[]) {
        let foundModule: any = null;

        if (this.isSingleModule()) {
            foundModule = singles.find(m => m?.id === this.moduleId || m?.moduleId === this.moduleId);
        } else {
            foundModule = this.searchCourses(courses);
        }

        if (!foundModule) {
            console.warn('Nie znaleziono modułu ścieżką z URL. Uruchamiam wyszukiwanie ratunkowe...');
            if (!this.isSingleModule()) {
                foundModule = singles.find(m => m?.id === this.moduleId || m?.moduleId === this.moduleId);
                if (foundModule) {
                    this.isSingleModule.set(true);
                }
            } else {
                foundModule = this.searchCourses(courses);
                if (foundModule) {
                    this.isSingleModule.set(false);
                }
            }
        }

        this.processFoundModule(foundModule);
    }

    private searchCourses(courses: any[]): any {
        for (const course of courses) {
            const m = course.modules?.find((mod: any) => mod?.id === this.moduleId || mod?.moduleId === this.moduleId);
            if (m) return m;
        }
        return null;
    }

    private processFoundModule(foundModule: any) {
        if (!foundModule) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error loading',
                detail: 'Module not found assigned to your account.'
            });
            this.loading.set(false);
            return;
        }

        this.moduleData.set(foundModule);

        const rawUrl = foundModule.url || foundModule.theaterItem?.url || '';

        if (rawUrl) {
            const safeUrl = this.getSafeYouTubeUrl(rawUrl);
            this.safeVideoUrl.set(safeUrl);
        } else {
            this.safeVideoUrl.set(null);
        }

        this.loading.set(false);
    }

    getSafeYouTubeUrl(url: string): SafeResourceUrl | null {
        if (!url) return null;
        
        const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
        const match = url.match(regExp);

        if (match && match[1]) {
            const embedUrl = `https://www.youtube.com/embed/${match[1]}`;
            return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
        }

        return null;
    }

    toggleComplete() {
        const mod = this.moduleData();
        if (!mod) return;

        const checkingAsCompleted = !mod.isCompleted;
        const action = this.isSingleModule()
            ? (mod.isCompleted ? this.studentService.uncompleteSingleModule(mod.id) : this.studentService.completeSingleModule(mod.id))
            : (mod.isCompleted ? this.studentService.uncompleteModule(mod.id) : this.studentService.completeModule(mod.id));

        action.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                if (checkingAsCompleted) {
                    this.triggerCelebration();
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Module finished!' });
                }
                
                if (this.isSingleModule()) {
                    this.studentService.reloadSingleModules();
                } else {
                    this.studentService.reloadCourses();
                }

                this.moduleData.update(m => m ? { ...m, isCompleted: checkingAsCompleted } : null);
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update status.' })
        });
    }

    goBack() {
        this.router.navigate(['/courses']);
    }

    private triggerCelebration() {
        const duration = 1500;
        const end = Date.now() + duration;
        (function frame() {
            confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
            confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
            if (Date.now() < end) requestAnimationFrame(frame);
        }());
    }
}