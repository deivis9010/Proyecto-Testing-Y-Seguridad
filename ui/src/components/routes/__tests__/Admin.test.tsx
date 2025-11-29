import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Admin from '../Admin';
import * as useProjectHook from '../../../hooks/useProject';
import * as useCreateOrUpdateHook from '../../../hooks/useCreateOrUpdateProject';

// Mock de react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'admin.header': 'Administrar Proyectos',
        'admin.input_title': 'Título del proyecto',
        'admin.input_description': 'Descripción',
        'admin.input_link': 'URL del proyecto',
        'admin.input_tags': 'Tags (separados por coma)',
        'admin.input_version': 'Versión',
        'admin.button_accept': 'Crear',
        'admin.button_accept_update': 'Actualizar',
        'admin.button_delete': 'Cancelar',
        'admin.err_invalid_form': 'Formulario inválido',
        'loader.text': 'Cargando...'
      };
      return translations[key] || key;
    }
  })
}));

// Mock de react-router
const mockNavigate = jest.fn();
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate
}));

// Mock de react-router-dom para que BrowserRouter funcione correctamente  
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock de api-client-factory
jest.mock('../../../api/api-client-factory', () => ({
  __esModule: true,
  default: () => ({
    createOrUpdateProject: jest.fn()
  })
}));

describe('Admin Component', () => {
  const mockRemoveProject = jest.fn();
  const mockCreateOrUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock por defecto de useProject
    jest.spyOn(useProjectHook, 'default').mockReturnValue({
      project: undefined,
      addProject: jest.fn(),
      removeProject: mockRemoveProject
    });

    // Mock por defecto de useCreateOrUpdate
    jest.spyOn(useCreateOrUpdateHook, 'useCreateOrUpdate').mockReturnValue({
      createOrUpdate: mockCreateOrUpdate,
      status: undefined,
      error: undefined
    });
  });

  const renderAdmin = () => {
    return render(
      <BrowserRouter>
        <Admin />
      </BrowserRouter>
    );
  };

  describe('Renderizado inicial', () => {
    it('debe renderizar el formulario con todos los campos vacíos', () => {
      renderAdmin();

      expect(screen.getByText('Administrar Proyectos')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Título del proyecto')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Descripción')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('URL del proyecto')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Tags (separados por coma)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Versión')).toBeInTheDocument();
    });

    it('debe renderizar botones de envío y cancelación', () => {
      renderAdmin();

      expect(screen.getByDisplayValue('Crear')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Cancelar')).toBeInTheDocument();
    });

    it('debe tener el botón de envío deshabilitado inicialmente', () => {
      renderAdmin();

      const submitButton = screen.getByDisplayValue('Crear') as HTMLInputElement;
      expect(submitButton.disabled).toBe(true);
    });
  });

  describe('Validación de formulario', () => {
    it('debe habilitar el botón de envío cuando todos los campos están llenos', () => {
      renderAdmin();

      const titleInput = screen.getByPlaceholderText('Título del proyecto') as HTMLInputElement;
      const descriptionInput = screen.getByPlaceholderText('Descripción') as HTMLInputElement;
      const linkInput = screen.getByPlaceholderText('URL del proyecto') as HTMLInputElement;
      const tagsInput = screen.getByPlaceholderText('Tags (separados por coma)') as HTMLInputElement;
      const versionInput = screen.getByPlaceholderText('Versión') as HTMLInputElement;

      fireEvent.change(titleInput, { target: { value: 'Test Project' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });
      fireEvent.change(linkInput, { target: { value: 'https://test.com' } });
      fireEvent.change(tagsInput, { target: { value: 'React,Testing' } });
      fireEvent.change(versionInput, { target: { value: '1.0.0' } });

      const submitButton = screen.getByDisplayValue('Crear') as HTMLInputElement;
      expect(submitButton.disabled).toBe(false);
    });

    it('debe mantener el botón deshabilitado si falta algún campo', () => {
      renderAdmin();

      const titleInput = screen.getByPlaceholderText('Título del proyecto') as HTMLInputElement;
      fireEvent.change(titleInput, { target: { value: 'Test Project' } });

      const submitButton = screen.getByDisplayValue('Crear') as HTMLInputElement;
      expect(submitButton.disabled).toBe(true);
    });
  });

  describe('Envío de formulario', () => {
    it('debe llamar createOrUpdate con los datos correctos al enviar', async () => {
      renderAdmin();

      // Llenar todos los campos
      fireEvent.change(screen.getByPlaceholderText('Título del proyecto'), {
        target: { value: 'New Project' }
      });
      fireEvent.change(screen.getByPlaceholderText('Descripción'), {
        target: { value: 'Project Description' }
      });
      fireEvent.change(screen.getByPlaceholderText('URL del proyecto'), {
        target: { value: 'https://github.com/test' }
      });
      fireEvent.change(screen.getByPlaceholderText('Tags (separados por coma)'), {
        target: { value: 'React,Node' }
      });
      fireEvent.change(screen.getByPlaceholderText('Versión'), {
        target: { value: '2.0.0' }
      });

      // Enviar formulario
      const form = screen.getByPlaceholderText('Título del proyecto').closest('form')!;
      fireEvent.submit(form);

      expect(mockCreateOrUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Project',
          description: 'Project Description',
          link: 'https://github.com/test',
          tag: 'React,Node',
          version: '2.0.0'
        }),
        undefined
      );
    });

    it('debe mostrar mensaje de error si el formulario es inválido', () => {
      renderAdmin();

      const form = screen.getByPlaceholderText('Título del proyecto').closest('form')!;
      fireEvent.submit(form);

      expect(mockCreateOrUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        'Formulario inválido'
      );
    });
  });

  describe('Estado de carga', () => {
    it('debe mostrar el loader cuando status es loading', () => {
      jest.spyOn(useCreateOrUpdateHook, 'useCreateOrUpdate').mockReturnValue({
        createOrUpdate: mockCreateOrUpdate,
        status: 'loading',
        error: undefined
      });

      renderAdmin();

      expect(screen.getByText('Cargando...')).toBeInTheDocument();
    });

    it('debe deshabilitar los botones durante la carga', () => {
      jest.spyOn(useCreateOrUpdateHook, 'useCreateOrUpdate').mockReturnValue({
        createOrUpdate: mockCreateOrUpdate,
        status: 'loading',
        error: undefined
      });

      renderAdmin();

      const submitButton = screen.getByDisplayValue('Crear') as HTMLInputElement;
      const cancelButton = screen.getByDisplayValue('Cancelar') as HTMLInputElement;

      expect(submitButton.disabled).toBe(true);
      expect(cancelButton.disabled).toBe(true);
    });
  });

  describe('Manejo de errores', () => {
    it('debe mostrar mensaje de error cuando hay un error', () => {
      const mockError = new Error('Error al crear proyecto');
      
      jest.spyOn(useCreateOrUpdateHook, 'useCreateOrUpdate').mockReturnValue({
        createOrUpdate: mockCreateOrUpdate,
        status: undefined,
        error: mockError
      });

      renderAdmin();

      expect(screen.getByText('Error al crear proyecto')).toBeInTheDocument();
    });
  });

  describe('Navegación después del éxito', () => {
    it('debe navegar a dashboard y limpiar proyecto después del éxito', async () => {
      const { rerender } = renderAdmin();

      // Simular cambio a estado success
      jest.spyOn(useCreateOrUpdateHook, 'useCreateOrUpdate').mockReturnValue({
        createOrUpdate: mockCreateOrUpdate,
        status: 'success',
        error: undefined
      });

      rerender(
        <BrowserRouter>
          <Admin />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockRemoveProject).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Modo edición con proyecto existente', () => {
    it('debe cargar datos del proyecto existente en el formulario', () => {
      const existingProject = {
        _id: '123',
        title: 'Existing Project',
        description: 'Existing Description',
        link: 'https://existing.com',
        tag: 'Existing,Tags',
        version: '1.5.0',
        timestamp: 1638360000000
      };

      jest.spyOn(useProjectHook, 'default').mockReturnValue({
        project: existingProject,
        addProject: jest.fn(),
        removeProject: mockRemoveProject
      });

      renderAdmin();

      expect(screen.getByDisplayValue('Existing Project')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing Description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://existing.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing,Tags')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1.5.0')).toBeInTheDocument();
    });

    it('debe mostrar botón "Actualizar" en lugar de "Crear" cuando hay proyecto', () => {
      jest.spyOn(useProjectHook, 'default').mockReturnValue({
        project: { title: 'Test', description: '', link: '', tag: '', version: '', timestamp: 1638360000000 },
        addProject: jest.fn(),
        removeProject: mockRemoveProject
      });
      
      renderAdmin();

      expect(screen.getByDisplayValue('Actualizar')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('Crear')).not.toBeInTheDocument();
    });
  });

  describe('Botón de cancelación', () => {
    it('debe limpiar el formulario al hacer click en cancelar', () => {
      renderAdmin();

      // Llenar campos
      fireEvent.change(screen.getByPlaceholderText('Título del proyecto'), {
        target: { value: 'Test' }
      });

      // Click en cancelar
      const cancelButton = screen.getByDisplayValue('Cancelar');
      fireEvent.click(cancelButton);

      const titleInput = screen.getByPlaceholderText('Título del proyecto') as HTMLInputElement;
      expect(titleInput.value).toBe('');
      expect(mockRemoveProject).toHaveBeenCalled();
    });
  });

  describe('Cambios en inputs', () => {
    it('debe actualizar el estado al cambiar el título', () => {
      renderAdmin();

      const titleInput = screen.getByPlaceholderText('Título del proyecto') as HTMLInputElement;
      fireEvent.change(titleInput, { target: { value: 'New Title' } });

      expect(titleInput.value).toBe('New Title');
    });

    it('debe actualizar todos los campos independientemente', () => {
      renderAdmin();

      const titleInput = screen.getByPlaceholderText('Título del proyecto') as HTMLInputElement;
      const descriptionInput = screen.getByPlaceholderText('Descripción') as HTMLInputElement;
      const linkInput = screen.getByPlaceholderText('URL del proyecto') as HTMLInputElement;
      const tagsInput = screen.getByPlaceholderText('Tags (separados por coma)') as HTMLInputElement;
      const versionInput = screen.getByPlaceholderText('Versión') as HTMLInputElement;

      fireEvent.change(titleInput, { target: { value: 'Title 1' } });
      fireEvent.change(descriptionInput, { target: { value: 'Desc 1' } });
      fireEvent.change(linkInput, { target: { value: 'http://link1.com' } });
      fireEvent.change(tagsInput, { target: { value: 'tag1,tag2' } });
      fireEvent.change(versionInput, { target: { value: '3.0.0' } });

      expect(titleInput.value).toBe('Title 1');
      expect(descriptionInput.value).toBe('Desc 1');
      expect(linkInput.value).toBe('http://link1.com');
      expect(tagsInput.value).toBe('tag1,tag2');
      expect(versionInput.value).toBe('3.0.0');
    });
  });

  describe('Timestamp automático', () => {
    it('debe agregar timestamp al crear proyecto si no existe', () => {
      const mockDate = 1638360000000;
      jest.spyOn(Date, 'now').mockReturnValue(mockDate);

      renderAdmin();

      // Llenar todos los campos
      fireEvent.change(screen.getByPlaceholderText('Título del proyecto'), {
        target: { value: 'Test Project' }
      });
      fireEvent.change(screen.getByPlaceholderText('Descripción'), {
        target: { value: 'Description' }
      });
      fireEvent.change(screen.getByPlaceholderText('URL del proyecto'), {
        target: { value: 'https://test.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('Tags (separados por coma)'), {
        target: { value: 'React' }
      });
      fireEvent.change(screen.getByPlaceholderText('Versión'), {
        target: { value: '1.0.0' }
      });

      const form = screen.getByPlaceholderText('Título del proyecto').closest('form')!;
      fireEvent.submit(form);

      expect(mockCreateOrUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: mockDate
        }),
        undefined
      );

      jest.restoreAllMocks();
    });
  });
});
