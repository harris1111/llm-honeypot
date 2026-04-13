import type { LoginRequest, RegisterRequest } from '@llmtrap/shared';
import { useMutation } from '@tanstack/react-query';
import { startTransition } from 'react';

import { apiClient } from '../lib/api-client';
import { useAuthStore } from '../lib/auth-store';

export function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setSession = useAuthStore((state) => state.setSession);
  const setTotpChallenge = useAuthStore((state) => state.setTotpChallenge);
  const setUser = useAuthStore((state) => state.setUser);
  const tempToken = useAuthStore((state) => state.tempToken);
  const user = useAuthStore((state) => state.user);

  const handleSuccess = (response: Awaited<ReturnType<typeof apiClient.login>>) => {
    startTransition(() => {
      if (response.requiresTotp) {
        setTotpChallenge(response.tempToken);
        return;
      }

      setSession(response.tokens, response.user);
    });
  };

  const login = useMutation({
    mutationFn: (input: LoginRequest) => apiClient.login(input),
    onSuccess: handleSuccess,
  });

  const register = useMutation({
    mutationFn: (input: RegisterRequest) => apiClient.register(input),
    onSuccess: handleSuccess,
  });

  const logout = useMutation({
    mutationFn: async () => {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        await apiClient.logout(refreshToken);
      }
    },
    onSettled: () => {
      startTransition(() => {
        clearSession();
      });
    },
  });

  const setupTotp = useMutation({
    mutationFn: () => apiClient.setupTotp(),
  });

  const enableTotp = useMutation({
    mutationFn: (code: string) => apiClient.enableTotp({ code }),
    onSuccess: (nextUser) => {
      startTransition(() => {
        setUser(nextUser);
      });
    },
  });

  const verifyTotp = useMutation({
    mutationFn: async (code: string) => {
      const nextTempToken = useAuthStore.getState().tempToken;

      if (!nextTempToken) {
        throw new Error('TOTP challenge is missing');
      }

      return apiClient.verifyTotp({ code, tempToken: nextTempToken });
    },
    onSuccess: handleSuccess,
  });

  return {
    accessToken,
    enableTotp,
    isAuthenticated: Boolean(accessToken),
    login,
    logout,
    register,
    setupTotp,
    tempToken,
    user,
    verifyTotp,
  };
}