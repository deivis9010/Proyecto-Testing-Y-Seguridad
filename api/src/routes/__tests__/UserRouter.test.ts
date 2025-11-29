import request from 'supertest';
import app from '@/config/server/server';
import UserModel from '@/components/User/model';
import { db } from '@/config/connection/connection';
import * as jwt from 'jsonwebtoken';

describe('UserRouter - Tests de integración', () => {
  let authToken: string;

  // Configurar antes de todos los tests
  beforeAll(async () => {
    // Generar token JWT para rutas protegidas
    const secret = app.get('secret') || 'superSecret';
    authToken = jwt.sign({ id: 'test-user-id', email: 'test@example.com' }, secret, {
      expiresIn: '1h'
    });

    // Esperar a que la conexión de la base de datos esté lista
    if (db.readyState !== 1) {
      await new Promise((resolve) => {
        db.once('open', resolve);
      });
    }
  }, 30000);

  // Limpiar la base de datos antes de cada test
  beforeEach(async () => {
    try {
      await UserModel.deleteMany({});
    } catch (error) {
      console.error('Error limpiando usuarios:', error);
    }
  });

  // Cerrar conexiones después de todos los tests
  afterAll(async () => {
    try {
      await UserModel.deleteMany({});
      await db.close();
    } catch (error) {
      console.error('Error cerrando conexión:', error);
    }
  }, 10000);

  describe('POST /v1/users - Datos inválidos', () => {
    it('debe rechazar request sin campo email requerido', async () => {
      const userData = {
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userData)
        .expect(400);

      expect(response.body).toBeDefined();
      expect(response.body.status).toBe(400);
      expect(response.body.message).toBeDefined();
      // Verificar que el mensaje menciona el error de validación
      expect(response.body.message).toMatch(/email|required/i);
    });

    it('debe rechazar request sin campo password requerido', async () => {
      const userData = {
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userData)
        .expect(400);

      expect(response.body).toBeDefined();
      expect(response.body.status).toBe(400);
      expect(response.body.message).toBeDefined();
      // Verificar que el mensaje menciona el error de validación
      expect(response.body.message).toMatch(/password|required/i);
    });

    it('debe rechazar request con email inválido', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userData)
        .expect(400);

      expect(response.body).toBeDefined();
      expect(response.body.status).toBe(400);
      expect(response.body.message).toBeDefined();
      // Verificar que el mensaje menciona el error de validación de email
      expect(response.body.message).toMatch(/email/i);
    });

    it('debe rechazar request con body vacío', async () => {
      const response = await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body).toBeDefined();
      expect(response.body.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });

    it('debe rechazar request con email vacío', async () => {
      const userData = {
        email: '',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userData)
        .expect(400);

      expect(response.body).toBeDefined();
      expect(response.body.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });

    it('debe rechazar request con password vacío', async () => {
      const userData = {
        email: 'test@example.com',
        password: ''
      };

      const response = await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userData)
        .expect(400);

      expect(response.body).toBeDefined();
      expect(response.body.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });
  });
});
