import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class CajasUsuariosService {

  get getToken(): any {
    return {
      'Authorization': localStorage.getItem('token')
    };
  }

  constructor(private http: HttpClient) { }

  // Nueva caja - usuario
  nuevaCajaUsuario(data: any): Observable<any> {
    return this.http.post(`${base_url}/cajas-usuarios`, data, {
      headers: this.getToken
    });
  };

  // Cajas - Usuarios por ID
  getCajaUsuario(usuarioId: string): Observable<any> {
    return this.http.get(`${base_url}/cajas-usuarios/${usuarioId}`, {
      headers: this.getToken
    });
  };

  // Cajas - Usuarios por usuario
  getCajaUsuarioPorUsuario(id: string): Observable<any> {
    return this.http.get(`${base_url}/cajas-usuarios/usuario/${id}`, {
      headers: this.getToken
    });
  };

  // Cajas - Usuarios por caja
  getCajaUsuarioPorCaja(id: string): Observable<any> {
    return this.http.get(`${base_url}/cajas-usuarios/caja/${id}`, {
      headers: this.getToken
    });
  };

  // Listar cajas - usuarios
  listarCajasUsuarios(parametros?: any): Observable<any> {
    return this.http.get(`${base_url}/cajas-usuarios`, {
      params: {
        direccion: parametros?.direccion || 1,
        columna: parametros?.columna || 'descripcion'
      },
      headers: this.getToken
    });
  }

  // Actualizar caja - usuario
  actualizarCajaUsuario(id: string, data: any): Observable<any> {
    return this.http.put(`${base_url}/cajas-usuarios/${id}`, data, {
      headers: this.getToken
    });
  }

  // Eliminar caja - usuario
  eliminarCajaUsuario(id: string): Observable<any> {
    return this.http.delete(`${base_url}/cajas-usuarios/${id}`, {
      headers: this.getToken
    });
  }

}
