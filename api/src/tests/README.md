# Fixtures y Factories para Testing

Este directorio contiene fixtures (datos estáticos) y factories (generadores de datos) para facilitar las pruebas del proyecto.

## 📁 Estructura

```
tests/
├── fixtures/        # Datos estáticos predefinidos
│   └── projects.ts  # Fixtures para el modelo Project
└── factories/       # Generadores de datos dinámicos
    └── projectFactory.ts  # Factory para crear Projects únicos
```

## 🔧 Fixtures (`fixtures/projects.ts`)

Los fixtures proporcionan datos predefinidos y reutilizables para tests.

### `validProject`
Objeto Project válido con todos los campos poblados.

```typescript
import { validProject } from '@/tests/fixtures/projects';

// Usar en tests
const project = await ProjectModel.create(validProject);
```

### `invalidProjects`
Colección de proyectos con diferentes casos inválidos:

- `missingTitle`: Proyecto sin el campo requerido title
- `emptyTitle`: Proyecto con title vacío
- `minimalValid`: Proyecto solo con campo title (válido)
- `specialCharacters`: Proyecto con caracteres especiales y emojis
- `longDescription`: Proyecto con descripción de 5000 caracteres
- `invalidUrl`: Proyecto con URL mal formateada
- `negativeTimestamp`: Proyecto con timestamp negativo

```typescript
import { invalidProjects } from '@/tests/fixtures/projects';

// Test de validación
const response = await request(app)
  .post('/v1/projects')
  .send(invalidProjects.missingTitle)
  .expect(500);
```

### `sampleProjects`
Array de 5 proyectos de ejemplo listos para usar:

```typescript
import { sampleProjects } from '@/tests/fixtures/projects';

// Insertar múltiples proyectos
for (const project of sampleProjects) {
  await ProjectModel.create(project);
}
```

### Helpers
- `createProjectFixture(overrides)`: Crea fixture con sobrescrituras
- `createMultipleProjects(count, base)`: Crea N fixtures con timestamps únicos

## 🏭 Factories (`factories/projectFactory.ts`)

Las factories generan datos únicos en cada invocación, ideal para evitar colisiones en tests.

### `buildProject(overrides?)`
Genera un proyecto único con contador incremental.

```typescript
import { buildProject } from '@/tests/factories/projectFactory';

// Proyecto con valores por defecto únicos
const project1 = buildProject();
// { title: 'Test Project 1', description: '...', version: '1.1.0', ... }

// Proyecto con sobrescrituras
const project2 = buildProject({ 
  title: 'Custom Title', 
  version: '2.0.0' 
});
```

### `buildProjects(count, baseOverrides?)`
Genera múltiples proyectos únicos.

```typescript
import { buildProjects } from '@/tests/factories/projectFactory';

// Generar 5 proyectos únicos
const projects = buildProjects(5);

// Generar 3 proyectos con tag común
const taggedProjects = buildProjects(3, { tag: 'React,Testing' });
```

### `buildProjectsWithTimestamps(count, startTime?, interval?)`
Genera proyectos con timestamps secuenciales para testing de ordenamiento.

```typescript
import { buildProjectsWithTimestamps } from '@/tests/factories/projectFactory';

// 3 proyectos con timestamps separados por 1 segundo
const projects = buildProjectsWithTimestamps(3, Date.now(), 1000);

// Insertar desordenados para verificar sorting
await ProjectModel.create(projects[2]);
await ProjectModel.create(projects[0]);
await ProjectModel.create(projects[1]);
```

### `resetProjectFactory()`
Resetea el contador interno de la factory. **Llamar en `beforeEach`** para tests predecibles.

```typescript
import { resetProjectFactory } from '@/tests/factories/projectFactory';

beforeEach(async () => {
  await ProjectModel.deleteMany({});
  resetProjectFactory(); // Resetear contador
});
```

### Otras funciones útiles

- `buildMinimalProject(overrides?)`: Proyecto solo con campo title
- `buildCompleteProject(overrides?)`: Proyecto con todos los campos
- `buildSpecialCharProject(overrides?)`: Proyecto con caracteres especiales
- `buildBatchProjects(count)`: Proyectos organizados por categorías

## 📝 Ejemplos de Uso en Tests

### Test básico con fixture

```typescript
import { validProject } from '@/tests/fixtures/projects';

it('debe crear un proyecto válido', async () => {
  const response = await request(app)
    .post('/v1/projects')
    .set('Authorization', `Bearer ${authToken}`)
    .send(validProject)
    .expect(201);

  expect(response.body.title).toBe(validProject.title);
});
```

### Test con factory para datos únicos

```typescript
import { buildProject, resetProjectFactory } from '@/tests/factories/projectFactory';

beforeEach(() => {
  resetProjectFactory();
});

it('debe retornar todos los proyectos', async () => {
  const projects = buildProjects(2);
  await ProjectModel.create(projects[0]);
  await ProjectModel.create(projects[1]);

  const response = await request(app).get('/v1/projects').expect(200);
  expect(response.body).toHaveLength(2);
});
```

### Test de ordenamiento con timestamps

```typescript
import { buildProjectsWithTimestamps } from '@/tests/factories/projectFactory';

it('debe ordenar por timestamp', async () => {
  const projects = buildProjectsWithTimestamps(3, 1638350000000, 15000000);
  
  // Insertar desordenados
  await ProjectModel.create(projects[2]);
  await ProjectModel.create(projects[0]);
  await ProjectModel.create(projects[1]);

  const response = await request(app).get('/v1/projects').expect(200);
  
  // Verificar orden ascendente
  expect(response.body[0].timestamp).toBe(projects[0].timestamp);
  expect(response.body[1].timestamp).toBe(projects[1].timestamp);
  expect(response.body[2].timestamp).toBe(projects[2].timestamp);
});
```

### Test de validación con fixtures inválidos

```typescript
import { invalidProjects } from '@/tests/fixtures/projects';

it('debe rechazar proyecto sin título', async () => {
  const response = await request(app)
    .post('/v1/projects')
    .set('Authorization', `Bearer ${authToken}`)
    .send(invalidProjects.missingTitle)
    .expect(500);

  expect(response.body.message).toBeDefined();
});
```

## 🎯 Mejores Prácticas

1. **Usa fixtures** para datos estáticos y casos específicos conocidos
2. **Usa factories** para generar datos únicos y evitar colisiones entre tests
3. **Resetea factories** en `beforeEach` para tests predecibles
4. **Combina ambos**: fixtures para validaciones, factories para operaciones CRUD
5. **Documenta casos especiales** en los fixtures para referencia futura

## 🔄 Tests Actualizados

Los siguientes tests en `ProjectsRouter.test.ts` usan fixtures/factories:

- ✅ `debe retornar todos los proyectos existentes` - Factory
- ✅ `debe retornar proyectos ordenados por timestamp` - Factory con timestamps
- ✅ `debe crear un proyecto válido con todos los campos` - Fixture
- ✅ `debe crear un proyecto solo con el campo title requerido` - Fixture
- ✅ `debe rechazar request sin campo title requerido` - Fixture inválido
- ✅ `debe actualizar un proyecto existente` - Factory
- ✅ `debe manejar múltiples operaciones consecutivas` - Factory
- ✅ `debe manejar proyectos con caracteres especiales` - Fixture
- ✅ `debe manejar proyectos con campos muy largos` - Fixture
- ✅ `debe mantener la integridad de datos entre operaciones` - Factory
- ✅ `debe manejar inserción de múltiples proyectos usando fixtures de ejemplo` - Fixture sampleProjects

Total: **11 tests actualizados** usando fixtures y factories.
