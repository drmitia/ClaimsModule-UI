import { Injectable, signal } from '@angular/core';
import { MockUser, UserRole } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly mockUsers: MockUser[] = [
    {
      id: 'A0000000-0000-0000-0000-000000000001',
      name: 'John Handler',
      role: 'Handler',
    },
    {
      id: 'A0000000-0000-0000-0000-000000000002',
      name: 'Jane Supervisor',
      role: 'Supervisor',
    },
    {
      id: 'A0000000-0000-0000-0000-000000000003',
      name: 'Bob Manager',
      role: 'Manager',
    },
  ];

  // Angular signals for reactive state
  currentUser = signal<MockUser>(this.mockUsers[0]);

  getUsers(): MockUser[] {
    return this.mockUsers;
  }

  switchUser(userId: string): void {
    const user = this.mockUsers.find(u => u.id === userId);
    if (user) this.currentUser.set(user);
  }

  getUserHeader(): string {
    return this.currentUser().role.toLowerCase();
  }

  hasRole(...roles: UserRole[]): boolean {
    return roles.includes(this.currentUser().role);
  }

  canApproveReserves(): boolean {
    return this.hasRole('Supervisor', 'Manager');
  }
}