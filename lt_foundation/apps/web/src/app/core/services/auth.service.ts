import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

export type UserRole = 'ADMIN' | 'ENGINEER' | 'REVIEWER' | 'VIEWER';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

interface RefreshResponse {
  accessToken: string;
}

const ACCESS_KEY = 'lt_access_token';
const REFRESH_KEY = 'lt_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _user = signal<AuthUser | null>(null);
  private _accessToken: string | null = localStorage.getItem(ACCESS_KEY);

  readonly currentUser = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  getAccessToken(): string | null {
    return this._accessToken;
  }

  async login(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<LoginResponse>('/api/v1/auth/login', { email, password }),
    );
    this._accessToken = res.accessToken;
    localStorage.setItem(ACCESS_KEY, res.accessToken);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    this._user.set(res.user);
  }

  async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return false;
    try {
      const res = await firstValueFrom(
        this.http.post<RefreshResponse>('/api/v1/auth/refresh', { refreshToken }),
      );
      this._accessToken = res.accessToken;
      localStorage.setItem(ACCESS_KEY, res.accessToken);
      return true;
    } catch {
      this.clearSession();
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post('/api/v1/auth/logout', {}));
    } finally {
      this.clearSession();
      this.router.navigate(['/login']);
    }
  }

  hasRole(...roles: UserRole[]): boolean {
    const user = this._user();
    return user ? roles.includes(user.role) : false;
  }

  private clearSession(): void {
    this._accessToken = null;
    this._user.set(null);
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
}
