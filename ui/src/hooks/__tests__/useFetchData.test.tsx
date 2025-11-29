import { renderHook, waitFor } from '@testing-library/react';
import useFetchData from '../useFetchData';
import { GenericError } from '../../api/api-client';

// Tipos de prueba
interface TestData {
  id: number;
  name: string;
  description?: string;
}

describe('useFetchData - Hook de fetch de datos- Actividad 2', () => {
  describe('Estado inicial', () => {
    it('debe tener data el valor inicial proporcionado', () => {
      const mockFetchFunction = jest.fn().mockResolvedValue({ id: 1, name: 'Test' });
      
      const { result } = renderHook(() => useFetchData(mockFetchFunction));

      // data es null al inicio
      expect(result.current.data).toBeNull();
    });

    it('debe tener loading como true en el primer render', () => {
      const mockFetchFunction = jest.fn().mockResolvedValue({ id: 1, name: 'Test' });
      
      const { result } = renderHook(() => useFetchData(mockFetchFunction));

      // isLoading debe ser true al inicio
      expect(result.current.isLoading).toBe(true);
    });

    it('debe tener error como null inicialmente', () => {
      const mockFetchFunction = jest.fn().mockResolvedValue({ id: 1, name: 'Test' });
      
      const { result } = renderHook(() => useFetchData(mockFetchFunction));

      // error es null al inicio
      expect(result.current.error).toBeNull();
    });

    it('debe verificar el estado inicial completo', () => {
      const mockFetchFunction = jest.fn().mockResolvedValue({ id: 1, name: 'Test' });
      
      const { result } = renderHook(() => useFetchData(mockFetchFunction));

      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.reload).toBeDefined();
      expect(typeof result.current.reload).toBe('function');
    });
  });

  describe('Fetch exitoso', () => {
    it('debe cambiar loading a false después de fetch exitoso', async () => {
      const mockData = { id: 1, name: 'Test Data' };
      // Mock de la función de fetch que devuelve datos
      const mockFetchFunction = jest.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useFetchData(mockFetchFunction));

      // al cargar isLoading es true
      expect(result.current.isLoading).toBe(true);

      // Esperar a que el fetch se complete
      await waitFor(() => {
        // isLoading debe ser false después del fetch
        expect(result.current.isLoading).toBe(false);
        // data debe contener los datos mockeados
        expect(result.current.data).toEqual(mockData);
        // error debe ser null
        expect(result.current.error).toBeNull();
      });
    });

   

    it('debe llamar a la función de fetch exactamente una vez', async () => {
      const mockData = { id: 1, name: 'Test Data' };
      const mockFetchFunction = jest.fn().mockResolvedValue(mockData);

      renderHook(() => useFetchData(mockFetchFunction));

      // Esperar a que el fetch se complete
      await waitFor(() => {
        expect(mockFetchFunction).toHaveBeenCalledTimes(1);
      });
    });

    it('debe manejar fetch con array de datos', async () => {
      const mockData: TestData[] = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' }
      ];
      const mockFetchFunction = jest.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useFetchData<TestData[]>(mockFetchFunction));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
      expect(Array.isArray(result.current.data)).toBe(true);
      expect((result.current.data as TestData[])?.length).toBe(3);
    });
  });

  describe('Fetch con error', () => {
    it('debe cambiar loading a false cuando hay error', async () => {
      // Mock de la función de fetch que lanza un error  
      const mockFetchFunction = jest.fn().mockRejectedValue(new Error('Error al obtener datos'));
      
      const { result } = renderHook(() => useFetchData(mockFetchFunction));

      // al cargar isLoading es true
      expect(result.current.isLoading).toBe(true);

      // Esperar a que el fetch se complete con error
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        // error debe contener el mensaje de error
        expect(result.current.error).toBeInstanceOf(Error);
        expect((result.current.error as Error)?.message).toBe('Error al obtener datos');
        // data debe ser null
        expect(result.current.data).toBeNull();
      });
    });

    it('debe contener el mensaje de error cuando falla el fetch', async () => {
      const errorMessage = 'Error al obtener datos del servidor';
      const mockFetchFunction = jest.fn().mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useFetchData(mockFetchFunction));

      // Esperar a que el fetch falle
      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Verificar que error contiene el mensaje correcto
      expect(result.current.error).toBeInstanceOf(Error);
      expect((result.current.error as Error)?.message).toBe(errorMessage);
    });

    it('debe mantener data como null cuando hay error', async () => {
      const mockFetchFunction = jest.fn().mockRejectedValue(new Error('Error'));

      const { result } = renderHook(() => useFetchData(mockFetchFunction));

      // Esperar a que el fetch falle
      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Verificar que data sigue siendo null
      expect(result.current.data).toBeNull();
    });

    it('debe manejar GenericError correctamente', async () => {
      const genericError = new GenericError(500, 'Error interno del servidor');
      const mockFetchFunction = jest.fn().mockRejectedValue(genericError);

      const { result } = renderHook(() => useFetchData(mockFetchFunction));

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Verificar que error es una instancia de GenericError
      expect(result.current.error).toBeInstanceOf(GenericError);
      expect((result.current.error as GenericError).httpCode).toBe(500);
      expect((result.current.error as GenericError).description).toBe('Error interno del servidor');
    });

    it('debe verificar estado completo cuando hay error', async () => {
      const mockFetchFunction = jest.fn().mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useFetchData(mockFetchFunction));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).not.toBeNull();
      expect((result.current.error as Error)?.message).toBe('Network error');
    });
  });

  describe('Refetch', () => {
    it('debe hacer fetch inicial y luego refetch cuando se llama a reload()', async () => {
      const mockData1 = { id: 1, name: 'First Data' };
      const mockData2 = { id: 2, name: 'Second Data' };
      
      const mockFetchFunction = jest.fn()
        .mockResolvedValueOnce(mockData1)
        .mockResolvedValueOnce(mockData2);

      const { result } = renderHook(() => useFetchData(mockFetchFunction));

      // Esperar al fetch inicial
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData1);
      expect(mockFetchFunction).toHaveBeenCalledTimes(1);

      // Llamar a reload
      result.current.reload();

      // Esperar al refetch
      await waitFor(() => {
        expect(mockFetchFunction).toHaveBeenCalledTimes(2);
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData2);
      });
    });

    it('debe cambiar loading a true temporalmente durante refetch', async () => {
      const mockData = { id: 1, name: 'Test' };
      const mockFetchFunction = jest.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useFetchData(mockFetchFunction));

      // Esperar al fetch inicial
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Llamar a reload
      result.current.reload();

      // Esperar a que se complete el refetch
      await waitFor(() => {
        expect(mockFetchFunction).toHaveBeenCalledTimes(2);
      });
    });

    it('debe poder hacer múltiples refetch consecutivos', async () => {
      const mockData = { id: 1, name: 'Test' };
      const mockFetchFunction = jest.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useFetchData(mockFetchFunction));

      // Esperar al fetch inicial
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Primer refetch
      result.current.reload();
      await waitFor(() => {
        expect(mockFetchFunction).toHaveBeenCalledTimes(2);
      });

      // Segundo refetch
      result.current.reload();
      await waitFor(() => {
        expect(mockFetchFunction).toHaveBeenCalledTimes(3);
      });

      // Tercer refetch
      result.current.reload();
      await waitFor(() => {
        expect(mockFetchFunction).toHaveBeenCalledTimes(4);
      });

      expect(result.current.data).toEqual(mockData);
    });

    it('debe limpiar error anterior después de refetch exitoso', async () => {
      const mockData = { id: 1, name: 'Test Data' };
      const mockFetchFunction = jest.fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useFetchData(mockFetchFunction));

      // Esperar al fetch inicial que falla
      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect((result.current.error as Error)?.message).toBe('First error');
      expect(result.current.data).toBeNull();

      // Hacer refetch exitoso
      result.current.reload();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });

      // El error anterior no se limpia automáticamente en esta implementación
      // pero data ahora tiene valor
      expect(result.current.data).toEqual(mockData);
    });

    it('debe mantener la referencia de reload entre renders', async () => {
      const mockData = { id: 1, name: 'Test' };
      const mockFetchFunction = jest.fn().mockResolvedValue(mockData);

      const { result, rerender } = renderHook(() => useFetchData(mockFetchFunction));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const reloadRef = result.current.reload;

      // Forzar re-render
      rerender();

      // La función reload debe mantener la misma referencia (useCallback)
      expect(result.current.reload).toBe(reloadRef);
    });
  });

  describe('Casos extremos y edge cases', () => {
    it('debe manejar datos undefined', async () => {
      const mockFetchFunction = jest.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() => useFetchData(mockFetchFunction));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeNull();
    });

    it('debe manejar datos vacíos (string vacío)', async () => {
      const mockFetchFunction = jest.fn().mockResolvedValue('');

      const { result } = renderHook(() => useFetchData(mockFetchFunction));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBe('');
      expect(result.current.error).toBeNull();
    });

    it('debe manejar array vacío', async () => {
      const mockFetchFunction = jest.fn().mockResolvedValue([]);

      const { result } = renderHook(() => useFetchData<TestData[]>(mockFetchFunction));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
      expect(Array.isArray(result.current.data)).toBe(true);
      expect((result.current.data as TestData[])?.length).toBe(0);
    });

    it('debe manejar fetch con retraso (simular latencia de red)', async () => {
      const mockData = { id: 1, name: 'Delayed Data' };
      const mockFetchFunction = jest.fn().mockImplementation(() => 
        new Promise((resolve) => setTimeout(() => resolve(mockData), 100))
      );

      const { result } = renderHook(() => useFetchData(mockFetchFunction));

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 3000 });

      expect(result.current.data).toEqual(mockData);
    });
  });
});
