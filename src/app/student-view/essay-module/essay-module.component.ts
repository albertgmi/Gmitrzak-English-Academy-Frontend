import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { QuillModule } from 'ngx-quill';
import { FormsModule } from '@angular/forms';
import { EssayService, EssayModuleDto } from '../../services/essay.service';
import { TagModule } from 'primeng/tag';

@Component({
    selector: 'app-essay-module',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, ToastModule, QuillModule, TagModule],
    providers: [MessageService],
    templateUrl: './essay-module.component.html'
})
export class EssayModuleComponent implements OnInit {
    private route        = inject(ActivatedRoute);
    private router       = inject(Router);
    private essayService = inject(EssayService);
    private messageService = inject(MessageService);

    moduleData   = signal<EssayModuleDto | null>(null);
    content      = signal('');
    loading      = signal(true);
    submitting   = signal(false);
    submitted    = signal(false);

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
                    this.content.set(data.existingEssay.content);
                }
                if (data.existingEssay?.isSubmitted) {
                    this.submitted.set(true);
                }
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    submit() {
        const data = this.moduleData();
        if (!data || !this.content().trim()) return;

        this.submitting.set(true);
        this.essayService.submit(data.moduleId, this.content()).subscribe({
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