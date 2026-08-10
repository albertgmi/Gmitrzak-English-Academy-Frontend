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
import {WeeklyMoviesComponent} from './student-view/weekly-movies/weekly-movies.component';
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
import {LessonStudyTimeComponent} from './lesson/lesson-study-time/lesson-study-time.component';
import {LessonLastWeekComponent} from './lesson/lesson-last-week/lesson-last-week.component';
import {LessonStatsComponent} from './lesson/lesson-stats/lesson-stats.component';
import {LoginComponent} from './auth/login/login.component';
import {CataloguesComponent} from './content/catalogues/catalogues.component';
import {TheaterComponent} from './other/theater/theater.component';
import {RepertoireComponent} from './other/repertoire/repertoire.component';
import { GlobalVocabularyComponent } from './vocabulary/global-vocabulary/global-vocabulary.component';
import { AssignGlobalVocabularyComponent } from './vocabulary/assign-global-vocabulary/assign-global-vocabulary.component';
import { AnnouncementsComponent } from './admin-tools/announcements/announcements.component';
import { MessagesComponent } from './admin-tools/messages/messages.component';
import { SentenceStockComponent } from './stocksAndSets/sentence-stock/sentence-stock.component';
import { SetsComposerComponent } from './stocksAndSets/sets-composer/sets-composer.component';
import { SentenceTaskComponent } from './stocksAndSets/sentence-task/sentence-task.component';
import { SentencesCardsComponent } from './student-view/sentences-cards/sentences-cards.component';
import { LessonSentenceAnswersComponent } from './lesson/lesson-sentence-answers/lesson-sentence-answers.component';
import { ModulePlayerComponent } from './student-view/module-player/module-player.component';
import { RankingComponent } from './other/ranking/ranking.component';
import { AttendanceComponent } from './lesson/attendance/attendance.component';
import { PresentationComponent } from './student-view/presentation/presentation.component';
import { ActiveStudentsReportsComponent } from './content/active-students-reports/active-students-reports.component';
import { OnboardClientComponent } from './lesson/onboard-client/onboard-client.component';
import { ExaminationModeComponent } from './lesson/examination-mode/examination-mode.component';
import { CreditsComponent } from './other/credits/credits.component';
import { AdminCreditsComponent } from './other/admin-credits/admin-credits.component';
import { CheckEssaysComponent } from './content/check-essays/check-essays.component';
import { EssayModuleComponent } from './student-view/essay-module/essay-module.component';
import { StudentActivityComponent } from './other/student-activity/student-activity.component';
import { AssignCourseComponent } from './curriculum/course-files/assign-course/assign-course.component';
import { AlphabetTestComponent } from './student-view/alphabet-test/alphabet-test.component';
import { AlphabetPoolComponent } from './lesson/alphabet-pool/alphabet-pool.component';
import { AlphabetLessonTestComponent } from './other/alphabet-lesson-test/alphabet-lesson-test.component';
import { LessonMemoriesComponent } from './lesson/lesson-memories/lesson-memories.component';
import { LessonPronunciationComponent } from './lesson/lesson-pronunciation/lesson-pronunciation.component';




import { StudentEssaysComponent } from './student-view/student-essays/student-essays.component';

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
      { path: 'weekly-movies', component: WeeklyMoviesComponent, canActivate: [AuthGuard] },
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
      { path: 'lesson/attendance', component: AttendanceComponent, canActivate: [AuthGuard] },
      { path: 'lesson/flashcards-study-time', component: LessonStudyTimeComponent, canActivate: [AuthGuard] },
      { path: 'lesson/last-week', component: LessonLastWeekComponent, canActivate: [AuthGuard] },
      { path: 'lesson/stats', component: LessonStatsComponent, canActivate: [AuthGuard] },  
      { path: 'users/register', component: RegisterUserComponent, canActivate: [AuthGuard] },
      { path: 'profiles', component: ProfileComponent, canActivate: [AuthGuard] },
      { path: 'profiles/:userId', component: ProfileDetailComponent, canActivate: [AuthGuard] },
      { path: 'onboard', component: OnboardClientComponent, canActivate: [AuthGuard] },
      { path: 'system/catalogues', component: CataloguesComponent, canActivate: [AuthGuard] },
      { path: 'system/global-vocabulary', component: GlobalVocabularyComponent, canActivate: [AuthGuard] },
      { path: 'system/global-vocabulary/assign', component: AssignGlobalVocabularyComponent, canActivate: [AuthGuard] },
      { path: 'system/theater', component: TheaterComponent, canActivate: [AuthGuard] },
      { path: 'system/theater/repertoire', component: RepertoireComponent, canActivate: [AuthGuard] },
      { path: 'system/announcements', component: AnnouncementsComponent, canActivate: [AuthGuard] },
      { path: 'messages', component: MessagesComponent, canActivate: [AuthGuard] },
      { path: 'system/sentences/stock', component: SentenceStockComponent, canActivate: [AuthGuard] },
      { path: 'system/sets/compose', component: SetsComposerComponent, canActivate: [AuthGuard] },
      { path: 'modules/:moduleId/sentences', component: SentenceTaskComponent, canActivate: [AuthGuard] },
      { path: 'sentences-cards', component: SentencesCardsComponent, canActivate: [AuthGuard] },
      { path: 'lesson/sentence-answers', component: LessonSentenceAnswersComponent, canActivate: [AuthGuard] },
      { path: 'modules/:moduleId/player', component: ModulePlayerComponent, canActivate: [AuthGuard] },
      { path: 'ranking', component: RankingComponent, canActivate: [AuthGuard] },
      { path: 'modules/matrix/:matrixModuleId/presentation', component: PresentationComponent, canActivate: [AuthGuard] },
      { path: 'modules/single/:id/presentation', component: PresentationComponent, canActivate: [AuthGuard] },
      { path: 'modules/:moduleId/presentation', component: PresentationComponent, canActivate: [AuthGuard] },
      { path: 'system/active-students-reports', component: ActiveStudentsReportsComponent, canActivate: [AuthGuard] },
      { path: 'lesson/examination', component: ExaminationModeComponent, canActivate: [AuthGuard] },
      { path: 'credits', component: CreditsComponent, canActivate: [AuthGuard] },
      { path: 'modules/:moduleId/essay', component: EssayModuleComponent, canActivate: [AuthGuard] },
      { path: 'my-essays', component: StudentEssaysComponent, canActivate: [AuthGuard] },
      { path: 'lesson/check-essays', component: CheckEssaysComponent, canActivate: [AuthGuard] },
      { path: 'lesson/credits', component: AdminCreditsComponent, canActivate: [AuthGuard] },
      { path: 'system/student-activity', component: StudentActivityComponent, canActivate: [AuthGuard] },
      { path: 'curriculum/courses/plan', component: AssignCourseComponent, canActivate: [AuthGuard] },
      { path: 'alphabet-test', component: AlphabetTestComponent, canActivate: [AuthGuard] },
      { path: 'lesson/alphabet', component: AlphabetLessonTestComponent, canActivate: [AuthGuard] },
      { path: 'system/alphabet-pool', component: AlphabetPoolComponent, canActivate: [AuthGuard] },
      { path: 'lesson/memories', component: LessonMemoriesComponent, canActivate: [AuthGuard] },
      { path: 'lesson/pronunciation-entries', component: LessonPronunciationComponent, canActivate: [AuthGuard] },

    ]
  },
  { path: 'auth', loadChildren: () => import('./auth/auth.routes') },
  { path: 'login', component: LoginComponent },
  { path: 'landing', component: Landing },
  { path: 'notfound', component: Notfound },
];
