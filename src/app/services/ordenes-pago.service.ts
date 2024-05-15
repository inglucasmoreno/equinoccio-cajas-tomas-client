import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class OrdenesPagoService {

  get getToken(): any {
    return {
      'Authorization': localStorage.getItem('token')
    };
  }
  
  constructor(private http: HttpClient) { }

  // Nuevo orden de pago
  nuevaOrdenPago(data: any): Observable<any> {
    return this.http.post(`${base_url}/ordenes-pago`, data, {
      headers: this.getToken
    });
  };

  // Orden de pago por ID
  getOrdenPago(id: string): Observable<any> {
    return this.http.get(`${base_url}/ordenes-pago/${id}`, {
      headers: this.getToken
    });
  };

  // Generar PDF
  generarPDF(data: any): Observable<any> {
    return this.http.post(`${base_url}/ordenes-pago/generarPDF`, data, {
      headers: this.getToken
    });
  };

  // Listar ordenes de pago
  listarOrdenesPago(parametros?: any): Observable<any> {
    return this.http.get(`${base_url}/ordenes-pago`, {
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

  // Actualizar orden de pago
  actualizarOrdenPago(id: string, data: any): Observable<any> {
    return this.http.put(`${base_url}/ordenes-pago/${id}`, data, {
      headers: this.getToken
    });
  }  

}
