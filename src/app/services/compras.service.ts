import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class ComprasService {

  get getToken(): any {
    return {
      'Authorization': localStorage.getItem('token')
    };
  }

  constructor(private http: HttpClient) { }

  // Nueva compra
  nuevaCompra(data: any): Observable<any> {
    return this.http.post(`${base_url}/compras`, data, {
      headers: this.getToken
    });
  };

  // Compra por ID
  getCompra(id: string): Observable<any> {
    return this.http.get(`${base_url}/compras/${id}`, {
      headers: this.getToken
    });
  };

  // Listar compras
  listarCompras(parametros?: any): Observable<any> {
    return this.http.get(`${base_url}/compras`, {
      params: {
        columna: parametros?.columna || 'descripcion',
        direccion: parametros?.direccion || 1,
        desde: parametros?.desde || 0,
        registerpp: parametros?.cantidadItems || 10000000,
        activo: parametros?.activo || '',
        parametro: parametros?.parametro || '',
        proveedor: parametros?.proveedor || '',
        cancelada: parametros?.cancelada || '',
      },
      headers: this.getToken
    });
  }

  // Actualizar compra
  actualizarCompra(id: string, data: any): Observable<any> {
    return this.http.put(`${base_url}/compras/${id}`, data, {
      headers: this.getToken
    });
  }

  // Alta/Baja de compra
  altaBajaCompra(id: string, data: any): Observable<any> {
    return this.http.put(`${base_url}/compras/alta-baja/${id}`, data, {
      headers: this.getToken
    });
  }

  // Generar PDF
  generarPDF(data: any): Observable<any> {
    return this.http.post(`${base_url}/compras/generarPDF`, data, {
      headers: this.getToken
    });
  };

  // Generar Excel
  generarExcel(data: any): Observable<any> {
    return this.http.post(`${base_url}/compras/generarExcel`, data, {
      headers: this.getToken
    });
  };

}
