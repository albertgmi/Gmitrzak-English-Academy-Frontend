import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { LessonPanelService, LessonIrregularVerbSummaryDto } from '../../services/lesson-panel.service';
import { IrregularVerbDto } from '../../services/student-services/irregular-verbs.service';
import { LessonContextService } from '../../services/lesson-context.service';
import { AvatarComponent } from '../../other/avatar/avatar.component';

@Component({
  selector: 'app-lesson-irregular-verbs',
  standalone: true,
  imports: [
    CommonModule, TableModule, TagModule, ToastModule, ButtonModule,
    AvatarComponent, IconFieldModule, InputIconModule, InputTextModule,
    DialogModule, InputNumberModule, FormsModule
  ],
  providers: [MessageService],
  templateUrl: './lesson-irregular-verbs.component.html'
})
export class LessonIrregularVerbsComponent implements OnInit {
  private service = inject(LessonPanelService);
  private lessonContext = inject(LessonContextService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  activeStudent = this.lessonContext.activeStudent;
  data = signal<LessonIrregularVerbSummaryDto | null>(null);
  loading = signal(true);

  allVerbs = signal<IrregularVerbDto[]>([]);
  loadingAll = signal(true);

  editDialogVisible = signal(false);
  selectedVerb = signal<IrregularVerbDto | null>(null);
  newInterval = signal<number>(0);
  saving = signal(false);

  ngOnInit() {
    const id = this.lessonContext.studentId;
    if (!id) return;

    this.service.getIrregularVerbs(id).subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });

    this.service.getAllIrregularVerbs(id).subscribe({
      next: (verbs) => { this.allVerbs.set(verbs); this.loadingAll.set(false); },
      error: () => this.loadingAll.set(false)
    });
  }

  goToSwitchClient() {
    this.router.navigate(['/lesson/switch-client']);
  }

  openEditDialog(verb: IrregularVerbDto) {
    this.selectedVerb.set(verb);
    this.newInterval.set(verb.interval);
    this.editDialogVisible.set(true);
  }

  saveInterval() {
    const verb = this.selectedVerb();
    const studentId = this.lessonContext.studentId;

    if (!verb || !studentId || !verb.id) return;

    this.saving.set(true);
    const updatedInterval = this.newInterval();

    this.service.updateIrregularVerbInterval(studentId, verb.id, updatedInterval).subscribe({
      next: () => {
        this.allVerbs.update(verbs =>
          verbs.map(v => (v.id === verb.id ? { ...v, interval: updatedInterval } : v))
        );

        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Interval updated' });
        this.editDialogVisible.set(false);
        this.saving.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Update failed' });
        this.saving.set(false);
      }
    });
  }
}
