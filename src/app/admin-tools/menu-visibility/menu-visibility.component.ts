import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { LessonService, StudentSimple } from '../../services/lesson.service';
import { MenuVisibilityService, ConfigurableMenuItem } from '../../services/menu-visibility.service';
import { AvatarComponent } from '../../other/avatar/avatar.component';

export interface MenuItemSelection extends ConfigurableMenuItem {
  isVisible: boolean;
}

@Component({
  selector: 'app-menu-visibility',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    CheckboxModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    ToastModule,
    TooltipModule,
    AvatarComponent
  ],
  providers: [MessageService],
  templateUrl: './menu-visibility.component.html'
})
export class MenuVisibilityComponent implements OnInit {
  private lessonService = inject(LessonService);
  private menuVisibilityService = inject(MenuVisibilityService);
  private messageService = inject(MessageService);

  students = signal<StudentSimple[]>([]);
  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  loadingItems = signal<boolean>(false);

  // Modal state
  dialogVisible = signal<boolean>(false);
  selectedStudent = signal<StudentSimple | null>(null);
  menuItems = signal<MenuItemSelection[]>([]);
  itemSearchTerm = signal<string>('');

  filteredMenuItems = computed(() => {
    const term = this.itemSearchTerm().trim().toLowerCase();
    const items = this.menuItems();
    if (!term) return items;
    return items.filter(
      item =>
        item.label.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term)
    );
  });

  visibleCount = computed(() => {
    return this.menuItems().filter(i => i.isVisible).length;
  });

  hiddenCount = computed(() => {
    return this.menuItems().filter(i => !i.isVisible).length;
  });

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    this.loading.set(true);
    this.lessonService.getStudents().subscribe({
      next: (data) => {
        // Sort students strictly alphabetically by username
        const sorted = [...data].sort((a, b) =>
          a.username.localeCompare(b.username, undefined, { sensitivity: 'base' })
        );
        this.students.set(sorted);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load students', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load students'
        });
        this.loading.set(false);
      }
    });
  }

  openVisibilityDialog(student: StudentSimple): void {
    this.selectedStudent.set(student);
    this.itemSearchTerm.set('');
    this.loadingItems.set(true);
    this.dialogVisible.set(true);

    const availableItems = this.menuVisibilityService.getAvailableMenuItems();

    this.menuVisibilityService.getHiddenKeysForUser(student.id).subscribe({
      next: (hiddenKeys) => {
        const hiddenSet = new Set(hiddenKeys ?? []);
        const selections: MenuItemSelection[] = availableItems.map(item => ({
          ...item,
          // Default: visible (true), unless present in hiddenSet
          isVisible: !hiddenSet.has(item.key)
        }));
        this.menuItems.set(selections);
        this.loadingItems.set(false);
      },
      error: (err) => {
        console.error('Failed to load visibility settings', err);
        // Fallback: all visible by default
        const selections: MenuItemSelection[] = availableItems.map(item => ({
          ...item,
          isVisible: true
        }));
        this.menuItems.set(selections);
        this.loadingItems.set(false);
      }
    });
  }

  selectAll(): void {
    this.menuItems.update(items =>
      items.map(item => ({ ...item, isVisible: true }))
    );
  }

  deselectAll(): void {
    this.menuItems.update(items =>
      items.map(item => ({ ...item, isVisible: false }))
    );
  }

  toggleItem(index: number): void {
    this.menuItems.update(items => {
      const updated = [...items];
      updated[index] = { ...updated[index], isVisible: !updated[index].isVisible };
      return updated;
    });
  }

  saveVisibility(): void {
    const student = this.selectedStudent();
    if (!student) return;

    this.saving.set(true);
    // Keys where isVisible is false are hidden
    const hiddenKeys = this.menuItems()
      .filter(item => !item.isVisible)
      .map(item => item.key);

    this.menuVisibilityService.updateUserMenuVisibility(student.id, hiddenKeys).subscribe({
      next: () => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Menu visibility for ${student.username} updated successfully!`
        });
        this.dialogVisible.set(false);
      },
      error: (err) => {
        console.error('Failed to update menu visibility', err);
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update menu visibility'
        });
      }
    });
  }

  onGlobalFilter(table: any, event: Event): void {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  getCategorySeverity(category: string): 'info' | 'success' | 'warn' | 'secondary' {
    switch (category) {
      case 'Home': return 'info';
      case 'Learning': return 'success';
      case 'Live Hub': return 'warn';
      case 'Progress': return 'info';
      case 'Courses': return 'secondary';
      default: return 'secondary';
    }
  }
}
