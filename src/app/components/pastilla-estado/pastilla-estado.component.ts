import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-pastilla-estado',
  templateUrl: './pastilla-estado.component.html',
  styles: [
  ]
})
export class PastillaEstadoComponent implements OnInit {

  constructor() { }

  @Input() activo: boolean = true;

  ngOnInit(): void {}

}
