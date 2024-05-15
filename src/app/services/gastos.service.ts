import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class GastosService {

  get getToken(): any {
    return {
      'Authorization': localStorage.getItem('token')
    };
  }

  constructor(private http: HttpClient) { }

  // Nuevo gasto
  nuevoGasto(data: any): Observable<any> {
    return this.http.post(`${base_url}/gastos`, data, {
      headers: this.getToken
    });
  };

  // Gasto por ID
  getGasto(id: string): Observable<any> {
    return this.http.get(`${base_url}/gastos/${id}`, {
      headers: this.getToken
    });
  };

  // Listar gastos
  listarGastos(parametros?: any): Observable<any> {
    return this.http.get(`${base_url}/gastos`, {
      params: {
        columna: parametros?.columna || 'descripcion',
        creatorUser: parametros?.creatorUser || '',
        direccion: parametros?.direccion || 1,
        desde: parametros?.desde || 0,
        registerpp: parametros?.cantidadItems || 100000,
        activo: parametros?.activo || '',
        parametro: parametros?.parametro || '',
        factura: parametros?.factura || '',
        caja: parametros?.caja || '',
        tipo_gasto: parametros?.tipo_gasto || ''
      },
      headers: this.getToken
    });
  }

  // Actualizar gasto
  actualizarGasto(id: string, data: any): Observable<any> {
    return this.http.put(`${base_url}/gastos/${id}`, data, {
      headers: this.getToken
    });
  }

  // Alta/Baja gasto
  altaBajaGasto(id: string, data: any): Observable<any> {
    return this.http.put(`${base_url}/gastos/alta-baja/${id}`, data, {
      headers: this.getToken
    });
  }


}
