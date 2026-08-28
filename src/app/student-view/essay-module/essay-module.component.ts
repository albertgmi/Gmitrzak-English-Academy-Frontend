import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { QuillModule } from 'ngx-quill';
import { FormsModule } from '@angular/forms';
import { EssayService, EssayModuleDto } from '../../services/essay.service';
import { EssayDetectorService, EssayTelemetry } from '../../services/essay-detector.service';
import { TagModule } from 'primeng/tag';

@Component({
    selector: 'app-essay-module',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, ToastModule, QuillModule, TagModule],
    providers: [MessageService],
    templateUrl: './essay-module.component.html'
})
export class EssayModuleComponent implements OnInit, OnDestroy {
    private route        = inject(ActivatedRoute);
    private router       = inject(Router);
    private essayService = inject(EssayService);
    private essayDetectorService = inject(EssayDetectorService);
    private messageService = inject(MessageService);

    moduleData   = signal<EssayModuleDto | null>(null);
    content      = signal('');
    loading      = signal(true);
    submitting   = signal(false);
    submitted    = signal(false);

    // Telemetry signals
    pastedWordCount = signal(0);
    isPasteDetected = signal(false);
    activeWritingTimeSeconds = signal(0);
    private timerInterval: any = null;
    private startTime: number | null = null;

    wordCount = computed(() => {
        const raw = this.content();
        if (!raw) return 0;
        const text = raw.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').trim();
        if (!text) return 0;
        return text.split(/\s+/).filter(w => w.length > 0).length;
    });

    pastePercentage = computed(() => {
        const total = this.wordCount();
        if (total === 0) return 0;
        return Math.min(100, Math.round((this.pastedWordCount() / total) * 100));
    });

    aiAnalysis = computed(() => {
        const raw = this.content();
        const telemetry: Partial<EssayTelemetry> = {
            pastedWords: this.pastedWordCount(),
            typedWords: Math.max(0, this.wordCount() - this.pastedWordCount()),
            totalTimeSeconds: this.activeWritingTimeSeconds(),
            isPasteDetected: this.isPasteDetected(),
            pastePercentage: this.pastePercentage()
        };
        return this.essayDetectorService.analyzeEssay(raw, telemetry);
    });

    showAiWarning = computed(() => {
        const analysis = this.aiAnalysis();
        return analysis.riskLevel === 'high' || analysis.riskLevel === 'medium' || this.pastePercentage() >= 40;
    });

    quillModules = {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            [{ 'align': [] }],
            ['clean']
        ]
    };

    ngOnInit() {
        const moduleId = Number(this.route.snapshot.paramMap.get('moduleId'));
        this.essayService.getModule(moduleId).subscribe({
            next: (data) => {
                this.moduleData.set(data);
                if (data.existingEssay?.content) {
                    const { cleanContent } = this.essayDetectorService.extractTelemetry(data.existingEssay.content);
                    this.content.set(cleanContent);
                }
                if (data.existingEssay?.isSubmitted) {
                    this.submitted.set(true);
                }
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });

        this.startTimer();
    }

    ngOnDestroy() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    private startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            if (this.content().trim() && !this.submitted()) {
                const elapsed = Math.round((Date.now() - (this.startTime ?? Date.now())) / 1000);
                this.activeWritingTimeSeconds.set(elapsed);
            }
        }, 1000);
    }

    onEditorCreated(quill: any) {
        if (!quill || !quill.root) return;
        quill.root.addEventListener('paste', (e: ClipboardEvent) => {
            const text = e.clipboardData?.getData('text/plain') || '';
            if (text.trim().length > 0) {
                const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
                this.pastedWordCount.update(c => c + words);
                this.isPasteDetected.set(true);
            }
        });
    }

    submit() {
        const data = this.moduleData();
        if (!data || !this.content().trim()) return;

        const totalWords = this.wordCount();
        const telemetry: EssayTelemetry = {
            pastedWords: this.pastedWordCount(),
            typedWords: Math.max(0, totalWords - this.pastedWordCount()),
            totalTimeSeconds: this.activeWritingTimeSeconds(),
            isPasteDetected: this.isPasteDetected(),
            pastePercentage: this.pastePercentage()
        };

        const contentWithTelemetry = this.essayDetectorService.embedTelemetry(this.content(), telemetry);

        this.submitting.set(true);
        this.essayService.submit(data.moduleId, contentWithTelemetry).subscribe({
            next: () => {
                this.submitted.set(true);
                this.submitting.set(false);
                this.messageService.add({
                    severity: 'success',
                    summary:  'Submitted!',
                    detail:   'Your essay has been submitted successfully.',
                    life:     3000
                });
                setTimeout(() => this.router.navigate(['/courses']), 2000);
            },
            error: () => this.submitting.set(false)
        });
    }
}