import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  onIdTokenChanged: (auth, cb) => {
    global.mockTriggerAuthChange = cb;
    return () => {};
  },
  signOut: jest.fn(),
  GoogleAuthProvider: jest.fn(() => ({ addScope: jest.fn() })),
}));

describe('AuthContext RBAC', () => {
  function TestComponent() {
    const { currentUser, userRoles, primaryRole, hasRole, hasAnyRole, roleGreaterOrEqual } = useAuth();
    return (
      <div>
        <span data-testid="role">{primaryRole}</span>
        <span data-testid="roles">{userRoles.join(',')}</span>
        <span data-testid="has-admin">{hasRole('admin') ? 'yes' : 'no'}</span>
        <span data-testid="hasAny-admin-mod">{hasAnyRole(['admin','moderator']) ? 'yes' : 'no'}</span>
        <span data-testid="gte-admin">{roleGreaterOrEqual('admin') ? 'yes' : 'no'}</span>
      </div>
    );
  }

  function setup(claims = {}) {
    return render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
  }

  it('extracts superadmin role and passes RBAC checks', async () => {
    setup();
    global.mockTriggerAuthChange({
      uid: 'u1',
      email: 's@admin.com',
      getIdToken: async () => 'tok',
      getIdTokenResult: async () => ({ claims: { superadmin: true } }),
      displayName: 'Super Admin',
      photoURL: '',
      emailVerified: true,
      providerData: [],
    });
    await waitFor(() => {
      expect(document.querySelector('[data-testid="role"]').textContent).toBe('superadmin');
      expect(document.querySelector('[data-testid="has-admin"]').textContent).toBe('no'); // direct 'admin' claim not set
      expect(document.querySelector('[data-testid="gte-admin"]').textContent).toBe('yes'); // superadmin >= admin
    });
  });

  it('extracts admin role and passes RBAC checks', async () => {
    setup();
    global.mockTriggerAuthChange({
      uid: 'u2',
      email: 'a@admin.com',
      getIdToken: async () => 'tok',
      getIdTokenResult: async () => ({ claims: { admin: true } }),
      displayName: 'Admin',
      photoURL: '',
      emailVerified: true,
      providerData: [],
    });
    await waitFor(() => {
      expect(document.querySelector('[data-testid="role"]').textContent).toBe('admin');
      expect(document.querySelector('[data-testid="has-admin"]').textContent).toBe('yes');
      expect(document.querySelector('[data-testid="gte-admin"]').textContent).toBe('yes');
    });
  });

  it('extracts moderator role and passes RBAC checks', async () => {
    setup();
    global.mockTriggerAuthChange({
      uid: 'u3',
      email: 'm@mod.com',
      getIdToken: async () => 'tok',
      getIdTokenResult: async () => ({ claims: { moderator: true } }),
      displayName: 'Mod',
      photoURL: '',
      emailVerified: true,
      providerData: [],
    });
    await waitFor(() => {
      expect(document.querySelector('[data-testid="role"]').textContent).toBe('moderator');
      expect(document.querySelector('[data-testid="has-admin"]').textContent).toBe('no');
      expect(document.querySelector('[data-testid="hasAny-admin-mod"]').textContent).toBe('yes');
      expect(document.querySelector('[data-testid="gte-admin"]').textContent).toBe('no');
    });
  });

  it('extracts roles from roles array', async () => {
    setup();
    global.mockTriggerAuthChange({
      uid: 'u4',
      email: 'multi@roles.com',
      getIdToken: async () => 'tok',
      getIdTokenResult: async () => ({ claims: { roles: ['moderator','user'] } }),
      displayName: 'Multi',
      photoURL: '',
      emailVerified: true,
      providerData: [],
    });
    await waitFor(() => {
      expect(document.querySelector('[data-testid="role"]').textContent).toBe('moderator');
      expect(document.querySelector('[data-testid="roles"]').textContent).toBe('moderator,user');
    });
  });

  it('handles fallback admin by email', async () => {
    setup();
    global.mockTriggerAuthChange({
      uid: 'u5',
      email: 'atulsinghdhakad15@gmail.com',
      getIdToken: async () => 'tok',
      getIdTokenResult: async () => ({ claims: {} }),
      displayName: 'Legacy',
      photoURL: '',
      emailVerified: true,
      providerData: [],
    });
    await waitFor(() => {
      expect(document.querySelector('[data-testid="role"]').textContent).toBe('user');
      expect(document.querySelector('[data-testid="has-admin"]').textContent).toBe('yes');
    });
  });
});
