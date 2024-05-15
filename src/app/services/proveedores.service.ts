import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {


  get getToken(): any {
    return {
      'Authorization': localStorage.getItem('token')
    };
  }

  constructor(private http: HttpClient) {}

  // Nuevo proveedor
  nuevoProveedor(data: any): Observable<any> {
    return this.http.post(`${base_url}/proveedores`, data, {
      headers: this.getToken
    });
  };

  // Proveedor por ID
  getProveedor(id: string): Observable<any> {
    return this.http.get(`${base_url}/proveedores/${ id }`,{ 
      headers: this.getToken
    });
  };

  // Listar proveedores
  listarProveedores(parametros?: any): Observable<any> {
    return this.http.get(`${base_url}/proveedores`, {
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

  // Actualizar proveedores
  actualizarProveedor(id:string, data: any): Observable<any> {
    return this.http.put(`${base_url}/proveedores/${id}`, data, {
      headers: this.getToken
    });
  }  

}
