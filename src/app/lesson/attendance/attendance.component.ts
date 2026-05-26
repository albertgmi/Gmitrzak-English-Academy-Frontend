import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AttendanceService, AttendanceDto } from '../../services/attendance.service';
import { LessonContextService } from '../../services/lesson-context.service';
import { AvatarComponent } from '../../other/avatar/avatar.component';

@Component({
    selector: 'app-attendance',
    standalone: true,
    imports: [
        CommonModule, 
        FormsModule, 
        TableModule, 
        ButtonModule,
        InputNumberModule, 
        SelectButtonModule,
        ToastModule, 
        ConfirmDialogModule, 
        AvatarComponent
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './attendance.component.html'
})
export class AttendanceComponent implements OnInit {
    private service = inject(AttendanceService);
    private lessonContext = inject(LessonContextService);
    private router = inject(Router);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    activeStudent = this.lessonContext.activeStudent;
    attendances = signal<AttendanceDto[]>([]);
    loading = signal(true);
    saving = signal(false);

    selectedType = signal<'SCHEDULED' | 'MAKEUP'>('SCHEDULED');
    duration = signal<number | null>(null);

    lessonTypeOptions = [
        { label: 'Scheduled', value: 'SCHEDULED' },
        { label: 'Makeup', value: 'MAKEUP' }
    ];

    ngOnInit() {
        const id = this.lessonContext.studentId;
        if (!id) return;
        this.load(id);
    }

    load(id: number) {
        this.loading.set(true);
        this.service.getAttendance(id).subscribe({
            next: (data) => { 
                this.attendances.set(data); 
                this.loading.set(false); 
            },
            error: () => this.loading.set(false)
        });
    }

    add() {
        const id = this.lessonContext.studentId;
        const currentDuration = this.duration();
        
        if (!id || !currentDuration || currentDuration <= 0) return;
        
        this.saving.set(true);
        this.service.addAttendance({
            userId: id,
            type: this.selectedType(),
            duration: currentDuration
        }).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Attendance Logged', life: 3000
                });
                this.duration.set(null);
                this.saving.set(false);
                this.load(id);
            },
            error: () => this.saving.set(false)
        });
    }

    confirmDelete(attendance: AttendanceDto) {
        const targetDate = new Date(attendance.createdAt).toLocaleDateString();
        
        this.confirmationService.confirm({
            message: `Are you sure you want to delete the attendance log from ${targetDate}?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.service.deleteAttendance(attendance.id).subscribe({
                    next: () => {
                        this.attendances.update(list => list.filter(a => a.id !== attendance.id));
                        this.messageService.add({ severity: 'success', summary: 'Record Deleted', life: 3000 });
                    }
                });
            }
        });
    }

    goToSwitchClient() { 
        this.router.navigate(['/lesson/switch-client']); 
    }
}