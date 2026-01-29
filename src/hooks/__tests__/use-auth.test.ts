/**
 * Unit tests for useAuth hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../use-auth';

const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
        const sub = mockOnAuthStateChange(callback);
        return { data: { subscription: { unsubscribe: () => sub?.unsubscribe?.() } } };
      },
      signInWithPassword: (opts: { email: string; password: string }) => mockSignInWithPassword(opts),
      signUp: (opts: unknown) => mockSignUp(opts),
      signOut: (opts?: { scope: string }) => mockSignOut(opts),
    },
  },
}));

const mockT = vi.fn((key: string, fallback?: string) => fallback ?? key);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: {},
  }),
}));

describe('useAuth', () => {
  const mockUser = { id: 'user-1', email: 'test@example.com' };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });
    mockOnAuthStateChange.mockImplementation(() => ({
      unsubscribe: vi.fn(),
    }));
  });

  it('should start with loading then no user when no session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should set user when session exists', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: mockUser } },
    });
    mockOnAuthStateChange.mockImplementation(() => ({
      unsubscribe: vi.fn(),
    }));
    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should login successfully with valid credentials', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockSignInWithPassword.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockOnAuthStateChange.mockImplementation((cb: (e: string, s: unknown) => void) => {
      setTimeout(() => cb('SIGNED_IN', { user: mockUser }), 0);
      return { unsubscribe: vi.fn() };
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let loginResult: { success: boolean; error?: string } = { success: false };
    await act(async () => {
      loginResult = await result.current.login('test@example.com', 'password123');
    });

    expect(loginResult.success).toBe(true);
    expect(loginResult.error).toBeUndefined();
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should return error on invalid login credentials', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    });
    mockT.mockReturnValue('Invalid email or password');

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let loginResult: { success: boolean; error?: string } = { success: true };
    await act(async () => {
      loginResult = await result.current.login('test@example.com', 'wrong');
    });

    expect(loginResult.success).toBe(false);
    expect(loginResult.error).toBe('Invalid email or password');
    expect(result.current.error).toBe('Invalid email or password');
  });

  it('should handle rate limit errors', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { status: 429, message: 'Rate limit exceeded' },
    });
    mockT.mockReturnValue('Too many attempts. Please try again later.');

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let loginResult: { success: boolean; error?: string } = { success: true };
    await act(async () => {
      loginResult = await result.current.login('test@example.com', 'password');
    });

    expect(loginResult.success).toBe(false);
    expect(result.current.error).toContain('try again');
  });

  it('should register successfully', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockSignUp.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let registerResult: { success: boolean; error?: string } = { success: false };
    await act(async () => {
      registerResult = await result.current.register('new@example.com', 'password123', 'Display Name');
    });

    expect(registerResult.success).toBe(true);
    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'password123',
      options: {
        data: {
          display_name: 'Display Name',
          username: 'new',
        },
      },
    });
  });

  it('should logout and clear user', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } });
    mockOnAuthStateChange.mockImplementation(() => ({ unsubscribe: vi.fn() }));
    mockSignOut.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.user).toEqual(mockUser);

    await act(async () => {
      await result.current.logout();
    });

    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBe('');
  });

  it('should clear error when clearError is called', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    });
    mockT.mockReturnValue('Invalid credentials');

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.login('test@example.com', 'wrong');
    });
    expect(result.current.error).toBe('Invalid credentials');

    act(() => {
      result.current.clearError();
    });
    expect(result.current.error).toBe('');
  });
});
