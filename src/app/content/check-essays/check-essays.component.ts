import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { QuillModule } from 'ngx-quill';
import { EssayService, UserEssayDto } from '../../services/essay.service';

type FilterType = 'all' | 'pending' | 'reviewed';
type SeverityType = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

@Component({
    selector: 'app-check-essays',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, TagModule,
        ToastModule, SelectModule, InputTextModule,
        DialogModule, QuillModule
    ],
    providers: [MessageService],
    templateUrl: './check-essays.component.html'
})
export class CheckEssaysComponent implements OnInit {
    private essayService   = inject(EssayService);
    private messageService = inject(MessageService);

    essays       = signal<UserEssayDto[]>([]);
    loading      = signal(true);
    selectedEssay = signal<UserEssayDto | null>(null);
    adminContent = signal('');
    saving       = signal(false);
    downloading  = signal<number | null>(null);
    filter       = signal<FilterType>('all');
    search       = signal('');

    quillModules = {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'align': [] }],
            ['clean']
        ]
    };

    filterOptions = [
        { label: 'All essays', value: 'all' },
        { label: 'Pending review', value: 'pending' },
        { label: 'Reviewed', value: 'reviewed' }
    ];

    filtered = computed(() => {
        const q = this.search().toLowerCase();
        return this.essays()
            .filter(e => {
                const matchFilter =
                    this.filter() === 'all' ||
                    (this.filter() === 'pending' && !e.isReviewed) ||
                    (this.filter() === 'reviewed' && e.isReviewed);
                const matchSearch = !q ||
                    e.username.toLowerCase().includes(q) ||
                    e.moduleName.toLowerCase().includes(q);
                return matchFilter && matchSearch;
            });
    });

    pendingCount = computed(() =>
        this.essays().filter(e => !e.isReviewed).length
    );

    ngOnInit() {
        this.essayService.getAllForAdmin().subscribe({
            next: data => { this.essays.set(data); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    openReview(essay: UserEssayDto) {
        this.selectedEssay.set(essay);
        this.adminContent.set(essay.adminContent ?? essay.content);
    }

    saveReview() {
        const essay = this.selectedEssay();
        if (!essay) return;

        this.saving.set(true);
        this.essayService.review(essay.id, this.adminContent()).subscribe({
            next: (updated) => {
                this.essays.update(list =>
                    list.map(e => e.id === essay.id ? updated : e)
                );
                this.messageService.add({
                    severity: 'success',
                    summary:  'Saved',
                    detail:   'Essay review saved.',
                    life:     3000
                });
                this.saving.set(false);
                this.selectedEssay.set(null);
            },
            error: () => this.saving.set(false)
        });
    }

    download(essay: UserEssayDto) {
        this.downloading.set(essay.id);
        this.essayService.exportDocx(essay.id).subscribe({
            next: (blob) => {
                const url = URL.createObjectURL(blob);
                const a   = document.createElement('a');
                a.href    = url;
                a.download = `essay_${essay.username}_${essay.moduleName}.docx`
                    .replace(/\s+/g, '_');
                a.click();
                URL.revokeObjectURL(url);
                this.downloading.set(null);
            },
            error: () => this.downloading.set(null)
        });
    }

    statusSeverity(e: UserEssayDto): SeverityType {
        return e.isReviewed ? 'success' : 'warn';
    }
}