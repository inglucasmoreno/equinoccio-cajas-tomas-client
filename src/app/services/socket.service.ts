import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  constructor(private socket: Socket) {}
 
  // Envio - Finalizar un examen
  finalizarExamen(data: any): void {
    this.socket.emit('finalizar-examen', data);
  }
  
  // Emision - Actualizar lista de examenes por razones generales
  listarExamenes(data: any): void {
    this.socket.emit('listar-examenes', data); 
  }

  // Recepcion - Actualizar lista de examenes por razones generales
  getListarExamenes(): Observable<any> {
    return this.socket.fromEvent<string>('listar-examenes'); 
  }

  // Recepcion - Mensaje para finalizar examen
  getFinalizar(): Observable<any> {
    return this.socket.fromEvent<string>('r-finalizar-examen');
  }

  // Envio - Examen finalizado
  examenFinalizado(data: any): void {
    this.socket.emit('examen-finalizado', data);
  }

  // Recepcion - Examen finalizado
  getFinalizado(): Observable<any>{
    return this.socket.fromEvent<string>('r-examen-finalizado');
  }

}
