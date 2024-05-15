import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { map } from 'rxjs/operators';

const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  
  public usuario: Usuario;

  constructor(private http: HttpClient) {}

  // Usuario por ID
  getUsuario(id: string): Observable<any>{
    return this.http.get(`${base_url}/usuarios/${id}`, {
      headers: {
        'Authorization': localStorage.getItem('token')
      }
    }).pipe(
      map((resp: any) => resp.usuario)
    )
  } 

  // Listar usuarios
  listarUsuarios( direccion : number = 1, columna: string = 'apellido' ): Observable<any>{
    return this.http.get(`${base_url}/usuarios`, {
      params: {
        direccion: String(direccion),
        columna              
      },
      headers: {
        'Authorization': localStorage.getItem('token')
      }      
    })
  }

  // Nuevo usuario
  nuevoUsuario(data: any): Observable<any>{
    return this.http.post(`${base_url}/usuarios`, data, {
      headers: {
        'Authorization': localStorage.getItem('token')
      }
    })  
  }

  // Actualizar usuario
  actualizarUsuario(id: string, data: any): Observable<any>{
    return this.http.put(`${base_url}/usuarios/${id}`, data, {
      headers: {
        'Authorization': localStorage.getItem('token')
      }  
    })
  }

}
