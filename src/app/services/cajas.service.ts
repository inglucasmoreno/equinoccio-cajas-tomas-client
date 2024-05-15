import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class CajasService {

  get getToken(): any {
    return {
      'Authorization': localStorage.getItem('token')
    };
  }

  constructor(private http: HttpClient) {}

  // Nueva caja
  nuevaCaja(data: any): Observable<any> {
    return this.http.post(`${base_url}/cajas`, data, {
      headers: this.getToken
    });
  };

  // Movimiento interno
  movimientoInterno(data: any): Observable<any> {
    return this.http.post(`${base_url}/cajas/movimiento-interno`, data, {
      headers: this.getToken
    });
  };

  // Caja por ID
  getCaja(id: string): Observable<any> {
    return this.http.get(`${base_url}/cajas/${ id }`,{ 
      headers: this.getToken
    });
  };

  // Listar cajas
  listarCajas(parametros?: any): Observable<any> {
    return this.http.get(`${base_url}/cajas`, {
      params: {
        direccion: parametros?.direccion || 1,
        columna: parametros?.columna || 'descripcion'
      },
      headers: this.getToken
    });
  }

  // Actualizar cajas
  actualizarCaja(id:string, data: any): Observable<any> {
    return this.http.put(`${base_url}/cajas/${id}`, data, {
      headers: this.getToken
    });
  }  

}
