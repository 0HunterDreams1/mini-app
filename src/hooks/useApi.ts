import { useState, useCallback } from 'react';
import { apiClient, type ApiError } from '../services/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

/**
 * Hook personalizado para llamadas a la API
 * Maneja automáticamente el estado de carga y errores
 */
export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  /**
   * Realiza una petición GET
   */
  const get = useCallback(async (endpoint: string) => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await apiClient.get<T>(endpoint);
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const apiError = error as ApiError;
      setState({ data: null, loading: false, error: apiError });
      throw apiError;
    }
  }, []);

  /**
   * Realiza una petición POST
   */
  const post = useCallback(async (endpoint: string, body: unknown) => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await apiClient.post<T>(endpoint, body);
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const apiError = error as ApiError;
      setState({ data: null, loading: false, error: apiError });
      throw apiError;
    }
  }, []);

  /**
   * Realiza una petición PUT
   */
  const put = useCallback(async (endpoint: string, body: unknown) => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await apiClient.put<T>(endpoint, body);
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const apiError = error as ApiError;
      setState({ data: null, loading: false, error: apiError });
      throw apiError;
    }
  }, []);

  /**
   * Realiza una petición DELETE
   */
  const remove = useCallback(async (endpoint: string) => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await apiClient.delete<T>(endpoint);
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const apiError = error as ApiError;
      setState({ data: null, loading: false, error: apiError });
      throw apiError;
    }
  }, []);

  return {
    ...state,
    get,
    post,
    put,
    remove,
  };
}
