import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class MovimientosService {

  get getToken(): any {
    return {
      'Authorization': localStorage.getItem('token')
    };
  }

  constructor(private http: HttpClient) {}

  // Inicializacion movimientos
  initMovimientos(): Observable<any> {
    return this.http.get(`${base_url}/movimientos/inicializacion/seccion`, {
      headers: this.getToken
    });
  };

  // Nuevo movimiento
  nuevoMovimiento(data: any): Observable<any> {
    return this.http.post(`${base_url}/movimientos`, data, {
      headers: this.getToken
    });
  };

  // Movimientos por ID
  getMovimiento(id: string): Observable<any> {
    return this.http.get(`${base_url}/movimientos/${ id }`,{ 
      headers: this.getToken
    });
  };

  // Listar movimientos
  listarMovimientos(
    direccion : number = -1, 
    columna: string = 'createdAt',
    desde: number = 0,
    registerpp: number = 10,
    activo: string = '',
    parametro: string = '',
    tipo_movimiento: string = ''
    ): Observable<any> {
    return this.http.get(`${base_url}/movimientos`, {
      params: {
        columna,
        desde,
        registerpp,
        parametro,
        direccion: String(direccion),
        activo,
        tipo_movimiento
      },
      headers: this.getToken
    });
  }

  // Actualizar movimiento
  actualizarMovimiento(id:string, data: any): Observable<any> {
    return this.http.put(`${base_url}/movimientos/${id}`, data, {
      headers: this.getToken
    });
  }  

}
