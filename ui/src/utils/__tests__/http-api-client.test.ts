import HttpApiClient from '../../api/http-api-client';
import { Unauthorized, UnprocessableEntity, NotFound, BadRequest } from '../../api/api-client';

// Simulaciones (mocks) de las utilidades de autenticación usadas por el cliente.
// Se mockean `getAccessToken` y `removeAuthToken` para controlar el comportamiento
// y poder verificar llamadas y cabeceras sin depender de la implementación real.
const mockGetAccessToken = jest.fn();
const mockRemoveAuthToken = jest.fn();
jest.mock('../../utils/auth', () => ({
  getAccessToken: () => mockGetAccessToken(),
  removeAuthToken: () => mockRemoveAuthToken()
}));

describe('HttpApiClient', () => {
  const base = 'http://api.test';
  beforeEach(() => {
    // Limpiar mocks antes de cada test para evitar fugas entre casos.
    jest.resetAllMocks();
  });

  afterEach(() => {
    // Si se ha mockeado `fetch`, limpiar su historial de llamadas para el siguiente test.
    if (global.fetch && (global.fetch as jest.Mock).mockClear)
      (global.fetch as jest.Mock).mockClear();
  });

  it('token: lanza Unauthorized cuando el servidor responde 401', async () => {
    // Arrange: mock de fetch que devuelve 401
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });

    // Act / Assert: el método token debe propagar Unauthorized
    const client = new HttpApiClient(base);
    await expect(client.token('a@a.com', 'p')).rejects.toBeInstanceOf(Unauthorized);
  });

  it('postProject: añade Authorization y devuelve el JSON en caso OK', async () => {
    // Arrange
    mockGetAccessToken.mockReturnValue('abc.token');
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ message: 'ok' }) });

    // Act
    const client = new HttpApiClient(base);
    const sampleProject = { title: 'x' } as any;
    const res = await client.postProject(sampleProject);

    // Assert
    expect(res).toEqual({ message: 'ok' });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/projects'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer abc.token' })
      })
    );
  });

  it('postProject: propaga UnprocessableEntity cuando el servidor responde 422 con detalle', async () => {
    // Arrange: mock fetch devuelve 422 con detail
    mockGetAccessToken.mockReturnValue('abc.token');
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 422, json: async () => ({ detail: 'bad data' }) });

    // Act / Assert
    const client = new HttpApiClient(base);
    await expect(client.postProject({ title: 'x' } as any)).rejects.toBeInstanceOf(
      UnprocessableEntity
    );
  });

  it('getAboutMe: en 401 debe propagar Unauthorized y eliminar token (efecto)', async () => {
    // Arrange
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });

    // Act / Assert
    const client = new HttpApiClient(base);
    await expect(client.getAboutMe()).rejects.toBeInstanceOf(Unauthorized);
    // Efecto: token eliminado
    expect(mockRemoveAuthToken).toHaveBeenCalled();
  });

  it('getDashboardInfo: reúne aboutMe y projects correctamente', async () => {
    // Arrange: primera fetch = aboutMe, segunda = projects
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ name: 'me' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [{ title: 'p1' }] });

    // Act
    const client = new HttpApiClient(base);
    const info = await client.getDashboardInfo();

    // Assert
    expect(info.aboutMe).toEqual({ name: 'me' });
    expect(info.projects).toEqual([{ title: 'p1' }]);
  });

  it('createOrUpdateProject: usa POST cuando no hay _id y PUT cuando existe _id', async () => {
    // Arrange: respuestas OK para ambas operaciones
    mockGetAccessToken.mockReturnValue('t');
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ message: 'ok' }) });

    const client = new HttpApiClient(base);

    // Act: crear nuevo (sin _id)
    await client.createOrUpdateProject({ title: 'a' } as any);

    // Act: actualizar (con _id)
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'ok' })
    });
    await client.createOrUpdateProject({ _id: '1', title: 'b' } as any);

    // Assert: comprobar que hubo llamadas con métodos POST y PUT
    const optionsList = (global.fetch as jest.Mock).mock.calls.map((c) => c[1]);
    expect(optionsList.some((o: any) => o.method === 'POST')).toBeTruthy();
    expect(optionsList.some((o: any) => o.method === 'PUT')).toBeTruthy();
  });

  it('deleteProject: lanza NotFound cuando el servidor responde 404', async () => {
    mockGetAccessToken.mockReturnValue('tkn');

    // Arrange: mock fetch devuelve 404
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });

    // Act / Assert
    const client = new HttpApiClient(base);
    await expect(client.deleteProject('abc')).rejects.toBeInstanceOf(NotFound);
  });

  it('postProject: propaga BadRequest cuando el servidor responde 400', async () => {
    // Arrange: token presente pero servidor responde 400
    mockGetAccessToken.mockReturnValue('tok');
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({}) });

    // Act / Assert
    const client = new HttpApiClient(base);
    await expect(client.postProject({ title: 'x' } as any)).rejects.toBeInstanceOf(BadRequest);
  });

  it('postProject: lanza Error con code 402 cuando no hay token (getAuthorizationHeader)', async () => {
    // Arrange: getAccessToken devuelve undefined -> getAuthorizationHeader debe lanzar
    mockGetAccessToken.mockReturnValue(undefined);
    // No mock de fetch necesario porque getAuthorizationHeader lanza antes

    const client = new HttpApiClient(base);
    await expect(client.postProject({ title: 'x' } as any)).rejects.toMatchObject({ code: 402 });
  });
});
