import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { QuillModule } from 'ngx-quill';
import { FormsModule } from '@angular/forms';
import { EssayService, EssayModuleDto } from '../../services/essay.service';
import { EssayDetectorService, EssayTelemetry } from '../../services/essay-detector.service';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { ChipModule } from 'primeng/chip';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DividerModule } from 'primeng/divider';

@Component({
    selector: 'app-essay-module',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        ToastModule,
        QuillModule,
        TagModule,
        CardModule,
        MessageModule,
        ProgressBarModule,
        SkeletonModule,
        ChipModule,
        TooltipModule,
        ConfirmDialogModule,
        DividerModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './essay-module.component.html',
    styleUrls: ['./essay-module.component.scss']
})
export class EssayModuleComponent implements OnInit, OnDestroy {
    private route        = inject(ActivatedRoute);
    private router       = inject(Router);
    private essayService = inject(EssayService);
    private essayDetectorService = inject(EssayDetectorService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

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

    targetWordRange = computed(() => {
        const prompt = this.moduleData()?.essayPrompt;
        if (!prompt) return null;

        // Match range e.g. "200-300 words" or "200 - 300 words"
        const rangeMatch = prompt.match(/(\d+)\s*[-–—\s]+\s*(\d+)\s*words?/i);
        if (rangeMatch) {
            const min = parseInt(rangeMatch[1], 10);
            const max = parseInt(rangeMatch[2], 10);
            return { min, max, text: `${min}-${max} words` };
        }

        // Match single target e.g. "250 words"
        const singleMatch = prompt.match(/(\d+)\s*words?/i);
        if (singleMatch) {
            const target = parseInt(singleMatch[1], 10);
            return { min: Math.round(target * 0.8), max: target, text: `~${target} words` };
        }

        return null;
    });

    wordProgressPercentage = computed(() => {
        const target = this.targetWordRange();
        if (!target) return 0;
        const current = this.wordCount();
        return Math.min(100, Math.round((current / target.max) * 100));
    });

    formattedWritingTime = computed(() => {
        const totalSeconds = this.activeWritingTimeSeconds();
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        if (mins === 0) {
            return `${secs}s`;
        }
        return `${mins}m ${secs}s`;
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

    copyPromptText() {
        const prompt = this.moduleData()?.essayPrompt;
        if (!prompt) return;
        navigator.clipboard.writeText(prompt);
        this.messageService.add({
            severity: 'info',
            summary: 'Copied',
            detail: 'Essay prompt copied to clipboard.',
            life: 2000
        });
    }

    goBack() {
        this.router.navigate(['/student/my-essays']);
    }

    confirmSubmit() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to submit your essay? You will not be able to edit it after submission.',
            header: 'Submit Essay Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Yes, Submit Essay',
            rejectLabel: 'Cancel',
            acceptButtonStyleClass: 'p-button-primary',
            rejectButtonStyleClass: 'p-button-outlined p-button-secondary',
            accept: () => {
                this.submit();
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
                setTimeout(() => this.router.navigate(['/student/my-essays']), 2000);
            },
            error: () => this.submitting.set(false)
        });
    }
}