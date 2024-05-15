import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-modal-small',
  templateUrl: './modal-small.component.html',
  styles: [
  ]
})
export class ModalSmallComponent implements OnInit {

  @Input() showModal = false; // Control de modal

  constructor() { }

  ngOnInit(): void {
  }

}
