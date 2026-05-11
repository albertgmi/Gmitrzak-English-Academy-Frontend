import { Component, computed, inject, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { RatingModule } from 'primeng/rating';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { User, UserService } from '../../services/user.service';

interface Column {
  field: string;
  header: string;
  customExportHeader?: string;
}

interface ExportColumn {
  title: string;
  dataKey: string;
}

@Component({
  selector: 'user-crud',
  templateUrl: './user-crud.component.html',
  styleUrl: './user-crud.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    FormsModule,
    ButtonModule,
    RippleModule,
    ToastModule,
    ToolbarModule,
    RatingModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    RadioButtonModule,
    InputNumberModule,
    DialogModule,
    TagModule,
    InputIconModule,
    IconFieldModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, UserService, ConfirmationService]
})
export class UserCrudComponent implements OnInit {
  userService = inject(UserService);
  public router = inject(Router);

  userDialog: boolean = false;
  user!: User;
  selectedUsers!: User[] | null;
  submitted: boolean = false;
  roles!: any[];
  exportColumns!: ExportColumn[];
  cols!: Column[];

  @ViewChild('dt') dt!: Table;

  displayUsers = computed(() => {
    const allUsers = this.userService.users.value() || [];
    const isInactiveRoute = this.router.url.includes('inactive');
    
    if (isInactiveRoute) {
      return allUsers.filter(u => u.isActive === false);
    } else {
      return allUsers.filter(u => u.isActive === true);
    }
  });

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.roles = [
      { label: 'admin', value: 'admin' },
      { label: 'user', value: 'user' }
    ];

    this.cols = [
      { field: 'email', header: 'Email' },
      { field: 'username', header: 'Username' },
      { field: 'role', header: 'Role' }
    ];

    this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
  }

  exportCSV() {
    this.dt.exportCSV();
  }

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  openNew() {
    this.user = { id: 0 };
    this.submitted = false;
    this.userDialog = true;
  }

  editUser(user: User) {
    this.user = { ...user };
    this.userDialog = true;
  }

  deleteSelectedUsers() {
    if (!this.selectedUsers || this.selectedUsers.length === 0) return;

    const ids = this.selectedUsers.map(user => user.id);

    this.confirmationService.confirm({
      message: 'Are you sure you want to delete the selected users?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.userService.deleteManyUsers(ids).subscribe({
          next: () => {
            this.userService.users.reload();
            this.selectedUsers = null;
            this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Users Deleted', life: 3000 });
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete users', life: 3000 });
          }
        });
      }
    });
  }

  deleteUser(user: User) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete ' + user.username + '?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.userService.deleteUser(user.id);
      }
    });
  }

  hideDialog() {
    this.userDialog = false;
    this.submitted = false;
  }

  saveUser() {
    this.submitted = true;
    if (!this.user.email || !this.user.username) return;

    this.userService.updateUser(this.user.id, {
      username: this.user.username,
      email: this.user.email,
      role: this.user.role,
      password: this.user.password || undefined
    });

    this.userDialog = false;
    this.submitted = false;
  }
}