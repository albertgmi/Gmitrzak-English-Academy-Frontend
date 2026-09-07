import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { IrregularVerbsService, IrregularVerbDto } from '../../services/student-services/irregular-verbs.service';

type Tab = 'all' | 'today' | 'leeches' | 'search';

@Component({
  selector: 'app-irregular-verbs-panel',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule,
    InputTextModule, IconFieldModule, InputIconModule,
    TagModule, ToastModule, RouterModule
  ],
  providers: [MessageService],
  templateUrl: './irregular-verbs-panel.component.html'
})
export class IrregularVerbsPanelComponent implements OnInit {
  private irregularVerbsService = inject(IrregularVerbsService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);

  activeTab = signal<Tab>('all');

  allVerbs = this.irregularVerbsService.allIrregularVerbsResource;
  studiedToday = signal<IrregularVerbDto[]>([]);
  leeches = signal<IrregularVerbDto[]>([]);
  searchResults = signal<IrregularVerbDto[]>([]);

  searchQuery = signal('');
  loadingTab = signal(false);

  tabs = [
    { id: 'all', label: 'All Verbs', icon: 'pi pi-list-check' },
    { id: 'today', label: 'Studied today', icon: 'pi pi-calendar' },
    { id: 'leeches', label: 'Leeches', icon: 'pi pi-exclamation-triangle' },
    { id: 'search', label: 'Search', icon: 'pi pi-search' }
  ];

  ngOnInit() {
    this.irregularVerbsService.allIrregularVerbsResource.reload();

    this.route.queryParams.subscribe(params => {
      const tabParam = params['tab'];
      if (tabParam && ['all', 'today', 'leeches', 'search'].includes(tabParam)) {
        this.setTab(tabParam as Tab);
      }
    });
  }

  setTab(tabId: Tab) {
    this.activeTab.set(tabId);
    if (tabId === 'today' && !this.studiedToday().length) {
      this.fetchTabData(this.irregularVerbsService.getStudiedToday(), this.studiedToday, 'today\'s reviews');
    }
    if (tabId === 'leeches' && !this.leeches().length) {
      this.fetchTabData(this.irregularVerbsService.getLeeches(), this.leeches, 'leeches');
    }
  }

  private fetchTabData(observable: any, targetSignal: any, label: string) {
    this.loadingTab.set(true);
    observable.subscribe({
      next: (d: any) => {
        targetSignal.set(d);
        this.loadingTab.set(false);
      },
      error: () => {
        this.loadingTab.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: `Failed to load: ${label}` });
      }
    });
  }

  search() {
    const q = this.searchQuery().trim();
    if (!q) return;
    this.loadingTab.set(true);
    this.irregularVerbsService.search(q).subscribe({
      next: (d) => {
        this.searchResults.set(d);
        this.loadingTab.set(false);
      },
      error: () => {
        this.loadingTab.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to search irregular verbs' });
      }
    });
  }

  speak(text: string, event?: Event) {
    event?.stopPropagation();
    if (typeof speechSynthesis === 'undefined') return;

    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    speechSynthesis.speak(utterance);
  }
}
