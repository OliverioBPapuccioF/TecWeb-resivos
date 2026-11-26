import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Salud } from '../models/api.model';

// Things of the API in general (not of one entity).
@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // GET /salud: the API and the database.
  // If the database is down the Observable fails with status 503;
  // if the API is down, with status 0
  getSalud(): Observable<Salud> {
    return this.http.get<Salud>(`${environment.apiUrl}/salud`);
  }
}
