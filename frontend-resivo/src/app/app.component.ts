import { Component, HostListener, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

// Root component: menu, the page of the current route and the footer.
// The background, the fonts and the colors are global: src/styles.css
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  protected readonly compacta = signal(false);

  // achica el menú cuando se baja más de 40px
  @HostListener('window:scroll')
  alScrollear() {
    const y = window.scrollY;
    if (!this.compacta() && y > 60) {
      this.compacta.set(true);
    } else if (this.compacta() && y < 10) {
      this.compacta.set(false);
    }
  }
}
