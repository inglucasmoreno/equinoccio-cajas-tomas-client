import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class FamiliaProductosService {
  
  get getToken(): any {
    return {
      'Authorization': localStorage.getItem('token')
    };
  }

  constructor(private http: HttpClient) {}

  // Nueva familia
  nuevaFamilia(data: any): Observable<any> {
    return this.http.post(`${base_url}/familia-productos`, data, {
      headers: this.getToken
    });
  };

  // Familia por ID
  getFamilia(id: string): Observable<any> {
    return this.http.get(`${base_url}/familia-productos/${ id }`,{ 
      headers: this.getToken
    });
  };

  // Listar familias
  listarFamilias(parametros?: any): Observable<any> {
    return this.http.get(`${base_url}/familia-productos`, {
      params: {
        direccion: parametros?.direccion || 1,
        columna: parametros?.columna || 'descripcion'
      },
      headers: this.getToken
    });
  }

  // Actualizar familia
  actualizarFamilia(id:string, data: any): Observable<any> {
    return this.http.put(`${base_url}/familia-productos/${id}`, data, {
      headers: this.getToken
    });
  }  

}
