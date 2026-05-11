import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { ProfileDto, ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile-detail',
  templateUrl: './profile-detail.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    CheckboxModule,
    ToastModule,
    MessageModule
  ],
  providers: [MessageService]
})
export class ProfileDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private profileService = inject(ProfileService);
  private messageService = inject(MessageService);
  private authService = inject(AuthService);

  // Po wdrożeniu zmiana na adres swojego serwera produkcyjnego
  readonly apiUrl = 'https://localhost:7100'; 

  profile: ProfileDto | null = null;
  editMode = false;
  userId!: number;

  selectedFile: File | null = null;
  avatarPreview: string | null = null;
  avatarError: string | null = null;

  semesters = Array.from({ length: 20 }, (_, i) => i + 1);
  englishLevels = [
    { label: 'Basic', value: 'Basic' },
    { label: 'Communicative', value: 'Communicative' },
    { label: 'Advanced', value: 'Advanced' }
  ];

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
        const id = params.get('userId');
        if (id) {
            this.userId = Number(id);
            this.loadProfile();
        }
    });
}

  loadProfile() {
    this.profileService.getProfile(this.userId).subscribe({
      next: (data) => this.profile = data,
      error: () => this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Could not load profile'
      })
    });
  }

  toggleEdit() {
    if (!this.isAdmin) return;

    this.editMode = !this.editMode;
    if (!this.editMode) {
      this.loadProfile();
      this.clearSelectedFile();
    }
  }

  onFileSelected(event: Event) {
    this.avatarError = null;
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      this.avatarError = 'Only JPG, JPEG and PNG files are allowed';
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => this.avatarPreview = e.target?.result as string;
    reader.readAsDataURL(file);
  }

  clearSelectedFile() {
    this.selectedFile = null;
    this.avatarPreview = null;
    this.avatarError = null;
  }

  onAvatarError(event: Event) {
    if (this.profile) {
      this.profile.avatarUrl = '';
    }
  }

  get isAdmin(): boolean {
    return this.authService.getRole() === 'Admin';
  }

  save() {
    if (!this.profile || !this.isAdmin) return;
    if (this.selectedFile) {
      this.profileService.uploadAvatar(this.userId, this.selectedFile).subscribe({
        next: (url) => {
          this.profile!.avatarUrl = url;
          this.clearSelectedFile();
          this.saveProfileData();
        },
        error: () => this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Could not upload avatar'
        })
      });
    } else {
      this.saveProfileData();
    }
  }

  private saveProfileData() {
    this.profileService.updateProfile(this.userId, this.profile!).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Profile updated'
        });
        this.editMode = false;
      },
      error: () => this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Could not save profile'
      })
    });
  }

  get initials(): string {
    if (!this.profile?.username) return '?';
    return this.profile.username
      .split(' ')
      .map(w => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  goBack() {
    this.router.navigate(['/profiles']);
  }
}