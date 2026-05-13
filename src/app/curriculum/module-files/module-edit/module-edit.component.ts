import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ModuleItem, ModuleItemService, MatrixSimple, UpdateModuleRequest } from '../../../services/module.service';
import { MatrixService } from '../../../services/matrix.service'; // upewnij się co do ścieżki

@Component({
    selector: 'app-module-edit',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule,
        ButtonModule, InputTextModule, TextareaModule,
        CheckboxModule, SelectModule, ToastModule
    ],
    providers: [MessageService],
    templateUrl: './module-edit.component.html'
})
export class ModuleEditComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private moduleService = inject(ModuleItemService);
    private matrixService = inject(MatrixService);
    private messageService = inject(MessageService);

    moduleId!: number;
    editedModule = signal<ModuleItem | null>(null);
    submitted = false;
    loading = false;
    selectedMatrixToAdd = signal<MatrixSimple | null>(null);
    weekNumber = signal<number>(1);
    dayOfWeek = signal<number>(1);

    availableDays = computed(() => {
        const matrix = this.selectedMatrixToAdd();
        const interval = matrix?.refreshIntervalDays || 7;
        
        return Array.from({ length: interval }, (_, i) => ({
            label: `Day ${i + 1}`,
            value: i + 1
        }));
    });

    availableMatrices = computed(() => {
        const all = this.matrixService.matrices.value() ?? [];
        const assigned = this.editedModule()?.matrices ?? [];
        return all.filter(m => !assigned.some(a => a.id === m.id));
    });

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.moduleId = +id;
            this.loadModule();
        }
    }

    loadModule() {
        const module = this.moduleService.modules.value()?.find(m => m.id === this.moduleId);
        if (module) {
            this.editedModule.set({ ...module, matrices: [...(module.matrices ?? [])] });
        } else {
            this.goBack();
        }
    }

    assignMatrix() {
        const matrix = this.selectedMatrixToAdd();
        const current = this.editedModule();
        const week = this.weekNumber();
        const day = this.dayOfWeek();

        if (!matrix || !current) return;

        this.moduleService.assignMatrix(this.moduleId, matrix.id, week, day).subscribe({
            next: () => {
                this.editedModule.set({ 
                    ...current, 
                    matrices: [...current.matrices, matrix] 
                });
                this.selectedMatrixToAdd.set(null);
                this.messageService.add({ severity: 'success', summary: 'Assigned', detail: 'Added to matrix schedule.' });
                this.moduleService.reloadModules();
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to assign matrix.' })
        });
    }

    removeMatrix(matrix: MatrixSimple) {
        const current = this.editedModule();
        if (!current) return;

        this.moduleService.removeMatrix?.(this.moduleId, matrix.id).subscribe({
            next: () => {
                this.editedModule.set({
                    ...current,
                    matrices: current.matrices.filter(m => m.id !== matrix.id)
                });
                this.moduleService.reloadModules();
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to remove matrix.' })
        });
    }

    save() {
      const current = this.editedModule();
      
      if (!current?.name?.trim()) {
          this.submitted = true;
          return;
      }

      this.loading = true;

      const request: UpdateModuleRequest = {
          name: current.name,
          description: current.description,
          isHidden: current.isHidden
      };

      this.moduleService.updateModule(this.moduleId, request).subscribe({
          next: () => {
              this.moduleService.reloadModules();
              this.messageService.add({ 
                  severity: 'success', 
                  summary: 'Saved', 
                  detail: 'Module updated successfully.' 
              });
              setTimeout(() => this.goBack(), 1000);
          },
          error: (err) => {
              this.loading = false;
              console.error('Update error:', err);
              this.messageService.add({ 
                  severity: 'error', 
                  summary: 'Error', 
                  detail: 'Update failed. Check if name is unique.' 
              });
          }
      });
  }

    goBack() {
        this.router.navigate(['/curriculum/modules']);
    }
    
    onMatrixChange(matrix: MatrixSimple | null) {
        this.selectedMatrixToAdd.set(matrix);
        if (matrix && this.dayOfWeek() > matrix.refreshIntervalDays) {
            this.dayOfWeek.set(1);
        }
    }
}