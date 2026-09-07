import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-irregular-verbs-selection',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TagModule],
  templateUrl: './irregular-verbs-selection.component.html'
})
export class IrregularVerbsSelectionComponent {}
