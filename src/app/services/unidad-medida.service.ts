import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class UnidadMedidaService {

  get getToken(): any {
    return {
      'Authorization': localStorage.getItem('token')
    };
  }

  constructor(private http: HttpClient) {}

  // Nueva unidad de medida
  nuevaUnidad(data: any): Observable<any> {
    return this.http.post(`${base_url}/unidad-medida`, data, {
      headers: this.getToken
    });
  };

  // Unidad de medida por ID
  getUnidad(id: string): Observable<any> {
    return this.http.get(`${base_url}/unidad-medida/${ id }`,{ 
      headers: this.getToken
    });
  };

  // Listar unidades de medida
  listarUnidades(parametros?: any): Observable<any> {
    return this.http.get(`${base_url}/unidad-medida`, {
      params: {
        direccion: parametros?.direccion || 1,
        columna: parametros?.columna || 'descripcion'
      },
      headers: this.getToken
    });
  }

  // Actualizar unidad de medida
  actualizarUnidad(id:string, data: any): Observable<any> {
    return this.http.put(`${base_url}/unidad-medida/${id}`, data, {
      headers: this.getToken
    });
  }  

}
