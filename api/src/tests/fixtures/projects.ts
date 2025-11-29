/**
 * Fixtures para tests del modelo Project
 * Proporciona muestras de datos de proyectos válidos e inválidos
 */

export interface ProjectFixture {
  title?: string;
  description?: string;
  version?: string;
  link?: string;
  tag?: string;
  timestamp?: number;
}

/**
 * Objeto de proyecto válido con todos los campos
 */
export const validProject: ProjectFixture = {
  title: 'E-Commerce Platform',
  description: 'Full-stack e-commerce application with React, Node.js, and MongoDB',
  version: '1.0.0',
  link: 'https://github.com/example/ecommerce-platform',
  tag: 'React,Node.js,MongoDB,TypeScript',
  timestamp: 1638360000000
};

/**
 * Objetos de proyectos inválidos para testing de validación
 */
export const invalidProjects = {
  // Campo title requerido faltante
  missingTitle: {
    description: 'Project without a title',
    version: '1.0.0',
    link: 'https://github.com/example/no-title',
    tag: 'React,Node.js',
    timestamp: Date.now()
  },

  // Título vacío
  emptyTitle: {
    title: '',
    description: 'Project with empty title',
    version: '1.0.0',
    link: 'https://github.com/example/empty-title',
    tag: 'React',
    timestamp: Date.now()
  },

  // Campos opcionales faltantes (pero válido ya que solo title es requerido)
  minimalValid: {
    title: 'Minimal Project'
  },

  // Título con caracteres especiales (válido)
  specialCharacters: {
    title: 'Project @#$%^&*() with special chars',
    description: 'Testing special characters in title 🚀💻',
    version: '2.0.0-beta',
    link: 'https://github.com/test/special-chars',
    tag: 'Testing,Special',
    timestamp: Date.now()
  },

  // Descripción muy larga
  longDescription: {
    title: 'Project with Long Description',
    description: 'A'.repeat(5000),
    version: '1.0.0',
    link: 'https://github.com/example/long-desc',
    tag: 'Test',
    timestamp: Date.now()
  },

  // Formato de URL inválido (aún aceptado por el schema ya que es solo un string)
  invalidUrl: {
    title: 'Project with Invalid URL',
    description: 'Testing invalid URL format',
    version: '1.0.0',
    link: 'not-a-valid-url',
    tag: 'Test',
    timestamp: Date.now()
  },

  // Timestamp negativo
  negativeTimestamp: {
    title: 'Project with Negative Timestamp',
    description: 'Testing negative timestamp',
    version: '1.0.0',
    link: 'https://github.com/example/negative-time',
    tag: 'Test',
    timestamp: -1
  }
};

/**
 * Array de proyectos de ejemplo para testing de múltiples registros
 */
export const sampleProjects: ProjectFixture[] = [
  {
    title: 'Task Management App',
    description: 'A comprehensive task management application with real-time updates',
    version: '2.1.0',
    link: 'https://github.com/example/task-manager',
    tag: 'React,Redux,WebSocket,Node.js',
    timestamp: 1638350000000
  },
  {
    title: 'Weather Dashboard',
    description: 'Real-time weather information dashboard with interactive maps',
    version: '1.5.3',
    link: 'https://github.com/example/weather-dashboard',
    tag: 'Vue.js,D3.js,OpenWeatherAPI',
    timestamp: 1638365000000
  },
  {
    title: 'Blog CMS',
    description: 'Content management system for blogging with markdown support',
    version: '3.0.0',
    link: 'https://github.com/example/blog-cms',
    tag: 'Next.js,MongoDB,TailwindCSS',
    timestamp: 1638380000000
  },
  {
    title: 'Chat Application',
    description: 'Real-time chat application with rooms and private messaging',
    version: '1.0.0-rc1',
    link: 'https://github.com/example/chat-app',
    tag: 'Socket.io,Express,React',
    timestamp: 1638395000000
  },
  {
    title: 'Portfolio Website',
    description: 'Personal portfolio website with animated components and dark mode',
    version: '2.0.0',
    link: 'https://github.com/example/portfolio',
    tag: 'React,Framer Motion,Styled Components',
    timestamp: 1638410000000
  }
];

/**
 * Helper para crear un proyecto con sobrescrituras personalizadas
 */
export function createProjectFixture(overrides: Partial<ProjectFixture> = {}): ProjectFixture {
  return {
    ...validProject,
    ...overrides
  };
}

/**
 * Helper para crear múltiples proyectos con timestamps únicos
 */
export function createMultipleProjects(count: number, baseProject: Partial<ProjectFixture> = {}): ProjectFixture[] {
  return Array.from({ length: count }, (_, index) => ({
    ...validProject,
    ...baseProject,
    title: `${baseProject.title || 'Test Project'} ${index + 1}`,
    timestamp: Date.now() + index * 1000
  }));
}
