import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { MessageService } from 'primeng/api';
import {ToastModule} from 'primeng/toast';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  providers: [MessageService],
  imports: [CommonModule, ToastModule]
})
export class ProfileComponent implements OnInit {
  user: any;

  constructor(
    private userService: UserService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.userService.getProfile().subscribe(
      (data) => this.user = data,
      (error) => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load profile.' })
    );
  }
}
