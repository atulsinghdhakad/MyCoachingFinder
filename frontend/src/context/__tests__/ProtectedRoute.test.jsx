import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import ProtectedRoute from '../../routes/ProtectedAdminRoute';

const Dummy = () => <div>Protected</div>;
const Login = () => <div>Login Page</div>;

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users', () => {
    render(
      <AuthContext.Provider value={{ user: null, roleGreaterOrEqual: () => false, hasRole: () => false, hasAnyRole: () => false }}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/protected" element={<ProtectedRoute><Dummy /></ProtectedRoute>} />
            <Route path="/adminlogin" element={<Login />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders child if user is authenticated', () => {
    render(
      <AuthContext.Provider value={{ user: { uid: '123', emailVerified: true }, roleGreaterOrEqual: () => true, hasRole: () => true, hasAnyRole: () => true }}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/protected" element={<ProtectedRoute><Dummy /></ProtectedRoute>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Protected')).toBeInTheDocument();
  });
});