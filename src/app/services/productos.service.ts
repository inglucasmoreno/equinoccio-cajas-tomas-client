import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  get getToken(): any {
    return {
      'Authorization': localStorage.getItem('token')
    };
  }

  constructor(private http: HttpClient) {}

  // Nuevo producto
  nuevoProducto(data: any): Observable<any> {
    return this.http.post(`${base_url}/productos`, data, {
      headers: this.getToken
    });
  };

  // Producto por ID
  getProducto(id: string): Observable<any> {
    return this.http.get(`${base_url}/productos/${ id }`,{ 
      headers: this.getToken
    });
  };

  // Listar productos
  listarProductos(parametros?: any): Observable<any> {
    return this.http.get(`${base_url}/productos`, {
      params: {
        columna: parametros?.columna || 'descripcion',
        direccion: parametros?.direccion || 1,
        desde: parametros?.desde || 0,
        registerpp: parametros?.cantidadItems || 100000,
        activo: parametros?.activo || '',
        parametro: parametros?.parametro || '',
        alerta_stock: parametros?.alerta_stock || false,
        alerta_cantidad_negativa: parametros?.alerta_cantidad_negativa || false,   
      },
      headers: this.getToken
    });
  }

  // Actualizar productos
  actualizarProducto(id:string, data: any): Observable<any> {
    return this.http.put(`${base_url}/productos/${id}`, data, {
      headers: this.getToken
    });
  }  

}
