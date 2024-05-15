import { Component, OnInit } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.css']
})
export class LoaderComponent implements OnInit {

  public show = false;
  public showBar = false;

  constructor(private router: Router,
              private dataService: DataService) { }

  ngOnInit(): void {
    this.router.events.subscribe(event => {
      if(event instanceof NavigationStart){ // Comienza la navegacion
        this.show = true;
      }else if(event instanceof NavigationEnd){ // Finaliza la navegacion
        window.scrollTo(0,0);  // Vista en la parte superior de la aplicacion
        this.show = false;
        this.dataService.showMenu = false;
      }
    });
  }
  
}
