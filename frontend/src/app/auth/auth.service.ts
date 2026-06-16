import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService, UserProfileDTO } from '../core/services/api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser: UserProfileDTO | null = null;

  constructor(private api: ApiService, private router: Router) {}

  isAuthenticated(): Observable<boolean> {
    if (this.currentUser) return of(true);
    return this.api.get<UserProfileDTO>('/auth/me').pipe(
      map(res => {
        if (res.success && res.data) {
          this.currentUser = res.data;
          return true;
        }
        return false;
      }),
      catchError(() => of(false))
    );
  }

  getUser(): UserProfileDTO | null {
    return this.currentUser;
  }

  handleCallback(): Observable<UserProfileDTO | null> {
    return this.api.get<UserProfileDTO>('/auth/callback').pipe(
      map(res => {
        if (res.success && res.data) {
          this.currentUser = res.data;
          return res.data;
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  loginWithGoogle(): void {
    window.location.href = '/oauth2/authorization/google';
  }

  logout(): void {
    this.currentUser = null;
    window.location.href = '/logout';
  }
}
