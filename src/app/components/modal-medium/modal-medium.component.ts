import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-modal-medium',
  templateUrl: './modal-medium.component.html',
  styles: [
  ]
})
export class ModalMediumComponent implements OnInit {

  @Input() showModal = false; // Control de modal

  constructor() { }

  ngOnInit(): void {
  }

}
