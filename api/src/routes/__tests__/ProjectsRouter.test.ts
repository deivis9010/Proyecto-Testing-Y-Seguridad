import request from 'supertest';
import mongoose from 'mongoose';
import app from '@/config/server/server';
import ProjectModel from '@/components/Projects/model';
import * as jwt from 'jsonwebtoken';
import { db } from '@/config/connection/connection';
import { validProject, invalidProjects, sampleProjects } from '@/tests/fixtures/projects';
import { buildProject, buildProjects, buildProjectsWithTimestamps, resetProjectFactory } from '@/tests/factories/projectFactory';

describe('ProjectsRouter - Tests de integración - Actividad 2', () => {
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
      await ProjectModel.deleteMany({});
      // Reset del factory para tener datos predecibles
      resetProjectFactory();
    } catch (error) {
      console.error('Error limpiando proyectos:', error);
    }
  });

  // Cerrar conexiones después de todos los tests
  afterAll(async () => {
    try {
      await ProjectModel.deleteMany({});
      await db.close();
    } catch (error) {
      console.error('Error cerrando conexión:', error);
    }
  }, 10000);

  

  describe('GET /v1/projects - Obtener todos los proyectos', () => {
    it('debe retornar array vacío cuando no hay proyectos', async () => {
      const response = await request(app).get('/v1/projects').expect(200);

      expect(response.body).toEqual([]);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('debe retornar todos los proyectos existentes', async () => {
      // Usar factory para generar proyectos de prueba
      const projects = buildProjects(2);
      
      await ProjectModel.create(projects[0]);
      await ProjectModel.create(projects[1]);

      const response = await request(app).get('/v1/projects').expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toBe(projects[0].title);
      expect(response.body[1].title).toBe(projects[1].title);
      // Verificar que están ordenados por timestamp
      expect(response.body[0].timestamp).toBeLessThanOrEqual(response.body[1].timestamp);
    });

    it('debe retornar proyectos ordenados por timestamp', async () => {
      // Usar factory con timestamps específicos para testing de ordenamiento
      const projects = buildProjectsWithTimestamps(3, 1638350000000, 15000000);
      
      // Insertar en orden no secuencial para verificar el ordenamiento
      await ProjectModel.create(projects[2]); // Nuevo
      await ProjectModel.create(projects[0]); // Antiguo
      await ProjectModel.create(projects[1]); // Medio

      const response = await request(app).get('/v1/projects').expect(200);

      expect(response.body).toHaveLength(3);
      // Verificar que están ordenados por timestamp ascendente
      expect(response.body[0].timestamp).toBe(projects[0].timestamp);
      expect(response.body[1].timestamp).toBe(projects[1].timestamp);
      expect(response.body[2].timestamp).toBe(projects[2].timestamp);
    });
  });

  describe('POST /v1/projects - Crear proyecto válido', () => {
    it('debe crear un proyecto válido con todos los campos', async () => {
      // Usar fixture de proyecto válido
      const projectData = { ...validProject };

      const response = await request(app)
        .post('/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.title).toBe(projectData.title);
      expect(response.body.description).toBe(projectData.description);
      expect(response.body.version).toBe(projectData.version);
      expect(response.body.link).toBe(projectData.link);
      expect(response.body.tag).toBe(projectData.tag);
      expect(response.body._id).toBeDefined();

      // Verificar que el proyecto se creó en la DB
      const projectInDB = await ProjectModel.findById(response.body._id);
      expect(projectInDB).toBeDefined();
      expect(projectInDB?.title).toBe(projectData.title);
    });

    it('debe crear un proyecto solo con el campo title requerido', async () => {
      // Usar fixture de proyecto mínimo
      const projectData = { ...invalidProjects.minimalValid };

      const response = await request(app)
        .post('/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.title).toBe(projectData.title);
      expect(response.body._id).toBeDefined();

      // Verificar en la DB
      const projectInDB = await ProjectModel.findById(response.body._id);
      expect(projectInDB?.title).toBe(projectData.title);
    });

    it('debe rechazar request sin token de autenticación', async () => {
      const projectData = {
        title: 'Proyecto sin auth'
      };

      // El servidor retorna 400 cuando no hay token
      const response = await request(app).post('/v1/projects').send(projectData);
      expect([400, 401]).toContain(response.status);
    });

    it('debe rechazar request con token inválido', async () => {
      const projectData = {
        title: 'Proyecto con token malo'
      };

      await request(app)
        .post('/v1/projects')
        .set('Authorization', 'Bearer invalid-token')
        .send(projectData)
        .expect(401);
    });
  });

  describe('POST /v1/projects - Datos inválidos', () => {
    it('debe rechazar request sin campo title requerido', async () => {
      // Usar fixture de proyecto inválido sin título
      const projectData = { ...invalidProjects.missingTitle };

      const response = await request(app)
        .post('/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(500); // El servidor retorna 500 cuando hay error de validación

      expect(response.body.message).toBeDefined();
    });

    it('debe rechazar request con body vacío', async () => {
      const response = await request(app)
        .post('/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(500);

      expect(response.body.message).toBeDefined();
    });

    it('debe rechazar request con title vacío', async () => {
      const projectData = {
        title: ''
      };

      const response = await request(app)
        .post('/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(500);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('PUT /v1/projects - Actualizar proyecto', () => {
    it('debe actualizar un proyecto existente', async () => {
      // Usar factory para crear proyecto inicial
      const originalProject = buildProject({ title: 'Proyecto Original' });
      const project = await ProjectModel.create(originalProject);

      // Usar factory para crear datos actualizados
      const updatedProject = buildProject({
        title: 'Proyecto Actualizado',
        description: 'Descripción actualizada',
        version: '2.0.0'
      });

      const updatedData = {
        _id: project._id.toString(),
        ...updatedProject
      };

      const response = await request(app)
        .put('/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedData)
        .expect(201);

      expect(response.body.title).toBe(updatedData.title);
      expect(response.body.description).toBe(updatedData.description);
      expect(response.body.version).toBe(updatedData.version);

      // Verificar que el proyecto anterior fue eliminado
      const oldProject = await ProjectModel.findById(project._id);
      expect(oldProject).toBeNull();

      // Verificar que existe el nuevo proyecto
      const newProject = await ProjectModel.findById(response.body._id);
      expect(newProject).toBeDefined();
      expect(newProject?.title).toBe(updatedData.title);
    });

    it('debe rechazar actualización sin autenticación', async () => {
      const updatedData = {
        _id: new mongoose.Types.ObjectId().toString(),
        title: 'Proyecto sin auth'
      };

      // El servidor retorna 400 cuando no hay token
      const response = await request(app).put('/v1/projects').send(updatedData);
      expect([400, 401]).toContain(response.status);
    });
  });

  describe('DELETE /v1/projects - Eliminar proyecto', () => {
    it('debe eliminar un proyecto existente', async () => {
      // Crear proyecto
      const project = await ProjectModel.create({
        title: 'Proyecto a eliminar',
        description: 'Este proyecto será eliminado',
        timestamp: Date.now()
      });

      const response = await request(app)
        .delete('/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ id: project._id.toString() })
        .expect(200);

      expect(response.body._id).toBe(project._id.toString());
      expect(response.body.title).toBe(project.title);

      // Verificar que el proyecto fue eliminado de la DB
      const deletedProject = await ProjectModel.findById(project._id);
      expect(deletedProject).toBeNull();
    });

    it('debe rechazar eliminación sin autenticación', async () => {
      const project = await ProjectModel.create({
        title: 'Proyecto protegido',
        timestamp: Date.now()
      });

      // El servidor retorna 400 cuando no hay token
      const response = await request(app)
        .delete('/v1/projects')
        .send({ id: project._id.toString() });
      expect([400, 401]).toContain(response.status);

      // Verificar que el proyecto sigue existiendo
      const stillExists = await ProjectModel.findById(project._id);
      expect(stillExists).toBeDefined();
    });

    it('debe manejar eliminación de proyecto inexistente', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      const response = await request(app)
        .delete('/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ id: fakeId })
        .expect(200);

      expect(response.body).toBeNull();
    });

    it('debe rechazar eliminación con ID inválido', async () => {
      const response = await request(app)
        .delete('/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ id: 'invalid-id-format' })
        .expect(500);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('Casos extremos y validaciones', () => {
    it('debe manejar múltiples operaciones consecutivas', async () => {
      // Usar factory para crear proyecto inicial
      const initialProject = buildProject({ title: 'Test Project' });
      
      // Crear
      const createResponse = await request(app)
        .post('/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(initialProject)
        .expect(201);

      const projectId = createResponse.body._id;

      // Usar factory para proyecto actualizado
      const updatedProject = buildProject({ title: 'Updated Project' });

      // Actualizar
      await request(app)
        .put('/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          _id: projectId,
          ...updatedProject
        })
        .expect(201);

      // Obtener todos
      const getAllResponse = await request(app).get('/v1/projects').expect(200);
      expect(getAllResponse.body).toHaveLength(1);

      // Eliminar
      await request(app)
        .delete('/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ id: getAllResponse.body[0]._id })
        .expect(200);

      // Verificar que está vacío
      const finalResponse = await request(app).get('/v1/projects').expect(200);
      expect(finalResponse.body).toHaveLength(0);
    });

    it('debe manejar proyectos con caracteres especiales', async () => {
      // Usar fixture de proyecto con caracteres especiales
      const projectData = { ...invalidProjects.specialCharacters };

      const response = await request(app)
        .post('/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.title).toBe(projectData.title);
      expect(response.body.description).toBe(projectData.description);
    });

    it('debe manejar proyectos con campos muy largos', async () => {
      // Usar fixture de proyecto con descripción larga (5000 caracteres)
      const projectData = { ...invalidProjects.longDescription };

      const response = await request(app)
        .post('/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.description).toHaveLength(5000);
      expect(response.body.title).toBe(projectData.title);
    });
  });

  describe('Integración con base de datos', () => {
    it('debe persistir correctamente los datos en MongoDB', async () => {
      const projectData = {
        title: 'Test Persistencia',
        description: 'Verificar persistencia',
        version: '1.0.0',
        timestamp: Date.now()
      };

      // Crear proyecto via API
      const response = await request(app)
        .post('/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      // Consultar directamente en la DB
      const projects = await ProjectModel.find({});
      expect(projects).toHaveLength(1);
      expect(projects[0].title).toBe(projectData.title);
      expect(projects[0]._id.toString()).toBe(response.body._id);
    });

    it('debe mantener la integridad de datos entre operaciones', async () => {
      // Usar factory para crear múltiples proyectos
      const projects = buildProjects(3);

      for (const project of projects) {
        await request(app)
          .post('/v1/projects')
          .set('Authorization', `Bearer ${authToken}`)
          .send(project)
          .expect(201);
      }

      // Verificar que todos están en la DB
      const allProjects = await ProjectModel.find({});
      expect(allProjects).toHaveLength(3);

      // Eliminar uno
      await request(app)
        .delete('/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ id: allProjects[1]._id.toString() })
        .expect(200);

      // Verificar que quedan 2
      const remainingProjects = await ProjectModel.find({});
      expect(remainingProjects).toHaveLength(2);
      expect(remainingProjects.find((p) => p.title === projects[1].title)).toBeUndefined();
    });

    it('debe manejar inserción de múltiples proyectos usando fixtures de ejemplo', async () => {
      // Usar sampleProjects fixture para crear varios proyectos
      for (const project of sampleProjects) {
        await request(app)
          .post('/v1/projects')
          .set('Authorization', `Bearer ${authToken}`)
          .send(project)
          .expect(201);
      }

      // Verificar que todos los proyectos fueron creados
      const response = await request(app).get('/v1/projects').expect(200);
      expect(response.body).toHaveLength(sampleProjects.length);

      // Verificar que los títulos coinciden
      const titles = response.body.map((p: any) => p.title);
      sampleProjects.forEach((sample) => {
        expect(titles).toContain(sample.title);
      });
    });
  });
});
