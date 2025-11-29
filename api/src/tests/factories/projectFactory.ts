/**
 * Factory para generar datos de prueba de Project
 * Proporciona funciones para crear instancias únicas de proyectos para testing
 */

export interface ProjectData {
  title: string;
  description?: string;
  version?: string;
  link?: string;
  tag?: string;
  timestamp?: number;
}

/**
 * Contador interno para generar datos únicos de proyectos
 */
let projectCounter = 0;
let timestampBase = Date.now();

/**
 * Resetea el contador del factory de proyectos
 * Útil para asegurar datos predecibles entre ejecuciones de tests
 */
export function resetProjectFactory(): void {
  projectCounter = 0;
  timestampBase = Date.now();
}

/**
 * Construye un proyecto único con sobrescrituras opcionales
 * Cada llamada genera un proyecto único con contador incremental
 * 
 * @param overrides - Datos parciales del proyecto opcionales para sobrescribir valores por defecto
 * @returns Objeto ProjectData con valores únicos
 * 
 * @example
 * ```typescript
 * const project = buildProject();
 * const customProject = buildProject({ title: 'Custom Title', version: '2.0.0' });
 * ```
 */
export function buildProject(overrides: Partial<ProjectData> = {}): ProjectData {
  projectCounter++;

  const defaultProject: ProjectData = {
    title: `Test Project ${projectCounter}`,
    description: `Description for test project ${projectCounter}`,
    version: `1.${projectCounter}.0`,
    link: `https://github.com/test/project-${projectCounter}`,
    tag: `Tag${projectCounter},Testing,Automated`,
    timestamp: timestampBase + projectCounter * 1000
  };

  return {
    ...defaultProject,
    ...overrides
  };
}

/**
 * Construye múltiples proyectos con sobrescrituras base opcionales
 * Genera un array de proyectos únicos
 * 
 * @param count - Número de proyectos a generar
 * @param baseOverrides - Datos parciales del proyecto opcionales aplicados a todos los proyectos generados
 * @returns Array de objetos ProjectData
 * 
 * @example
 * ```typescript
 * const projects = buildProjects(5);
 * const taggedProjects = buildProjects(3, { tag: 'React,Node.js' });
 * ```
 */
export function buildProjects(count: number, baseOverrides: Partial<ProjectData> = {}): ProjectData[] {
  return Array.from({ length: count }, () => buildProject(baseOverrides));
}

/**
 * Construye un proyecto válido mínimo (solo campos requeridos)
 * 
 * @param overrides - Datos parciales del proyecto opcionales para sobrescribir valores por defecto
 * @returns Objeto ProjectData con solo campos requeridos
 */
export function buildMinimalProject(overrides: Partial<ProjectData> = {}): ProjectData {
  projectCounter++;

  return {
    title: `Minimal Project ${projectCounter}`,
    ...overrides
  };
}

/**
 * Construye un proyecto con todos los campos opcionales
 * 
 * @param overrides - Datos parciales del proyecto opcionales para sobrescribir valores por defecto
 * @returns Objeto ProjectData con todos los campos poblados
 */
export function buildCompleteProject(overrides: Partial<ProjectData> = {}): ProjectData {
  projectCounter++;

  return {
    title: `Complete Project ${projectCounter}`,
    description: `This is a complete description for project ${projectCounter} with all fields populated`,
    version: `${projectCounter}.0.0`,
    link: `https://github.com/complete/project-${projectCounter}`,
    tag: `Complete,Full,Testing,Tag${projectCounter}`,
    timestamp: timestampBase + projectCounter * 5000,
    ...overrides
  };
}

/**
 * Construye proyectos con timestamps específicos para testing de ordenamiento
 * 
 * @param count - Número de proyectos a generar
 * @param startTimestamp - Timestamp inicial (por defecto tiempo actual)
 * @param interval - Intervalo de tiempo entre proyectos en milisegundos (por defecto 1000)
 * @returns Array de objetos ProjectData con timestamps secuenciales
 */
export function buildProjectsWithTimestamps(
  count: number,
  startTimestamp: number = Date.now(),
  interval: number = 1000
): ProjectData[] {
  return Array.from({ length: count }, (_, index) =>
    buildProject({
      timestamp: startTimestamp + index * interval
    })
  );
}

/**
 * Construye un proyecto con caracteres especiales para testing de casos extremos
 * 
 * @param overrides - Datos parciales del proyecto opcionales para sobrescribir valores por defecto
 * @returns Objeto ProjectData con caracteres especiales
 */
export function buildSpecialCharProject(overrides: Partial<ProjectData> = {}): ProjectData {
  projectCounter++;

  return {
    title: `Special Project @#$%^&*() ${projectCounter}`,
    description: `Project with émojis 🚀💻 and special chars: <>&"'`,
    version: `1.0.0-beta.${projectCounter}`,
    link: `https://github.com/special/project-${projectCounter}`,
    tag: `Special,Chars,Testing`,
    timestamp: timestampBase + projectCounter * 1000,
    ...overrides
  };
}

/**
 * Construye proyectos para testing de operaciones por lotes
 * Crea proyectos con patrones predecibles
 * 
 * @param count - Número de proyectos a generar
 * @returns Array de objetos ProjectData para testing por lotes
 */
export function buildBatchProjects(count: number): ProjectData[] {
  const batches = ['Frontend', 'Backend', 'Mobile', 'DevOps', 'Testing'];
  
  return Array.from({ length: count }, (_, index) => {
    const batch = batches[index % batches.length];
    return buildProject({
      title: `${batch} Project ${Math.floor(index / batches.length) + 1}`,
      tag: `${batch},Batch,Testing`,
      description: `Project for ${batch} batch testing`
    });
  });
}
