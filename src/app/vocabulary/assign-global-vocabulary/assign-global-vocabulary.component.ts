import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ChipModule } from 'primeng/chip';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { VocabularyService, AssignVocabularyRequest, StudentLookup, VocabularyDto } from '../../services/vocabulary.service';

@Component({
    selector: 'app-assign-global-vocabulary',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        ChipModule,
        ToolbarModule,
        ToastModule,
        TooltipModule,
        SelectModule
    ],
    providers: [MessageService],
    templateUrl: './assign-global-vocabulary.component.html'})
export class AssignGlobalVocabularyComponent implements OnInit {
    private vocabularyService = inject(VocabularyService);
    private router = inject(Router);
    private messageService = inject(MessageService);

    students = signal<StudentLookup[]>([]);
    vocabularyItems = signal<VocabularyDto[]>([]);
    
    selectedStudent = signal<StudentLookup | null>(null);
    selectedVocabulary = signal<VocabularyDto[]>([]);
    
    isLoading = signal<boolean>(false);
    isSubmitting = signal<boolean>(false);
    submitted = false;

    ngOnInit(): void {
        this.loadInitialData();
    }

    loadInitialData(): void {
        this.isLoading.set(true);

        this.vocabularyService.getStudents().subscribe({
            next: (data: StudentLookup[]) => {
                this.students.set(data);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to fetch students list.',
                    life: 3000
                });
            }
        });

        this.vocabularyService.getVocabularyList().subscribe({
            next: (data: VocabularyDto[]) => {
                this.vocabularyItems.set(data);
                this.selectedVocabulary.set([]);
                this.isLoading.set(false);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to fetch vocabulary for assignment.',
                    life: 3000
                });
                this.isLoading.set(false);
            }
        });
    }

    save(): void {
        this.submitted = true;
        const student = this.selectedStudent();
        const selectedCards = this.selectedVocabulary();

        if (!student) return;
        if (selectedCards.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Warning',
                detail: 'Please select at least one item from the table.',
                life: 3000
            });
            return;
        }

        const idsToAssign = selectedCards
            .map(f => f.id)
            .filter((id): id is number => id !== undefined);

        this.executeAssignment(student.id, idsToAssign, `Successfully assigned ${idsToAssign.length} items to ${student.username}.`);
    }

    assignSingle(item: VocabularyDto): void {
        this.submitted = true;
        const student = this.selectedStudent();
        
        if (!student) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Selection Required',
                detail: 'Please select a student first before using quick assign.',
                life: 3000
            });
            return;
        }
        if (!item.id) return;

        this.executeAssignment(student.id, [item.id], `Vocabulary "${item.front}" assigned to ${student.username}.`);
    }

    private executeAssignment(studentId: number, ids: number[], successMessage: string): void {
        this.isSubmitting.set(true);

        const payload: AssignVocabularyRequest = {
            studentUserId: studentId,
            vocabularyIds: ids
        };

        this.vocabularyService.assignVocabularyToStudent(payload).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Assigned',
                    detail: successMessage,
                    life: 3000
                });
                this.isSubmitting.set(false);
                this.submitted = false;
                this.selectedVocabulary.set([]);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to assign vocabulary. Server error.',
                    life: 3000
                });
                this.isSubmitting.set(false);
            }
        });
    }

    cancel(): void {
        this.router.navigate(['/system/global-vocabulary']);
    }

    onGlobalFilter(table: any, event: Event): void {
        const element = event.target as HTMLInputElement;
        if (element) {
            table.filterGlobal(element.value, 'contains');
        }
    }
}