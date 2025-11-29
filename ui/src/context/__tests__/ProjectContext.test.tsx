import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { ReactNode, useContext } from 'react';
import ProjectContext, { ProjectProvider } from '../ProjectContext';
import { Project } from '../../model/project';

// Wrapper para proporcionar el contexto en los tests
const wrapper = ({ children }: { children: ReactNode }) => (
  <ProjectProvider>{children}</ProjectProvider>
);

describe('ProjectContext - Tests de Integración Actividad 2', () => {
  // Mock de proyectos para usar en los tests
  const mockProject: Project = {
    _id: '123',
    title: 'Proyecto Test',
    description: 'Descripción del proyecto de prueba',
    version: '1.0.0',
    link: 'https://github.com/test/proyecto',
    tag: 'React,TypeScript',
    timestamp: 1638360000000
  };

  const mockProjectUpdated: Project = {
    _id: '123',
    title: 'Proyecto Actualizado',
    description: 'Descripción actualizada del proyecto',
    version: '2.0.0',
    link: 'https://github.com/test/proyecto-v2',
    tag: 'React,TypeScript,Jest',
    timestamp: 1638370000000
  };

  describe('Estado inicial', () => {
    it('debe verificar que projects comienza vacío (project es undefined)', () => {
      const { result } = renderHook(() => useContext(ProjectContext), { wrapper });      
      expect(result.current.project).toBeUndefined();
    });
    // Al no encontrar un estado loading aplique un nuevo test para verificar las funciones addProject y removeProject existen
    it('debe verificar que el estado inicial es correcto', () => {
      const { result } = renderHook(() => useContext(ProjectContext), { wrapper });

     
      expect(result.current.project).toBeUndefined();
      expect(result.current.addProject).toBeDefined();
      expect(result.current.removeProject).toBeDefined();
    });
  });

  describe('Agregar proyecto', () => {
    it('debe llamar addProject() con un proyecto válido y verificar que se agrega al estado', () => {
      const { result } = renderHook(() => useContext(ProjectContext), { wrapper });

      // Verificar estado inicial vacío
      expect(result.current.project).toBeUndefined();

      // Agregar proyecto válido con todos los campos requeridos
      act(() => {
        result.current.addProject(mockProject);
      });

      // Verificar que el proyecto se agregó correctamente
      expect(result.current.project).toBeDefined();
      expect(result.current.project?._id).toBe('123');
      expect(result.current.project?.title).toBe('Proyecto Test');
      expect(result.current.project?.description).toBe('Descripción del proyecto de prueba');
      expect(result.current.project?.version).toBe('1.0.0');
      expect(result.current.project?.link).toBe('https://github.com/test/proyecto');
      expect(result.current.project?.tag).toBe('React,TypeScript');
      expect(result.current.project?.timestamp).toBe(1638360000000);
    });

    
  });

  describe('Eliminar proyecto (deleteProject)', () => {
    it('debe agregar un proyecto y luego eliminarlo llamando removeProject (simula deleteProject)', () => {
      const { result } = renderHook(() => useContext(ProjectContext), { wrapper });

      //Agrego proyecto primero
      act(() => {
        result.current.addProject(mockProject);
      });

      expect(result.current.project).toBeDefined();
      expect(result.current.project?._id).toBe('123');

      //Ahora lo elimino
      act(() => {
        result.current.removeProject();
      });

      // Verificacion de que se eliminó correctamente
      expect(result.current.project).toBeUndefined();
    });

    it('debe eliminar múltiples proyectos uno tras otro sin problemas', () => {
      const { result } = renderHook(() => useContext(ProjectContext), { wrapper });

      // Agregar y eliminar proyecto 1
      act(() => {
        result.current.addProject(mockProject);
      });
      expect(result.current.project?._id).toBe('123');

      act(() => {
        result.current.removeProject();
      });
      expect(result.current.project).toBeUndefined();

      // Agregar y eliminar proyecto 2
      act(() => {
        result.current.addProject(mockProjectUpdated);
      });
      expect(result.current.project?._id).toBe('123');

      act(() => {
        result.current.removeProject();
      });
      expect(result.current.project).toBeUndefined();
    });
  });

  describe('Actualizar proyecto (updateProject)', () => {
    it('debe agregar un proyecto y luego actualizarlo con datos nuevos (flujo Dashboard -> Admin)', () => {
      const { result } = renderHook(() => useContext(ProjectContext), { wrapper });

      //Agrego proyecto inicial
      act(() => {
        result.current.addProject(mockProject);
      });

      expect(result.current.project?.title).toBe('Proyecto Test');
      expect(result.current.project?.version).toBe('1.0.0');
      expect(result.current.project?.tag).toBe('React,TypeScript');

      //Actualizo proyecto con nuevos datos (simula edición en Admin)
      act(() => {
        result.current.addProject(mockProjectUpdated);
      });

      // Verificar que los datos cambiaron correctamente
      expect(result.current.project?.title).toBe('Proyecto Actualizado');
      expect(result.current.project?.description).toBe('Descripción actualizada del proyecto');
      expect(result.current.project?.version).toBe('2.0.0');
      expect(result.current.project?.link).toBe('https://github.com/test/proyecto-v2');
      expect(result.current.project?.tag).toBe('React,TypeScript,Jest');
      expect(result.current.project?._id).toBe('123'); // El ID se mantiene
    });

    it('debe actualizar parcialmente un proyecto manteniendo campos no modificados', () => {
      const { result } = renderHook(() => useContext(ProjectContext), { wrapper });

      act(() => {
        result.current.addProject(mockProject);
      });

      // Actualización parcial (solo cambia title y description)
      const partialUpdate: Project = {
        ...mockProject,
        title: 'Título Actualizado',
        description: 'Nueva descripción'
      };

      act(() => {
        result.current.addProject(partialUpdate);
      });

      expect(result.current.project?.title).toBe('Título Actualizado');
      expect(result.current.project?.description).toBe('Nueva descripción');
      // Campos no modificados se mantienen
      expect(result.current.project?.version).toBe('1.0.0');
      expect(result.current.project?.link).toBe('https://github.com/test/proyecto');
      expect(result.current.project?.tag).toBe('React,TypeScript');
    });
  });

  describe('Error handling', () => {
    it('debe intentar eliminar un proyecto inexistente y verificar que no rompe la aplicación', () => {
      const { result } = renderHook(() => useContext(ProjectContext), { wrapper });

      // Estado inicial
      expect(result.current.project).toBeUndefined();

      // Intentar eliminar cuando no existe proyecto
      expect(() => {
        act(() => {
          result.current.removeProject();
        });
      }).not.toThrow();

      // Verificacion
      expect(result.current.project).toBeUndefined();
    });

    it('debe manejar operaciones repetidas de eliminación sin errores', () => {
      const { result } = renderHook(() => useContext(ProjectContext), { wrapper });

      // Eliminar múltiples veces sin proyecto
      for (let i = 0; i < 3; i++) {
        expect(() => {
          act(() => {
            result.current.removeProject();
          });
        }).not.toThrow();

        expect(result.current.project).toBeUndefined();
      }
    });

    it('debe manejar secuencia completa de operaciones sin errores (integración completa)', () => {
      const { result } = renderHook(() => useContext(ProjectContext), { wrapper });

      // Secuencia completa: agregar -> actualizar -> eliminar -> agregar
      act(() => {
        result.current.addProject(mockProject);
      });
      expect(result.current.project?._id).toBe('123');

      act(() => {
        result.current.addProject(mockProjectUpdated);
      });
      expect(result.current.project?.version).toBe('2.0.0');

      act(() => {
        result.current.removeProject();
      });
      expect(result.current.project).toBeUndefined();

      act(() => {
        result.current.addProject(mockProject);
      });
      expect(result.current.project?.title).toBe('Proyecto Test');
    });
  });

  describe('Integración: Flujos de Dashboard y Admin', () => {
    it('debe simular flujo Dashboard -> Admin: seleccionar proyecto para editar', () => {
      const { result } = renderHook(() => useContext(ProjectContext), { wrapper });

      // Usuario en Dashboard hace clic en botón "editar" de un proyecto
      act(() => {
        result.current.addProject(mockProject);
      });

      // Verificar que el proyecto está disponible para edición en Admin
      expect(result.current.project).toBeDefined();
      expect(result.current.project?.title).toBe('Proyecto Test');
      expect(result.current.project?.link).toBe('https://github.com/test/proyecto');
    });

    it('debe simular flujo Admin: crear nuevo proyecto desde formulario vacío', () => {
      const { result } = renderHook(() => useContext(ProjectContext), { wrapper });

      // Estado inicial en Admin (formulario vacío)
      expect(result.current.project).toBeUndefined();

      // Usuario completa formulario y envía nuevo proyecto
      const nuevoProyecto: Project = {
        title: 'Mi Primer Proyecto',
        description: 'Proyecto creado desde el formulario',
        version: '1.0.0',
        link: 'https://github.com/mi-usuario/mi-proyecto',
        tag: 'React',
        timestamp: Date.now()
      };

      act(() => {
        result.current.addProject(nuevoProyecto);
      });

      expect(result.current.project?.title).toBe('Mi Primer Proyecto');
      expect(result.current.project?._id).toBeUndefined(); // Nuevo proyecto sin ID
    });

    it('debe mantener la referencia de funciones entre re-renders (useCallback)', () => {
      const { result, rerender } = renderHook(() => useContext(ProjectContext), { wrapper });

      const addProjectRef = result.current.addProject;
      const removeProjectRef = result.current.removeProject;

      // Forzar re-render
      rerender();

      // Verificar que las funciones mantienen la misma referencia
      expect(result.current.addProject).toBe(addProjectRef);
      expect(result.current.removeProject).toBe(removeProjectRef);
    });
  });
});
