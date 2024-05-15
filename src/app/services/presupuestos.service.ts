import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class PresupuestosService {

  get getToken(): any {
    return {
      'Authorization': localStorage.getItem('token')
    };
  }

  constructor(private http: HttpClient) {}

  // Nuevo presupuesto
  nuevoPresupuesto(data: any): Observable<any> {
    return this.http.post(`${base_url}/presupuestos`, data, {
      headers: this.getToken
    });
  };

  // Generar PDF
  generarPDF(data: any): Observable<any> {
    return this.http.post(`${base_url}/presupuestos/generarPDF`, data, {
      headers: this.getToken
    });
  };

  // Presupuesto por ID
  getPresupuesto(id: string): Observable<any> {
    return this.http.get(`${base_url}/presupuestos/${ id }`,{ 
      headers: this.getToken
    });
  };

  // Listar presupuestos
  listarPresupuestos(parametros?: any): Observable<any> {
    return this.http.get(`${base_url}/presupuestos`, {
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

  // Actualizar presupuestos
  actualizarPresupuesto(id:string, data: any): Observable<any> {
    return this.http.put(`${base_url}/presupuestos/${id}`, data, {
      headers: this.getToken
    });
  }  

}
