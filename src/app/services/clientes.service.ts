import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class ClientesService {

  get getToken(): any {
    return {
      'Authorization': localStorage.getItem('token')
    };
  }

  constructor(private http: HttpClient) {}

  // Nuevo cliente
  nuevoCliente(data: any): Observable<any> {
    return this.http.post(`${base_url}/clientes`, data, {
      headers: this.getToken
    });
  };

  // Cliente por ID
  getCliente(id: string): Observable<any> {
    return this.http.get(`${base_url}/clientes/${ id }`,{ 
      headers: this.getToken
    });
  };

  // Cliente por Identificacion
  getClienteIdentificacion(identificacion: string): Observable<any> {
    return this.http.get(`${base_url}/clientes/identificacion/${ identificacion }`,{ 
      headers: this.getToken
    });
  };

  // Listar clientes
  listarClientes(parametros?: any): Observable<any> {
    return this.http.get(`${base_url}/clientes`, {
      params: {
        direccion: parametros?.direccion || 1,
        columna: parametros?.columna || 'descripcion',
        desde: parametros?.desde || 0,
        registerpp: parametros?.cantidadItems || 100000,
        activo: parametros?.activo || '',
        parametro: parametros?.parametro || '',
      },
      headers: this.getToken
    });
  }

  // Actualizar clientes
  actualizarCliente(id:string, data: any): Observable<any> {
    return this.http.put(`${base_url}/clientes/${id}`, data, {
      headers: this.getToken
    });
  }  

  
}
