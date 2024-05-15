import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class ReportesService {

  get getToken(): any {
    return {
      'Authorization': localStorage.getItem('token')
    };
  }

  constructor(private http: HttpClient) { }

  // REPORETS - EXCEL

  // Reporte -> Compras
  comprasExcel(parametros: {
    fechaDesde: string,
    fechaHasta: string,
    activas: string
  }): Observable<any> {
    return this.http.get(`${base_url}/reportes/excel/compras`, {
      headers: this.getToken,
      responseType: 'blob',
      observe: 'response',
      params: parametros
    });
  }

  // Reporte -> Ventas
  ventasExcel(parametros: { fechaDesde: string, fechaHasta: string, activas: string }): Observable<any> {
    return this.http.get(`${base_url}/reportes/excel/ventas`, {
      headers: this.getToken,
      responseType: 'blob',
      observe: 'response',
      params: parametros
    });
  }

  // Reporte -> Ventas propias
  ventasPropiasExcel(parametros: { fechaDesde: string, fechaHasta: string, activas: string }): Observable<any> {
    return this.http.get(`${base_url}/reportes/excel/ventas-propias`, {
      headers: this.getToken,
      responseType: 'blob',
      observe: 'response',
      params: parametros
    });
  }

  // Reporte -> Recibos cobro
  recibosCobroExcel(parametros: { fechaDesde: string, fechaHasta: string }): Observable<any> {
    return this.http.get(`${base_url}/reportes/excel/recibos-cobro`, {
      headers: this.getToken,
      responseType: 'blob',
      observe: 'response',
      params: parametros
    });
  }

  // Reporte -> Ordenes pago
  ordenesPagoExcel(parametros: { fechaDesde: string, fechaHasta: string }): Observable<any> {
    return this.http.get(`${base_url}/reportes/excel/ordenes-pago`, {
      headers: this.getToken,
      responseType: 'blob',
      observe: 'response',
      params: parametros
    });
  }

  // Reporte -> CC - Proveedores
  cuentasCorrientesProveedoresExcel(parametros: {
    fechaDesde: string,
    fechaHasta: string,
    activas: string
  }): Observable<any> {
    return this.http.get(`${base_url}/reportes/excel/cc-proveedores`, {
      headers: this.getToken,
      responseType: 'blob',
      observe: 'response',
      params: parametros
    });
  }

  // Reporte -> CC - Clientes
  cuentasCorrientesClientesExcel(parametros: {
    fechaDesde: string,
    fechaHasta: string,
    activas: string
  }): Observable<any> {
    return this.http.get(`${base_url}/reportes/excel/cc-clientes`, {
      headers: this.getToken,
      responseType: 'blob',
      observe: 'response',
      params: parametros
    });
  }

  // Reporte -> Movimientos de clientes
  movimientosClientesExcel(parametros: {
    fechaDesde: string,
    fechaHasta: string,
    cliente: string
  }): Observable<any> {
    return this.http.get(`${base_url}/reportes/excel/movimientos-clientes`, {
      headers: this.getToken,
      responseType: 'blob',
      observe: 'response',
      params: parametros
    });
  }

  // Reporte -> Movimientos de proveedores
  movimientosProveedoresExcel(parametros: {
    fechaDesde: string,
    fechaHasta: string,
    proveedor: string
  }): Observable<any> {
    return this.http.get(`${base_url}/reportes/excel/movimientos-proveedores`, {
      headers: this.getToken,
      responseType: 'blob',
      observe: 'response',
      params: parametros
    });
  }

  // Reporte -> Movimientos de cajas
  movimientosCajasExcel(parametros: {
    fechaDesde: string,
    fechaHasta: string,
    caja: string
  }): Observable<any> {
    return this.http.get(`${base_url}/reportes/excel/movimientos-cajas`, {
      headers: this.getToken,
      responseType: 'blob',
      observe: 'response',
      params: parametros
    });
  }

  // Reporte -> Cajas
  cajasExcel(parametros: {
    fechaDesde: string,
    fechaHasta: string,
  }): Observable<any> {
    return this.http.get(`${base_url}/reportes/excel/cajas`, {
      headers: this.getToken,
      responseType: 'blob',
      observe: 'response',
      params: parametros
    });
  }

  // Reporte -> Gastos
  gastosExcel(parametros: any): Observable<any> {
    return this.http.get(`${base_url}/reportes/excel/gastos`, {
      headers: this.getToken,
      responseType: 'blob',
      observe: 'response',
      params: parametros
    });
  }

}
