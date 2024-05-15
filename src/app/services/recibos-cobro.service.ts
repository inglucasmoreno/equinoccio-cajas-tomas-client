import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class RecibosCobroService {
  get getToken(): any {
    return {
      'Authorization': localStorage.getItem('token')
    };
  }

  constructor(private http: HttpClient) {}

  // Nuevo recibo de cobro
  nuevoRecibo(data: any): Observable<any> {
    return this.http.post(`${base_url}/recibos-cobro`, data, {
      headers: this.getToken
    });
  };

  // Recibo cobro por ID
  getRecibo(id: string): Observable<any> {
    return this.http.get(`${base_url}/recibos-cobro/${ id }`,{ 
      headers: this.getToken
    });
  };

  // Generar PDF
  generarPDF(data: any): Observable<any> {
    return this.http.post(`${base_url}/recibos-cobro/generarPDF`, data, {
      headers: this.getToken
    });
  };

  // Listar recibos de cobro
  listarRecibos(parametros?: any): Observable<any> {
    return this.http.get(`${base_url}/recibos-cobro`, {
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

  // Actualizar recibo de cobro
  actualizarRecibo(id:string, data: any): Observable<any> {
    return this.http.put(`${base_url}/recibos-cobro/${id}`, data, {
      headers: this.getToken
    });
  }  
  
}
