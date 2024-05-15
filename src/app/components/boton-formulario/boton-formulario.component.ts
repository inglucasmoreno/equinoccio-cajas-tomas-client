import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-boton-formulario',
  templateUrl: './boton-formulario.component.html',
  styles: [
  ]
})
export class BotonFormularioComponent implements OnInit {

  @Input() texto: string = 'Texto por defecto';
  @Input() deshabilitado: boolean = false; // Deshabilitar accion de boton

  constructor() { }

  ngOnInit(): void {
  }

}
