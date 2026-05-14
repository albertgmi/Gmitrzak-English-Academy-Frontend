import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, AppMenuitem, RouterModule],
  template: `<ul class="layout-menu">
    <ng-container *ngFor="let item of model; let i = index">
      <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
      <li *ngIf="item.separator" class="menu-separator"></li>
    </ng-container>
  </ul>`
})
export class AppMenu implements OnInit {
  authService = inject(AuthService);
  model: MenuItem[] = [];

  ngOnInit() {
    const role = this.authService.getRole();
    const userId = this.authService.getUserId();
    this.model = this.buildMenu(role, userId);
  }

  private buildMenu(role: string | null, userId: number | null): MenuItem[] {
    const base: MenuItem[] = [
      {
        label: 'Home',
        items: [
          { label: 'Dashboard', icon: 'pi pi-home', routerLink: ['/'] }
        ]
      }
    ];

    const profileLink = userId ? ['/profiles', userId] : ['/login'];

    const account: MenuItem = {
      label: 'Account',
      items: [
        { 
          label: 'Profile', 
          icon: 'pi pi-user', 
          routerLink: profileLink 
        },
        { 
          label: 'Log out', 
          icon: 'pi pi-sign-out', 
          command: () => this.authService.logout() 
        }
      ]
    };

    if (role === 'Admin') {
      return [...base, ...this.adminMenu(), account];
    }

    if (role === 'User') {
      return [...base, ...this.studentMenu(), account];
    }

    return [{
      label: 'Account',
      items: [
        { label: 'Login', icon: 'pi pi-sign-in', routerLink: ['/login'] }
      ]
    }];
  }

  private adminMenu(): MenuItem[] {
    return [
      {
        label: 'Lesson',
        items: this.lessonItems()
      },
      {
        label: 'System',
        items: [
          {
            label: 'Users',
            icon: 'pi pi-users',
            items: [
              { label: 'Active Users', icon: 'pi pi-users', routerLink: ['/users'] },
              { label: 'Inactive Users', icon: 'pi pi-user-minus', routerLink: ['/users/inactive'] },
              { label: 'Register User', icon: 'pi pi-user-plus', routerLink: ['/users/register'] },
              { label: 'Profiles', icon: 'pi pi-id-card', routerLink: ['/profiles'] },
              { label: 'Onboard Client', icon: 'pi pi-play-circle', routerLink: ['/users/onboard'] },
            ]
          },
          {
            label: 'Curriculum',
            icon: 'pi pi-sitemap',
            items: [
              { label: 'Programs', icon: 'pi pi-sitemap', routerLink: ['/curriculum/programs'] },
              { label: 'Add Program', icon: 'pi pi-plus-circle', routerLink: ['/curriculum/programs/add'] },
              { label: 'Courses', icon: 'pi pi-book', routerLink: ['/curriculum/courses'] },
              { label: 'Add Course', icon: 'pi pi-plus-circle', routerLink: ['/curriculum/courses/add'] },
              { label: 'Matrices', icon: 'pi pi-table', routerLink: ['/curriculum/matrices'] },
              { label: 'Add Matrix', icon: 'pi pi-plus-circle', routerLink: ['/curriculum/matrices/add'] },
              { label: 'Plan Matrix', icon: 'pi pi-calendar-plus', routerLink: ['/curriculum/matrices/plan'] },
              { label: 'Modules', icon: 'pi pi-box', routerLink: ['/curriculum/modules'] },
              { label: 'Create Module', icon: 'pi pi-plus-circle', routerLink: ['/curriculum/modules/create'] },
              { label: 'Plan Module', icon: 'pi pi-calendar-clock', routerLink: ['/curriculum/modules/plan'] },
              { label: 'Curricula', icon: 'pi pi-list', routerLink: ['/system/curricula'] },
            ]
          },
          {
            label: 'Content',
            icon: 'pi pi-folder',
            items: [
              { label: 'Catalogues', icon: 'pi pi-folder-open', routerLink: ['/system/catalogues'] },
              { label: 'Upload Catalogue', icon: 'pi pi-upload', routerLink: ['/system/catalogues/upload'] },
              { label: 'Sentence Stock', icon: 'pi pi-align-left', routerLink: ['/system/sentences/stock'] },
              { label: 'Add to Sentence Stock', icon: 'pi pi-plus-circle', routerLink: ['/system/sentences/add'] },
              { label: 'Sets', icon: 'pi pi-th-large', routerLink: ['/system/sets'] },
              { label: 'Compose Set', icon: 'pi pi-pencil', routerLink: ['/system/sets/compose'] },
              { label: 'Composed Sentences', icon: 'pi pi-file-edit', routerLink: ['/system/sentences/composed'] },
            ]
          },
          {
            label: 'Stream & Grading',
            icon: 'pi pi-server',
            items: [
              { label: 'Stream', icon: 'pi pi-server', routerLink: ['/system/stream'] },
              { label: 'Add Stream', icon: 'pi pi-plus-circle', routerLink: ['/system/stream/add'] },
              { label: 'Grade Assignments', icon: 'pi pi-check-square', routerLink: ['/system/grade/assignments'] },
              { label: 'Grade Sentences', icon: 'pi pi-check-square', routerLink: ['/system/grade/sentences'] },
              { label: 'Label Sentences', icon: 'pi pi-tag', routerLink: ['/system/sentences/label'] },
              { label: 'Download Assignments', icon: 'pi pi-download', routerLink: ['/system/assignments/download'] },
            ]
          },
          {
            label: 'Theater',
            icon: 'pi pi-video',
            items: [
              { label: 'Theater', icon: 'pi pi-video', routerLink: ['/system/theater'] },
              { label: 'Repertoire', icon: 'pi pi-list', routerLink: ['/system/theater/repertoire'] },
              { label: 'Upload Theater', icon: 'pi pi-upload', routerLink: ['/system/theater/upload'] },
            ]
          },
          {
            label: 'Admin Tools',
            icon: 'pi pi-cog',
            items: [
              { label: 'Announcements', icon: 'pi pi-bell', routerLink: ['/system/announcements'] },
              { label: 'Make Announcement', icon: 'pi pi-plus-circle', routerLink: ['/system/announcements/create'] },
              { label: 'Options', icon: 'pi pi-sliders-h', routerLink: ['/system/options'] },
            ]
          }
        ]
      }
    ];
  }

  private studentMenu(): MenuItem[] {
    return [
      {
        label: 'Learning',
        items: [
          { 
            label: 'Flashcard Session', 
            icon: 'pi pi-bolt', 
            routerLink: ['/flashcards/study'] 
          },
          { 
            label: 'Flashcard List', 
            icon: 'pi pi-list', 
            routerLink: ['/flashcards'] 
          },
          { label: 'Vocabulary', icon: 'pi pi-book', routerLink: ['/vocabulary'] },
          { label: 'Sentences', icon: 'pi pi-align-left', routerLink: ['/sentences'] },
          { label: 'Memories', icon: 'pi pi-lightbulb', routerLink: ['/memories'] },
          { label: 'Pronunciation', icon: 'pi pi-microphone', routerLink: ['/pronunciation'] },
          { label: 'Assignments', icon: 'pi pi-file', routerLink: ['/assignments'] }
        ]
      },
      {
        label: 'Progress',
        items: [
          { label: 'Last Week', icon: 'pi pi-calendar-times', routerLink: ['/last-week'] },
          { label: 'Activity Points', icon: 'pi pi-chart-line', routerLink: ['/activity-points'] },
          { label: 'Grades', icon: 'pi pi-star', routerLink: ['/grades'] },
          { label: 'Stats', icon: 'pi pi-chart-bar', routerLink: ['/stats'] },
        ]
      },
      {
        label: 'Courses',
        items: [
          { label: 'My Courses', icon: 'pi pi-bookmark', routerLink: ['/courses'] },
        ]
      }
    ];
  }

  private lessonItems(): MenuItem[] {
    return [
      { label: 'Switch Client', icon: 'pi pi-arrows-h', routerLink: ['/lesson/switch-client'] },
      { label: 'Agenda', icon: 'pi pi-list', routerLink: ['/lesson/agenda'] },
      { label: 'Homework Check', icon: 'pi pi-check-square', routerLink: ['/lesson/homework'] },
      { label: 'Lesson Mode', icon: 'pi pi-bolt', routerLink: ['/lesson/mode'] },
      { label: 'List / Notes', icon: 'pi pi-file-edit', routerLink: ['/lesson/list'] },
      { label: 'Test Pronunciation', icon: 'pi pi-microphone', routerLink: ['/lesson/pronunciation'] },
      { label: 'Grade Student', icon: 'pi pi-star', routerLink: ['/lesson/grade'] },
      { label: 'Grades', icon: 'pi pi-chart-bar', routerLink: ['/lesson/grades'] },
      { label: 'Activity Points', icon: 'pi pi-history', routerLink: ['/lesson/activity-points'] },
      { label: 'Flashcards', icon: 'pi pi-clone', routerLink: ['/lesson/flashcards'] },
      { label: 'Report Listening', icon: 'pi pi-video', routerLink: ['/lesson/listening'] },
      { label: 'Stream Entries', icon: 'pi pi-server', routerLink: ['/lesson/stream'] },
      { label: 'Flashcard Study Time', icon: 'pi pi-clock', routerLink: ['/lesson/study-time'] },
      { label: 'Last Week', icon: 'pi pi-calendar-times', routerLink: ['/lesson/last-week'] },
      { label: 'Stats', icon: 'pi pi-chart-line', routerLink: ['/lesson/stats'] },
    ];
  }
}