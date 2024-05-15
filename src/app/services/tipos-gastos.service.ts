import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class TiposGastosService {

  get getToken(): any {
    return {
      'Authorization': localStorage.getItem('token')
    };
  }

  constructor(private http: HttpClient) {}

  // Nuevo tipo
  nuevoTipo(data: any): Observable<any> {
    return this.http.post(`${base_url}/tipos-gastos`, data, {
      headers: this.getToken
    });
  };

  // Tipo por ID
  getTipo(id: string): Observable<any> {
    return this.http.get(`${base_url}/tipos-gastos/${ id }`,{ 
      headers: this.getToken
    });
  };

  // Listar tipos
  listarTipos(parametros?: any): Observable<any> {
    return this.http.get(`${base_url}/tipos-gastos`, {
      params: {
        direccion: parametros?.direccion || 1,
        columna: parametros?.columna || 'descripcion'
      },
      headers: this.getToken
    });
  }

  // Actualizar tipo
  actualizarTipo(id:string, data: any): Observable<any> {
    return this.http.put(`${base_url}/tipos-gastos/${id}`, data, {
      headers: this.getToken
    });
  }  

}
