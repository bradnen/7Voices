// Simple auth hook that returns no authentication
export function useAuth() {
  return {
    user: null,
    isLoading: false,
    isAuthenticated: false,
  };
}