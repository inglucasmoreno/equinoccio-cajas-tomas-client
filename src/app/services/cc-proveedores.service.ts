import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class CcProveedoresService {

  get getToken(): any {
    return {
      'Authorization': localStorage.getItem('token')
    };
  }

  constructor(private http: HttpClient) { }

  // Nueva cuenta corriente
  nuevaCuentaCorriente(data: any): Observable<any> {
    return this.http.post(`${base_url}/cc-proveedores`, data, {
      headers: this.getToken
    });
  };

  // Cuenta corriente por ID
  getCuentaCorriente(id: string): Observable<any> {
    return this.http.get(`${base_url}/cc-proveedores/${id}`, {
      headers: this.getToken
    });
  };

  // Cuenta corriente por proveedor
  getCuentaCorrientePorProveedor(idProveedor: string): Observable<any> {
    return this.http.get(`${base_url}/cc-proveedores/proveedor/${idProveedor}`, {
      headers: this.getToken
    });
  };

  // Listar cuentas corrientes
  listarCuentasCorrientes(parametros?: any): Observable<any> {
    return this.http.get(`${base_url}/cc-proveedores`, {
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
  actualizarCuentaCorriente(id: string, data: any): Observable<any> {
    return this.http.put(`${base_url}/cc-proveedores/${id}`, data, {
      headers: this.getToken
    });
  }


}
