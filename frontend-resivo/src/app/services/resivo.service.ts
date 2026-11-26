import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreateResivoDto, Resivo, UpdateResivoDto } from '../models/resivo.model';
import { RespuestaEliminar } from '../models/api.model';

// Talks with the /resivo endpoints of the API.
// Every method returns an Observable: the request is made when the component subscribes.
// providedIn: 'root' = one instance for the whole app, available everywhere
@Injectable({ providedIn: 'root' })
export class ResivoService {
  private readonly url = `${environment.apiUrl}/resivo`;

  constructor(private http: HttpClient) {}

  // GET /resivo: every resivo with its productos and total
  getAll(): Observable<Resivo[]> {
    return this.http.get<Resivo[]>(this.url);
  }

  // GET /resivo/:id (404 if it does not exist)
  getById(id: number): Observable<Resivo> {
    return this.http.get<Resivo>(`${this.url}/${id}`);
  }

  // POST /resivo: answers the new resivo, the same as getById
  create(resivo: CreateResivoDto): Observable<Resivo> {
    return this.http.post<Resivo>(this.url, resivo);
  }

  // PATCH /resivo/:id: only the fields that change
  update(id: number, cambios: UpdateResivoDto): Observable<Resivo> {
    return this.http.patch<Resivo>(`${this.url}/${id}`, cambios);
  }

  // DELETE /resivo/:id: its productos are deleted too
  delete(id: number): Observable<RespuestaEliminar> {
    return this.http.delete<RespuestaEliminar>(`${this.url}/${id}`);
  }

  // GET /resivo/metodos-pago: the options of the <select> of the form
  getMetodosPago(): Observable<string[]> {
    return this.http.get<string[]>(`${this.url}/metodos-pago`);
  }
}
