import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { StorageService } from './services/storage.service';

@Injectable({providedIn: 'root'})
export class forwarderGuard implements CanActivate {

  constructor(
    private router: Router,
    private storageService: StorageService
  ) { }

  canActivate(route: ActivatedRouteSnapshot) {
    const domain = route.queryParams.domain;
    this.storageService.setDomain(domain);

    this.router.navigate([`index.html`]);
    return false;
  }
}
