import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class BancosService {

  get getToken(): any {
    return {
      'Authorization': localStorage.getItem('token')
    };
  }

  constructor(private http: HttpClient) {}

  // Nuevo banco
  nuevoBanco(data: any): Observable<any> {
    return this.http.post(`${base_url}/bancos`, data, {
      headers: this.getToken
    });
  };

  // Banco por ID
  getBanco(id: string): Observable<any> {
    return this.http.get(`${base_url}/bancos/${ id }`,{ 
      headers: this.getToken
    });
  };

  // Listar bancos
  listarBancos(parametros?: any): Observable<any> {
    return this.http.get(`${base_url}/bancos`, {
      params: {
        direccion: parametros?.direccion || 1,
        columna: parametros?.columna || 'descripcion'
      },
      headers: this.getToken
    });
  }

  // Actualizar banco
  actualizarBanco(id:string, data: any): Observable<any> {
    return this.http.put(`${base_url}/bancos/${id}`, data, {
      headers: this.getToken
    });
  }  

}
