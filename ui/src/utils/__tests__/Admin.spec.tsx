import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
/* eslint-disable @typescript-eslint/no-var-requires, global-require */
import Admin from '../../components/routes/Admin';

// Simulaciones (mocks)
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
jest.mock('../../api/api-client-factory', () =>
  jest.fn(() => ({ createOrUpdateProject: jest.fn() }))
);

// Simula los hooks usados por Admin
const mockUseCreateOrUpdate = { createOrUpdate: jest.fn(), status: 'idle', error: undefined };
jest.mock('../../hooks/useCreateOrUpdateProject', () => ({
  __esModule: true,
  useCreateOrUpdate: jest.fn(() => mockUseCreateOrUpdate)
}));

const mockRemoveProject = jest.fn();
jest.mock('../../hooks/useProject', () => ({
  __esModule: true,
  default: jest.fn(() => ({ project: undefined, removeProject: mockRemoveProject }))
}));

const mockNavigate = jest.fn();
jest.mock('react-router', () => ({ useNavigate: () => mockNavigate }));

const useCreateOrUpdateModule = require('../../hooks/useCreateOrUpdateProject') as {
  useCreateOrUpdate: jest.Mock;
};
const useProjectModule = require('../../hooks/useProject') as { default: jest.Mock };

describe('Admin component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restablecer el estado por defecto de los mocks
    useCreateOrUpdateModule.useCreateOrUpdate.mockImplementation(() => mockUseCreateOrUpdate);
    useProjectModule.default.mockImplementation(() => ({
      project: undefined,
      removeProject: mockRemoveProject
    }));
  });

  it('renderiza el formulario y controles iniciales (submit disabled)', () => {
    const { container } = render(<Admin />);

    // Los inputs deberían estar presentes
    expect(screen.getByPlaceholderText('admin.input_title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('admin.input_description')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('admin.input_link')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('admin.input_tags')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('admin.input_version')).toBeInTheDocument();

    // El submit debe estar deshabilitado porque el formulario no está listo
    const submit = container.querySelector('input[type="submit"]') as HTMLInputElement;
    expect(submit).toBeInTheDocument();
    expect(submit.disabled).toBe(true);
  });

  it('al rellenar campos permite submit y llama createOrUpdate con los datos', () => {
    const createOrUpdateMock = jest.fn();
    useCreateOrUpdateModule.useCreateOrUpdate.mockReturnValue({
      createOrUpdate: createOrUpdateMock,
      status: 'idle',
      error: undefined
    });

    const { container } = render(<Admin />);

    // Rellenar inputs
    fireEvent.change(screen.getByPlaceholderText('admin.input_title'), { target: { value: 'T' } });
    fireEvent.change(screen.getByPlaceholderText('admin.input_description'), {
      target: { value: 'D' }
    });
    fireEvent.change(screen.getByPlaceholderText('admin.input_link'), { target: { value: 'L' } });
    fireEvent.change(screen.getByPlaceholderText('admin.input_tags'), { target: { value: 'tag' } });
    fireEvent.change(screen.getByPlaceholderText('admin.input_version'), {
      target: { value: '1.0' }
    });

    const submit = container.querySelector('input[type="submit"]') as HTMLInputElement;
    expect(submit.disabled).toBe(false);

    // Enviar el formulario
    const form = container.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);

    expect(createOrUpdateMock).toHaveBeenCalledTimes(1);
    const arg = createOrUpdateMock.mock.calls[0][0];
    expect(arg.title).toBe('T');
    expect(arg.description).toBe('D');
    expect(arg.link).toBe('L');
    expect(arg.tag).toBe('tag');
    expect(arg.version).toBe('1.0');
    expect(arg.timestamp).toBeDefined();
  });

  it('muestra Loader cuando status es loading', () => {
    useCreateOrUpdateModule.useCreateOrUpdate.mockReturnValue({
      createOrUpdate: jest.fn(),
      status: 'loading',
      error: undefined
    });

    render(<Admin />);
    // El Loader muestra el texto de 'loader.text' según la traducción
    expect(screen.getByText('loader.text')).toBeInTheDocument();
  });

  it('cuando status es success navega y llama removeProject', () => {
    useCreateOrUpdateModule.useCreateOrUpdate.mockReturnValue({
      createOrUpdate: jest.fn(),
      status: 'success',
      error: undefined
    });

    render(<Admin />);

    expect(mockRemoveProject).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('reset limpia inputs y llama removeProject', () => {
    const { container } = render(<Admin />);

    const titleInput = screen.getByPlaceholderText('admin.input_title') as HTMLInputElement;
    // Simular que el usuario completa el input
    fireEvent.change(titleInput, { target: { value: 'X' } });
    expect(titleInput.value).toBe('X');

    const reset = container.querySelector('input[type="reset"]') as HTMLInputElement;
    fireEvent.click(reset);

    expect(mockRemoveProject).toHaveBeenCalled();
    expect(titleInput.value).toBe('');
  });

  it('evil input actualiza innerHTML con la imagen', () => {
    render(<Admin />);
    const imgInput = screen.getByPlaceholderText('image') as HTMLInputElement;
    fireEvent.change(imgInput, { target: { value: 'http://example.com/a.png' } });

    // El div con HTML malicioso debe contener la etiqueta img con el src
    expect(document.body.innerHTML).toContain('http://example.com/a.png');
  });
});
