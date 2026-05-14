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
import {ProgramComponent} from './curriculum/program-files/program/program.component';
import {ProgramAddingComponent} from './curriculum/program-files/program-adding/program-adding.component';
import {CourseComponent} from './curriculum/course-files/course/course.component';
import {CourseEditComponent} from './curriculum/course-files/course-edit/course-edit.component';
import {CourseAddingComponent} from './curriculum/course-files/course-adding/course-adding.component';
import {MatrixComponent} from './curriculum/matrix-files/matrix/matrix.component';
import {MatrixAddingComponent} from './curriculum/matrix-files/matrix-adding/matrix-adding.component';
import {MatrixEditComponent} from './curriculum/matrix-files/matrix-edit/matrix-edit.component';
import {PlanMatrixComponent} from './curriculum/matrix-files/plan-matrix/plan-matrix.component';
import {ModuleComponent} from './curriculum/module-files/module/module.component';
import {PlanModuleComponent} from './curriculum/module-files/plan-module/plan-module.component';
import {ModuleAddingComponent} from './curriculum/module-files/module-adding/module-adding.component';
import {ModuleEditComponent} from './curriculum/module-files/module-edit/module-edit.component';
import { RegisterUserComponent } from './user/register-user/register-user.component';
import { UserCourseComponent } from './student-view/user-course/user-course.component';
import { LastWeekComponent } from './student-view/last-week/last-week.component';
import { ActivityPointsComponent } from './student-view/activity-points/activity-points.component';
import { GradesComponent } from './student-view/grades/grades.component';
import { StatsComponent } from './student-view/stats/stats.component';



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
      { path: 'curriculum/courses/add', component: CourseAddingComponent, canActivate: [AuthGuard] },
      { path: 'curriculum/matrices', component: MatrixComponent, canActivate: [AuthGuard] },
      { path: 'curriculum/matrices/add', component: MatrixAddingComponent, canActivate: [AuthGuard] },
      { path: 'curriculum/matrices/:id/edit', component: MatrixEditComponent, canActivate: [AuthGuard] },
      { path: 'curriculum/matrices/plan', component: PlanMatrixComponent, canActivate: [AuthGuard] },
      { path: 'curriculum/modules', component: ModuleComponent, canActivate: [AuthGuard] },
      { path: 'curriculum/modules/:id/edit', component: ModuleEditComponent, canActivate: [AuthGuard] },
      { path: 'curriculum/modules/create', component: ModuleAddingComponent, canActivate: [AuthGuard] },
      { path: 'curriculum/modules/plan', component: PlanModuleComponent, canActivate: [AuthGuard] },
      { path: 'courses', component: UserCourseComponent, canActivate: [AuthGuard] },
      { path: 'last-week', component: LastWeekComponent, canActivate: [AuthGuard] },
      { path: 'activity-points',  component: ActivityPointsComponent,  canActivate: [AuthGuard] },
      { path: 'grades', component: GradesComponent, canActivate: [AuthGuard] },
      { path: 'stats', component: StatsComponent, canActivate: [AuthGuard] },
      { path: 'users/register', component: RegisterUserComponent, canActivate: [AuthGuard] },
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
