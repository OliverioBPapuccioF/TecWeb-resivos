import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  EstadisticaMetodoPago,
  GastoPorFecha,
  GastoPorLocal,
  UltimoResivo,
} from '../models/estadisticas.model';

// Talks with GET /resivo/estadisticas/* (data of the home page).
// The API calculates everything; the frontend only shows it.
@Injectable({ providedIn: 'root' })
export class EstadisticasService {
  private readonly url = `${environment.apiUrl}/resivo/estadisticas`;

  constructor(private http: HttpClient) {}

  // the 5 most recent resivos by purchase date
  getUltimos(): Observable<UltimoResivo[]> {
    return this.http.get<UltimoResivo[]>(`${this.url}/ultimos`);
  }

  // how many resivos per payment method, and the one used the most
  getPorMetodoPago(): Observable<EstadisticaMetodoPago> {
    return this.http.get<EstadisticaMetodoPago>(`${this.url}/metodo-pago`);
  }

  // money spent per purchase date (oldest first)
  getPorFecha(): Observable<GastoPorFecha[]> {
    return this.http.get<GastoPorFecha[]>(`${this.url}/por-fecha`);
  }

  // money spent per local (biggest first)
  getPorLocal(): Observable<GastoPorLocal[]> {
    return this.http.get<GastoPorLocal[]>(`${this.url}/por-local`);
  }
}
