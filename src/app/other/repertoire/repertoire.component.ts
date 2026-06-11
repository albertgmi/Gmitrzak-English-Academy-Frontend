import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TheaterService, RepertoireItemDto } from '../../services/theater.service';

type SeverityType = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

@Component({
    selector: 'app-repertoire',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, InputTextModule,
        IconFieldModule, InputIconModule, SelectModule, TagModule,
        ToolbarModule, ToastModule
    ],
    providers: [MessageService],
    templateUrl: './repertoire.component.html'
})
export class RepertoireComponent implements OnInit {
    private theaterService = inject(TheaterService);

    items = signal<RepertoireItemDto[]>([]);
    loading = signal(true);
    searchQuery = signal('');
    filterType = signal('');
    filterLevel = signal('');

    mediaTypes = [
        { label: 'All types', value: '' },
        { label: 'Movie',     value: 'Movie' },
        { label: 'YouTube',   value: 'YouTube' },
        { label: 'Podcast',   value: 'Podcast' },
        { label: 'Video',     value: 'Video' },
        { label: 'Book',      value: 'Book' },
        { label: 'Article',   value: 'Article' },
        { label: 'Other',     value: 'Other' }
    ];

    levels = [
        { label: 'All levels', value: '' },
        { label: 'Basic', value: 'Basic' },
        { label: 'Communicative', value: 'Communicative' },
        { label: 'Advanced', value: 'Advanced' }
    ];

    filtered = computed(() => {
        let result = this.items();
        const q = this.searchQuery().toLowerCase();
        const t = this.filterType();
        const l = this.filterLevel();

        if (q) result = result.filter(x =>
            x.title.toLowerCase().includes(q) ||
            x.description.toLowerCase().includes(q));
        if (t) result = result.filter(x => x.mediaType === t);
        if (l) result = result.filter(x => x.level === l);
        return result;
    });

    ngOnInit() {
        this.theaterService.getRepertoire().subscribe({
            next: (d) => { this.items.set(d); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    mediaTypeSeverity(type: string): SeverityType {
        const map: Record<string, SeverityType> = {
            Movie: 'info', YouTube: 'danger', Podcast: 'warn',
            Video: 'info', Book: 'success', Article: 'secondary', Other: 'secondary'
        };
        return map[type] ?? 'info';
    }

    clearFilters() {
        this.searchQuery.set('');
        this.filterType.set('');
        this.filterLevel.set('');
    }
}