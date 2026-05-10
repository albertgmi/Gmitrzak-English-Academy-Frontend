import {Component, computed, inject, OnInit, signal, ViewChild} from '@angular/core';
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
import { HttpClient } from '@angular/common/http';

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

  userDialog: boolean = false;

  users = this.userService.users;

  user!: User;

  selectedUsers!: User[] | null;

  submitted: boolean = false;

  roles!: any[];

  @ViewChild('dt') dt!: Table;

  exportColumns!: ExportColumn[];

  cols!: Column[];

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  exportCSV() {
    this.dt.exportCSV();
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {

    this.roles = [
      { label: 'admin', value: 'admin' },
      { label: 'user', value: 'user' }
    ];

    this.cols = [
      { field: 'email', header: 'email' },
      { field: 'username', header: 'username' },
      { field: 'role', header: 'role' }
    ];

    this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
  }

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  openNew() {
    this.user = {id: 0};
    this.submitted = false;
    this.userDialog = true;
  }

  editUser(product: User) {
    this.user = { ...product };
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
                      this.messageService.add({ 
                          severity: 'success', 
                          summary: 'Successful', 
                          detail: 'Users Deleted', 
                          life: 3000 
                      });
                  },
                  error: (err) => {
                      this.messageService.add({ 
                          severity: 'error', 
                          summary: 'Error', 
                          detail: 'Failed to delete users', 
                          life: 3000 
                      });
                  }
              });
          }
      });
  }

  hideDialog() {
    this.userDialog = false;
    this.submitted = false;
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
