import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class VentasPropiasService {

  get getToken(): any {
    return {
      'Authorization': localStorage.getItem('token')
    };
  }

  constructor(private http: HttpClient) {}

  // Nueva venta
  nuevaVenta(data: any): Observable<any> {
    return this.http.post(`${base_url}/ventas-propias`, data, {
      headers: this.getToken
    });
  };

  // Generar PDF
  generarPDF(data: any): Observable<any> {
    return this.http.post(`${base_url}/ventas-propias/generarPDF`, data, {
      headers: this.getToken
    });
  };

  // Generar Excel
  generarExcel(data: any): Observable<any> {
    return this.http.post(`${base_url}/ventas-propias/reporte/excel`, data, {
      headers: this.getToken
    });
  };

  // Venta por ID
  getVenta(id: string): Observable<any> {
    return this.http.get(`${base_url}/ventas-propias/${ id }`,{ 
      headers: this.getToken
    });
  };

  // Listar ventas
  listarVentas(parametros?: any): Observable<any> {
    return this.http.get(`${base_url}/ventas-propias`, {
      params: {
        columna: parametros?.columna || 'descripcion',
        direccion: parametros?.direccion || 1,
        desde: parametros?.desde || 0,
        registerpp: parametros?.cantidadItems || 1000000,
        activo: parametros?.activo || '',
        parametro: parametros?.parametro || '',
        cliente: parametros?.cliente || '',
        cancelada: parametros?.cancelada || '',
      },
      headers: this.getToken
    });
  }

  // Actualizar ventas
  actualizarVenta(id:string, data: any): Observable<any> {
    return this.http.put(`${base_url}/ventas-propias/${id}`, data, {
      headers: this.getToken
    });
  }   
  
  // Alta/Baja de venta propia
  altaBajaVenta(id:string, data: any): Observable<any> {
    return this.http.put(`${base_url}/ventas-propias/alta-baja/${id}`, data, {
      headers: this.getToken
    });
  }   

}
