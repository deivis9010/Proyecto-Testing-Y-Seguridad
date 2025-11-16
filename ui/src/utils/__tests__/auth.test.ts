import {
  setAuthToken,
  removeAuthToken,
  isTokenActive,
  getAccessToken,
  getCurrentUser,
  setLogoutIfExpiredHandler
} from '../auth';
import { tokenKey } from '../../constants/config';

// Mock de jwt-decode
jest.mock('jwt-decode', () => {
  return jest.fn(() => ({
    _id: '123456',
    email: 'test@example.com',
    iat: 1609459200, // 2021-01-01 00:00:00 UTC (segundos)
    exp: 1609545600 // 2021-01-02 00:00:00 UTC (segundos)
  }));
});

describe('auth.ts - Utilidades de autenticación', () => {
  // Mock de localStorage
  let localStorageMock: { [key: string]: string };
  beforeEach(() => {
    // Crear un objeto para simular localStorage
    localStorageMock = {};

    // Mockear métodos de localStorage
    Storage.prototype.getItem = jest.fn((key: string) => localStorageMock[key] || null);
    Storage.prototype.setItem = jest.fn((key: string, value: string) => {
      localStorageMock[key] = value;
    });
    Storage.prototype.removeItem = jest.fn((key: string) => {
      delete localStorageMock[key];
    });
    Storage.prototype.clear = jest.fn(() => {
      localStorageMock = {};
    });
  });

  afterEach(() => {
    // Limpiar mocks después de cada test
    jest.clearAllMocks();
  });

  describe('setAuthToken', () => {
    it('debe guardar el token en localStorage', () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      setAuthToken(mockToken);

      // Verificar que setItem fue llamado
      expect(localStorage.setItem).toHaveBeenCalledTimes(1);
      expect(localStorage.setItem).toHaveBeenCalledWith(tokenKey, expect.any(String));
    });

    it('debe convertir timestamps de segundos a milisegundos', () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      setAuthToken(mockToken);

      const savedValue = localStorageMock[tokenKey];
      const parsedToken = JSON.parse(savedValue);

      // JWT usa timestamps en segundos, debemos convertir a milisegundos
      // Verificar que el número es razonable (timestamp en milisegundos es mucho mayor)
      expect(parsedToken.notBeforeTimestampInMillis).toBeGreaterThan(1000000000000);
      expect(parsedToken.expirationTimestampInMillis).toBeGreaterThan(1000000000000);
    });

    // Agregada para actividad 1 parte 3
    it('setAuthToken sobrescribe token previo y guarda accessToken correcto', () => {
      setAuthToken('first-token');
      setAuthToken('second-token');
      const saved = JSON.parse(localStorageMock[tokenKey] || '{}');
      expect(saved.accessToken).toBe('second-token');
    });
  });

  describe('removeAuthToken', () => {
    it('debe eliminar el token de localStorage', () => {
      // Primero guardamos un token
      localStorage.setItem(
        tokenKey,
        JSON.stringify({
          accessToken: 'test-token',
          notBeforeTimestampInMillis: Date.now(),
          expirationTimestampInMillis: Date.now() + 3600000
        })
      );

      expect(localStorage.getItem(tokenKey)).toBeTruthy();

      // Removemos el token
      removeAuthToken();

      expect(localStorage.getItem(tokenKey)).toBeNull();
    });

    it('debe funcionar aunque no haya token', () => {
      expect(localStorage.getItem(tokenKey)).toBeNull();

      // No debe lanzar error
      expect(() => removeAuthToken()).not.toThrow();
    });

    // Agregada para actividad 1 parte 3
    it('removeAuthToken no elimina otras claves en localStorage', () => {
      localStorage.setItem('otraClave', 'valor');
      localStorage.setItem(
        tokenKey,
        JSON.stringify({
          accessToken: 't',
          notBeforeTimestampInMillis: Date.now(),
          expirationTimestampInMillis: Date.now() + 3600_000
        })
      );
      removeAuthToken();

      expect(localStorage.getItem('otraClave')).toBe('valor');
      expect(localStorage.getItem(tokenKey)).toBeNull();
    });
  });

  //Agregada para actividad 1 parte 3
  describe('isTokenActive', () => {
    it('debe retornar true si el token está activo', () => {
      const futureTime = Date.now() + 3600000; // 1 hora en el futuro
      localStorage.setItem(
        tokenKey,
        JSON.stringify({
          accessToken: 'active-token',
          notBeforeTimestampInMillis: Date.now() - 60000, // 1 minuto en el pasado
          expirationTimestampInMillis: futureTime
        })
      );
      const isActive = isTokenActive();
      expect(isActive).toBe(true);
    });

    it('isTokenActive devuelve false si notBefore está en el futuro (token no iniciado aún)', () => {
      const notBefore = Date.now() + 10_000; // dentro de 10s
      const expires = Date.now() + 20_000;
      localStorage.setItem(
        tokenKey,
        JSON.stringify({
          accessToken: 'future-token',
          notBeforeTimestampInMillis: notBefore,
          expirationTimestampInMillis: expires
        })
      );

      expect(isTokenActive()).toBe(false);
    });
    it('isTokenActive devuelve false si el token ha expirado', () => {
      const notBefore = Date.now() - 20_000; // hace 20s
      const expires = Date.now() - 10_000; // hace 10s
      localStorage.setItem(
        tokenKey,
        JSON.stringify({
          accessToken: 'expired-token',
          notBeforeTimestampInMillis: notBefore,
          expirationTimestampInMillis: expires
        })
      );
      expect(isTokenActive()).toBe(false);
    });
    it('isTokenActive devuelve false si no hay token', () => {
      expect(localStorage.getItem(tokenKey)).toBeNull();
      expect(isTokenActive()).toBe(false);
    });
  });
  // Agregada para actividad 1 parte 3
  describe('getAccessToken', () => {
    it('getAccessToken devuelve el accessToken cuando hay token válido', () => {
      const now = Date.now();
      localStorage.setItem(
        tokenKey,
        JSON.stringify({
          accessToken: 'mi-access-token',
          notBeforeTimestampInMillis: now - 1000,
          expirationTimestampInMillis: now + 60_000
        })
      );

      expect(getAccessToken()).toBe('mi-access-token');
    });
    it('getAccessToken devuelve cadena vacía cuando no hay token', () => {
      localStorage.removeItem(tokenKey);
      expect(getAccessToken()).toBe('');
    });
  });

  describe('getCurrentUser', () => {
    it('debe retornar el usuario actual si el token es válido', () => {
      const now = Date.now();
      localStorage.setItem(
        tokenKey,
        JSON.stringify({
          accessToken: 'valid-token',
          notBeforeTimestampInMillis: now - 1000,
          expirationTimestampInMillis: now + 3600000
        })
      );
      const user = getCurrentUser();
      expect(user).toBeDefined();
    });
    it('getCurrentUser con token expirado devuelve undefined y elimina el token', () => {
      const past = Date.now() - 10_000;
      localStorage.setItem(
        tokenKey,
        JSON.stringify({
          accessToken: 'expired-token',
          notBeforeTimestampInMillis: past - 10_000,
          expirationTimestampInMillis: past
        })
      );

      const user = getCurrentUser();
      expect(user).toBeUndefined();
      expect(localStorage.getItem(tokenKey)).toBeNull();
    });
    it('getCurrentUser devuelve undefined si no hay token', () => {
      localStorage.removeItem(tokenKey);
      const user = getCurrentUser();
      expect(user).toBeUndefined();
    });
  });

  describe('setLogoutIfExpiredHandler', () => {
    it('llama a setUser(undefined) cuando el token expira y limpia timers sin errores', () => {
      // usar timers falsos y preparar token que expira en ~2s
      jest.useFakeTimers();
      const setUser = jest.fn();
      const now = Date.now();
      // Guardamos token que expira en 2s usando la clave `tokenKey`
      localStorage.setItem(
        tokenKey,
        JSON.stringify({
          accessToken: 't',
          notBeforeTimestampInMillis: now - 1000,
          expirationTimestampInMillis: now + 2000
        })
      );

      try {
        // registrar el handler y avanzar el reloj virtual
        setLogoutIfExpiredHandler(setUser);
        jest.advanceTimersByTime(2500);

        // setUser fue llamado con undefined
        expect(setUser).toHaveBeenCalledWith(undefined);

        // Comprobar que la eliminación del token no lanza errores
        expect(() => removeAuthToken()).not.toThrow();
      } finally {
        // Cleanup: restaurar timers y eliminar token
        jest.clearAllTimers();
        jest.useRealTimers();
        removeAuthToken();
      }
    });
  });
});
