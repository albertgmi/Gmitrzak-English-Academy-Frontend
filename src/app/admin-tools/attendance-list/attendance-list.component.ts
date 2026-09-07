import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AttendanceService, AttendanceDto } from '../../services/attendance.service';
import { AvatarComponent } from '../../other/avatar/avatar.component';

export interface AttendanceGroup {
    dateKey: string;
    dateFormatted: string;
    records: AttendanceDto[];
    totalDuration: number;
}

@Component({
    selector: 'app-attendance-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        TagModule,
        ToastModule,
        ConfirmDialogModule,
        InputTextModule,
        SelectButtonModule,
        CardModule,
        IconFieldModule,
        InputIconModule,
        AvatarComponent
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './attendance-list.component.html',
    styleUrl: './attendance-list.component.scss'
})
export class AttendanceListComponent implements OnInit {
    private attendanceService = inject(AttendanceService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    attendances = signal<AttendanceDto[]>([]);
    loading = signal(true);

    searchTerm = signal('');
    selectedTypeFilter = signal<'ALL' | 'SCHEDULED' | 'MAKEUP'>('ALL');

    typeFilterOptions = [
        { label: 'All', value: 'ALL' },
        { label: 'Scheduled', value: 'SCHEDULED' },
        { label: 'Makeup', value: 'MAKEUP' }
    ];

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.loading.set(true);
        this.attendanceService.getAllAttendance().subscribe({
            next: (data) => {
                this.attendances.set(data || []);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error loading attendance list:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load attendance list.',
                    life: 3000
                });
                this.loading.set(false);
            }
        });
    }

    filteredAttendances = computed(() => {
        const query = this.searchTerm().trim().toLowerCase();
        const typeFilter = this.selectedTypeFilter();
        const raw = this.attendances();

        return raw.filter(item => {
            const matchesType = typeFilter === 'ALL' || item.type === typeFilter;
            const studentName = (item.username || `User #${item.userId}`).toLowerCase();
            const matchesSearch = !query || studentName.includes(query) || item.userId.toString().includes(query);
            return matchesType && matchesSearch;
        });
    });

    groupedAttendance = computed<AttendanceGroup[]>(() => {
        const items = this.filteredAttendances();
        const groupMap = new Map<string, AttendanceDto[]>();

        items.forEach(item => {
            const dateObj = new Date(item.createdAt);
            const dateKey = !isNaN(dateObj.getTime())
                ? dateObj.toISOString().split('T')[0]
                : 'Other date';

            if (!groupMap.has(dateKey)) {
                groupMap.set(dateKey, []);
            }
            groupMap.get(dateKey)!.push(item);
        });

        const result: AttendanceGroup[] = [];
        const sortedKeys = Array.from(groupMap.keys()).sort((a, b) => b.localeCompare(a));

        sortedKeys.forEach(dateKey => {
            const records = groupMap.get(dateKey)!;
            records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            const totalDuration = records.reduce((sum, r) => sum + (r.duration || 0), 0);

            result.push({
                dateKey,
                dateFormatted: this.formatDateHeader(dateKey),
                records,
                totalDuration
            });
        });

        return result;
    });

    totalLessonsCount = computed(() => this.filteredAttendances().length);

    totalMinutesCount = computed(() =>
        this.filteredAttendances().reduce((sum, r) => sum + (r.duration || 0), 0)
    );

    scheduledCount = computed(() =>
        this.filteredAttendances().filter(r => r.type === 'SCHEDULED').length
    );

    makeupCount = computed(() =>
        this.filteredAttendances().filter(r => r.type === 'MAKEUP').length
    );

    formatDuration(minutes: number): string {
        if (!minutes || minutes <= 0) return '0 min';
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hrs > 0 && mins > 0) {
            return `${hrs}h ${mins}min`;
        } else if (hrs > 0) {
            return `${hrs}h`;
        }
        return `${mins} min`;
    }

    formatDateHeader(dateKey: string): string {
        if (dateKey === 'Other date') return dateKey;
        const [year, month, day] = dateKey.split('-').map(Number);
        if (!year || !month || !day) return dateKey;

        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    confirmDelete(record: AttendanceDto) {
        const studentName = record.username || `User #${record.userId}`;
        const dateStr = new Date(record.createdAt).toLocaleDateString('en-US');

        this.confirmationService.confirm({
            message: `Are you sure you want to delete the attendance record for ${studentName} from ${dateStr}?`,
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Delete',
            rejectLabel: 'Cancel',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.attendanceService.deleteAttendance(record.id).subscribe({
                    next: () => {
                        this.attendances.update(list => list.filter(a => a.id !== record.id));
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Deleted',
                            detail: 'Attendance record successfully deleted.',
                            life: 3000
                        });
                    },
                    error: (err) => {
                        console.error('Error deleting attendance record:', err);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to delete attendance record.',
                            life: 3000
                        });
                    }
                });
            }
        });
    }
}
