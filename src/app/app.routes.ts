import {Routes} from '@angular/router';
import {AppLayout} from './layout/component/app.layout';
import {Dashboard} from './other/dashboard/dashboard.component';
import {Documentation} from './pages/documentation/documentation';
import {Landing} from './pages/landing/landing';
import {Notfound} from './pages/notfound/notfound';
import {AuthGuard} from './shared/guards/auth.guard';
import {UserCrudComponent} from './user/user-crud/user-crud.component';
import {FlashcardPanelComponent} from './student-view/flashcard-panel/flashcard-panel.component';
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
import {RegisterUserComponent } from './user/register-user/register-user.component';
import {UserCourseComponent } from './student-view/user-course/user-course.component';
import {LastWeekComponent } from './student-view/last-week/last-week.component';
import {ActivityPointsComponent } from './student-view/activity-points/activity-points.component';
import {GradesComponent } from './student-view/grades/grades.component';
import {StatsComponent } from './student-view/stats/stats.component';
import {VocabularyComponent} from './student-view/vocabulary/vocabulary.component';
import {SentencesComponent} from './student-view/sentences/sentences.component';
import {MemoriesComponent} from './student-view/memories/memories.component';
import {PronunciationComponent} from './student-view/pronunciation/pronunciation.component';
import {AssignmentsComponent} from './student-view/assignments/assignments.component';
import {FlashcardStudyModeComponent} from './student-view/flashcard-study-mode/flashcard-study-mode.component';
import {SwitchClientComponent} from './lesson/switch-client/switch-client.component';
import {LessonModeComponent} from './lesson/lesson-mode/lesson-mode.component';
import {HomeworkCheckComponent} from './lesson/homework-check/homework-check.component';
import {PronunciationTestComponent} from './lesson/pronunciation-test/pronunciation-test.component';
import {GradeStudentComponent} from './lesson/grade-student/grade-student.component';
import {LessonNotesComponent} from './lesson/lesson-notes/lesson-notes.component';
import {ReportListeningComponent} from './lesson/report-listening/report-listening.component';
import {ProfileDetailComponent} from './user/profile-detail/profile-detail.component';
import {LessonAgendaComponent} from './lesson/lesson-agenda/lesson-agenda.component';
import {LessonGradesComponent} from './lesson/lesson-grades/lesson-grades.component';
import {LessonActivityPointsComponent} from './lesson/lesson-activity-points/lesson-activity-points.component';
import {LessonFlashcardsComponent} from './lesson/lesson-flashcards/lesson-flashcards.component';
import {LessonStreamComponent} from './lesson/lesson-stream/lesson-stream.component';
import {LessonStudyTimeComponent} from './lesson/lesson-study-time/lesson-study-time.component';
import {LessonLastWeekComponent} from './lesson/lesson-last-week/lesson-last-week.component';
import {LessonStatsComponent} from './lesson/lesson-stats/lesson-stats.component';
import {LoginComponent} from './auth/login/login.component';
import {CataloguesComponent} from './other/catalogues/catalogues.component';
import {GlobalFlashcardComponent} from './other/global-flashcard/global-flashcard.component';


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
      { path: 'vocabulary', component: VocabularyComponent, canActivate: [AuthGuard] },
      { path: 'sentences', component: SentencesComponent, canActivate: [AuthGuard] },
      { path: 'memories', component: MemoriesComponent, canActivate: [AuthGuard] },
      { path: 'pronunciation', component: PronunciationComponent, canActivate: [AuthGuard] },
      { path: 'assignments', component: AssignmentsComponent, canActivate: [AuthGuard] },
      { path: 'flashcards', component: FlashcardPanelComponent, canActivate: [AuthGuard] },
      { path: 'flashcards/study', component: FlashcardStudyModeComponent, canActivate: [AuthGuard] },
      { path: 'lesson/switch-client', component: SwitchClientComponent, canActivate: [AuthGuard] },
      { path: 'lesson/mode', component: LessonModeComponent, canActivate: [AuthGuard] },
      { path: 'lesson/homework', component: HomeworkCheckComponent, canActivate: [AuthGuard] },
      { path: 'lesson/pronunciation', component: PronunciationTestComponent, canActivate: [AuthGuard] },
      { path: 'lesson/grade', component: GradeStudentComponent, canActivate: [AuthGuard] },
      { path: 'lesson/list', component: LessonNotesComponent, canActivate: [AuthGuard] },
      { path: 'lesson/listening', component: ReportListeningComponent, canActivate: [AuthGuard] },
      { path: 'lesson/agenda', component: LessonAgendaComponent, canActivate: [AuthGuard] },
      { path: 'lesson/grades', component: LessonGradesComponent, canActivate: [AuthGuard] },
      { path: 'lesson/activity-points', component: LessonActivityPointsComponent, canActivate: [AuthGuard] },
      { path: 'lesson/flashcards', component: LessonFlashcardsComponent, canActivate: [AuthGuard] },
      { path: 'lesson/stream', component: LessonStreamComponent, canActivate: [AuthGuard] },
      { path: 'lesson/flashcards-study-time', component: LessonStudyTimeComponent, canActivate: [AuthGuard] },
      { path: 'lesson/last-week', component: LessonLastWeekComponent, canActivate: [AuthGuard] },
      { path: 'lesson/stats', component: LessonStatsComponent, canActivate: [AuthGuard] },  
      { path: 'users/register', component: RegisterUserComponent, canActivate: [AuthGuard] },
      { path: 'profiles', component: ProfileComponent, canActivate: [AuthGuard] },
      { path: 'profiles/:userId', component: ProfileDetailComponent, canActivate: [AuthGuard] },
      { path: 'catalogues', component: CataloguesComponent, canActivate: [AuthGuard] },
      { path: 'flashcards/global', component: GlobalFlashcardComponent, canActivate: [AuthGuard] },

    ]
  },
  { path: 'auth', loadChildren: () => import('./auth/auth.routes') },
  { path: 'login', component: LoginComponent },
  { path: 'landing', component: Landing },
  { path: 'notfound', component: Notfound },
];
