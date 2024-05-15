import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-pastilla-pendiente-completado',
  templateUrl: './pastilla-pendiente-completado.component.html',
  styles: [
  ]
})
export class PastillaPendienteCompletadoComponent implements OnInit {

  constructor() { }

  @Input() activo: boolean = true;

  ngOnInit(): void {
  }

}
