import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-encabezado-formulario',
  templateUrl: './encabezado-formulario.component.html',
  styles: [
  ]
})
export class EncabezadoFormularioComponent implements OnInit {

  @Input() titulo: string;
  @Input() subTitulo: string; 
  @Input() dirRegresar: string;

  constructor() { }

  ngOnInit(): void {}

}
