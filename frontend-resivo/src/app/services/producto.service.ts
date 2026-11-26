import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreateProductoDto, Producto, UpdateProductoDto } from '../models/producto.model';
import { RespuestaEliminar } from '../models/api.model';

// Talks with the /producto endpoints of the API.
// Every method returns an Observable: the request is made when the component subscribes.
@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly url = `${environment.apiUrl}/producto`;

  constructor(private http: HttpClient) {}

  // GET /producto: every producto, with resivoId and its resivo
  getAll(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.url);
  }

  // GET /producto/:id (404 if it does not exist)
  getById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.url}/${id}`);
  }

  // POST /producto: answers the new producto, the same as getById
  // (404 if resivoId does not exist)
  create(producto: CreateProductoDto): Observable<Producto> {
    return this.http.post<Producto>(this.url, producto);
  }

  // PATCH /producto/:id: only the fields that change (another resivoId moves it)
  update(id: number, cambios: UpdateProductoDto): Observable<Producto> {
    return this.http.patch<Producto>(`${this.url}/${id}`, cambios);
  }

  // DELETE /producto/:id
  delete(id: number): Observable<RespuestaEliminar> {
    return this.http.delete<RespuestaEliminar>(`${this.url}/${id}`);
  }
}
