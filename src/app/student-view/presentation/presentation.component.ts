import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ModuleItemService } from '../../services/module.service';
import { StudentModuleDto } from '../../services/student-services/student.service';

@Component({
    selector: 'app-presentation',
    standalone: true,
    imports: [
        CommonModule, RouterModule, ButtonModule,
        DividerModule, ProgressSpinnerModule, TagModule, ToastModule
    ],
    providers: [MessageService],
    templateUrl: './presentation.component.html'
})
export class PresentationComponent implements OnInit {
    private route          = inject(ActivatedRoute);
    private moduleService  = inject(ModuleItemService);
    private messageService = inject(MessageService);

    module      = signal<StudentModuleDto | null>(null);
    loading     = signal(true);
    markingDone = signal(false);
    completed   = signal(false);

    ngOnInit() {
      const moduleId = Number(this.route.snapshot.paramMap.get('moduleId'));

      if (!moduleId || isNaN(moduleId)) {
          this.loading.set(false);
          this.messageService.add({
              severity: 'error', summary: 'Error',
              detail: 'Invalid module ID.', life: 3000
          });
          return;
      }

      this.load(moduleId);
  }

    private load(moduleId: number) {
        this.loading.set(true);
        this.moduleService.getStudentModule(moduleId).subscribe({
            next: (m) => {
                this.module.set(m);
                this.completed.set(m.isCompleted);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error', summary: 'Error',
                    detail: 'Could not load presentation.', life: 3000
                });
            }
        });
    }

    markAsDone() {
        const m = this.module();
        if (!m || this.markingDone() || this.completed()) return;
        
        this.markingDone.set(true);
        
        this.moduleService.completeStudentModule(m.moduleId).subscribe({
            next: () => {
                this.completed.set(true);
                this.markingDone.set(false);
                this.messageService.add({
                    severity: 'success', summary: 'Completed',
                    detail: 'Presentation marked as done.', life: 3000
                });
            },
            error: () => {
                this.markingDone.set(false);
                this.messageService.add({
                    severity: 'error', summary: 'Error',
                    detail: 'Could not complete module.', life: 3000
                });
            }
        });
    }
}