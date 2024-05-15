import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class MovimientosInternosService {

  get getToken(): any {
    return {
      'Authorization': localStorage.getItem('token')
    };
  }

  constructor(private http: HttpClient) { }

  // Nuevo movimiento interno
  nuevoMovimiento(data: any): Observable<any> {
    return this.http.post(`${base_url}/movimientos-internos`, data, {
      headers: this.getToken
    });
  };

  // Movimiento interno por ID
  getMovimiento(id: string): Observable<any> {
    return this.http.get(`${base_url}/movimientos-internos/${id}`, {
      headers: this.getToken
    });
  };

  // Listar movimientos
  listarMovimientos(parametros?: any): Observable<any> {
    return this.http.get(`${base_url}/movimientos-internos`, {
      params: {
        direccion: parametros?.direccion || -1,
        columna: parametros?.columna || 'createdAt',
        desde: parametros?.desde || 0,
        registerpp: parametros?.cantidadItems || 100000,
        estado: parametros?.estado || '',
        usuario: parametros?.usuario || '',
        parametro: parametros?.parametro || '',
        activo: parametros?.activo || ''
      },
      headers: this.getToken
    });
  }

  // Actualizar movimiento
  actualizarMovimiento(id: string, data: any): Observable<any> {
    return this.http.put(`${base_url}/movimientos-internos/${id}`, data, {
      headers: this.getToken
    });
  }

  // Alta/Baja de movimiento
  altaBajaMovimiento(id: string, data: any): Observable<any> {
    return this.http.put(`${base_url}/movimientos-internos/alta-baja-movimiento/${id}`, data, {
      headers: this.getToken
    });
  }

}
