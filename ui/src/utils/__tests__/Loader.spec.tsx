import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Loader from '../../components/elements/Loader';

describe('Loader', () => {
  it('debe renderizar el mensaje correctamente', () => {
    const testMessage = 'Cargando datos...';
    render(<Loader message={testMessage} />);

    expect(screen.getByText(testMessage)).toBeInTheDocument();
  });

  it('debe renderizar la imagen del loader', () => {
    const testMessage = 'Loading';
    render(<Loader message={testMessage} />);

    // Buscar por alt text (accesibilidad)
    const loaderImage = screen.getByAltText(testMessage);
    expect(loaderImage).toBeInTheDocument();
    expect(loaderImage).toHaveAttribute('src');
  });

  it('debe renderizar con diferentes mensajes', () => {
    const { rerender } = render(<Loader message="Primer mensaje" />);
    expect(screen.getByText('Primer mensaje')).toBeInTheDocument();
    // Re-renderizar con nuevo mensaje
    rerender(<Loader message="Segundo mensaje" />);
    expect(screen.getByText('Segundo mensaje')).toBeInTheDocument();
    expect(screen.queryByText('Primer mensaje')).not.toBeInTheDocument();
  });

  it('debe tener la estructura DOM correcta', () => {
    const testMessage = 'Test';
    const { container } = render(<Loader message={testMessage} />);

    // Verificar que hay un contenedor principal (LoaderWrapper)
    expect(container.firstChild).toBeInTheDocument();

    // Verificar que contiene tanto imagen como mensaje
    const image = screen.getByAltText(testMessage);
    const text = screen.getByText(testMessage);
    expect(image).toBeInTheDocument();
    expect(text).toBeInTheDocument();
  });
  // Agregados para actividad 1 parte 4
  it('renderiza correctamente con mensaje vacío', () => {
    render(<Loader message={''} />);

    // debe existir la imagen con alt vacío y no lanzar error
    const img = screen.getByAltText('');
    expect(img).toBeInTheDocument();

    // el texto puede ser vacío; comprobar que no haya texto visible
    const containerText = document.body.textContent || '';
    expect(containerText.trim()).toBe('');
  });
  // Agregados para actividad 1 parte 4
  it('renderiza mensaje con contenido HTML-like como texto (sin inyección)', () => {
    const malicious = '<script>alert("xss")</script> Loading';
    render(<Loader message={malicious} />);

    // Debe renderizar el string tal cual
    expect(screen.getByText(malicious)).toBeInTheDocument();

    // No debe existir ninguna etiqueta <script> añadida al DOM
    const scriptTag = document.querySelector('script');
    expect(scriptTag).toBeNull();
  });
});
