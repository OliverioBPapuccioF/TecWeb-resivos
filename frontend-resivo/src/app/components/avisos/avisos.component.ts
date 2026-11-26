import { Component } from '@angular/core';
import { AvisosService } from '../../services/avisos.service';

// Shows the notices of AvisosService, stacked (style: .avisos, .aviso, .aviso--error,
// .aviso__titulo in styles.css). It goes only once, in the root component.
@Component({
  selector: 'app-avisos',
  imports: [],
  templateUrl: './avisos.component.html',
  styleUrl: './avisos.component.css',
})
export class AvisosComponent {
  constructor(protected avisos: AvisosService) {}
}
