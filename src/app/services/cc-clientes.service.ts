import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class CcClientesService {

  get getToken(): any {
    return {
      'Authorization': localStorage.getItem('token')
    };
  }

  constructor(private http: HttpClient) {}

  // Nueva cuenta corriente
  nuevaCuentaCorriente(data: any): Observable<any> {
    return this.http.post(`${base_url}/cc-clientes`, data, {
      headers: this.getToken
    });
  };

  // Cuenta corriente por ID
  getCuentaCorriente(id: string): Observable<any> {
    return this.http.get(`${base_url}/cc-clientes/${ id }`,{ 
      headers: this.getToken
    });
  };

  // Cuenta corriente por cliente
  getCuentaCorrientePorCliente(idCliente: string): Observable<any> {
    return this.http.get(`${base_url}/cc-clientes/cliente/${ idCliente }`,{ 
      headers: this.getToken
    });
  };

  // Listar cuentas corrientes
  listarCuentasCorrientes(parametros?: any): Observable<any> {
    return this.http.get(`${base_url}/cc-clientes`, {
      params: {
        columna: parametros?.columna || 'descripcion',
        direccion: parametros?.direccion || 1,
        desde: parametros?.desde || 0,
        registerpp: parametros?.cantidadItems || 100000,
        activo: parametros?.activo || '',
        parametro: parametros?.parametro || '',
      },
      headers: this.getToken
    });
  }

  // Actualizar cuenta corriente
  actualizarCuentaCorriente(id:string, data: any): Observable<any> {
    return this.http.put(`${base_url}/cc-clientes/${id}`, data, {
      headers: this.getToken
    });
  }  

  // Generar Excel
  generarExcel(): Observable<any> {
    return this.http.get(`${base_url}/cc-clientes/reporte/excel`, {
      headers: this.getToken
    });
  };

}
