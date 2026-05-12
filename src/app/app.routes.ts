import {Routes} from '@angular/router';
import {AppLayout} from './layout/component/app.layout';
import {Dashboard} from './pages/dashboard/dashboard';
import {Documentation} from './pages/documentation/documentation';
import {Landing} from './pages/landing/landing';
import {Notfound} from './pages/notfound/notfound';
import {AuthGuard} from './shared/guards/auth.guard';
import {UserCrudComponent} from './user/user-crud/user-crud.component';
import {FlashcardPanelComponent} from './flashcards/flashcard-panel/flashcard-panel.component';
import {ProfileComponent} from './user/profile/profile.component';
import {ProgramComponent} from './curriculum/program/program.component';
import {ProgramAddingComponent} from './curriculum/program-adding/program-adding.component';
import { CourseComponent } from './curriculum/course/course.component';
import { CourseEditComponent } from './curriculum/course-edit/course-edit.component';
export const appRoutes: Routes = [
  {
    path: '',
    component: AppLayout,
    children: [
      { path: '', component: Dashboard, canActivate: [AuthGuard] },
      { path: 'uikit', loadChildren: () => import('./pages/uikit/uikit.routes') },
      { path: 'documentation', component: Documentation },
      { path: 'pages', loadChildren: () => import('./pages/pages.routes') },
      { path: 'users', component: UserCrudComponent, canActivate: [AuthGuard] },
      { path: 'users/inactive', component: UserCrudComponent, canActivate: [AuthGuard] },
      { path: 'flashcards', component: FlashcardPanelComponent, canActivate: [AuthGuard] },
      { path: 'curriculum/programs', component: ProgramComponent, canActivate: [AuthGuard] },
      { path: 'curriculum/programs/add', component: ProgramAddingComponent, canActivate: [AuthGuard] },
      { path: 'curriculum/courses', component: CourseComponent, canActivate: [AuthGuard] },
      { path: 'curriculum/course/:id/edit', component: CourseEditComponent, canActivate: [AuthGuard] },
      { path: 'users/register', loadComponent: () => import('./user/register-user/register-user.component').then(m => m.RegisterUserComponent), canActivate: [AuthGuard] },
      { path: 'profiles', component: ProfileComponent, canActivate: [AuthGuard] },
      { 
          path: 'profiles/:userId', 
          loadComponent: () => import('./user/profile-detail/profile-detail.component').then(m => m.ProfileDetailComponent), 
          canActivate: [AuthGuard] 
      },
    ]
  },
  { path: 'auth', loadChildren: () => import('./auth/auth.routes') },
  { path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component')
        .then(m => m.LoginComponent) },
  { path: 'landing', component: Landing },
  { path: 'notfound', component: Notfound },
];
