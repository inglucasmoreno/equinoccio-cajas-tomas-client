import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class OrdenesPagoCajasService {

  get getToken(): any {
    return {
      'Authorization': localStorage.getItem('token')
    };
  }
  
  constructor(private http: HttpClient) { }

  // Nueva relacion
  nuevaRelacion(data: any): Observable<any> {
    return this.http.post(`${base_url}/ordenes-pago-cajas`, data, {
      headers: this.getToken
    });
  };

  // Relacion por ID
  getRelacion(id: string): Observable<any> {
    return this.http.get(`${base_url}/ordenes-pago-cajas/${id}`, {
      headers: this.getToken
    });
  };

  // Listar relaciones
  listarRelaciones(parametros?: any): Observable<any> {
    return this.http.get(`${base_url}/ordenes-pago-cajas`, {
      params: {
        direccion: parametros?.direccion || 1,
        columna: parametros?.columna || 'descripcion'
      },
      headers: this.getToken
    });
  }

  // Actualizar relacion
  actualizarRelaciones(id: string, data: any): Observable<any> {
    return this.http.put(`${base_url}/ordenes-pago-cajas/${id}`, data, {
      headers: this.getToken
    });
  }

}
