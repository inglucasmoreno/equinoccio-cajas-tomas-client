import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styles: [
  ]
})
export class ItemsComponent implements OnInit {

  constructor() { }

  @Input() item: string;
  @Input() route: string;
  @Input() routerLinkActive: string = 'bg-yellow-100 text-yellow-600 rounded';
  @Input() svg: string;

  ngOnInit(): void {
  }

}
