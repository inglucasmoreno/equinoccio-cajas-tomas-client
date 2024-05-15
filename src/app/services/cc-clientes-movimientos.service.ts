import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class CcClientesMovimientosService {

  get getToken(): any {
    return {
      'Authorization': localStorage.getItem('token')
    };
  }

  constructor(private http: HttpClient) {}

  // Nuevo movimiento
  nuevoMovimiento(data: any): Observable<any> {
    return this.http.post(`${base_url}/cc-clientes-movimientos`, data, {
      headers: this.getToken
    });
  };

  // Movimiento por ID
  getMovimiento(id: string): Observable<any> {
    return this.http.get(`${base_url}/cc-clientes-movimientos/${ id }`,{ 
      headers: this.getToken
    });
  };

  // Listar movimientos
  listarMovimientos(parametros?: any): Observable<any> {
    return this.http.get(`${base_url}/cc-clientes-movimientos`, {
      params: {
        columna: parametros?.columna || 'descripcion',
        direccion: parametros?.direccion || 1,
        desde: parametros?.desde || 0,
        registerpp: parametros?.cantidadItems || 100000,
        activo: parametros?.activo || '',
        parametro: parametros?.parametro || '',
        cc_cliente: parametros?.cc_cliente || '',
      },
      headers: this.getToken
    });
  }

  // Actualizar movimientos
  actualizarMovimiento(id:string, data: any): Observable<any> {
    return this.http.put(`${base_url}/cc-clientes-movimientos/${id}`, data, {
      headers: this.getToken
    });
  }  

}
