import { Component } from '@angular/core';
import {ButtonModule} from 'primeng/button';
import {RouterModule} from '@angular/router';
import {RippleModule} from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';

@Component({
  selector: 'app-access',
  imports: [ButtonModule, RouterModule, RippleModule, AppFloatingConfigurator, ButtonModule],
  templateUrl: './access.component.html',
  styleUrl: './access.component.scss'
})
export class AccessComponent {

}
