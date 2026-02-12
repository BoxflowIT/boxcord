// FileUpload Component Tests
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FileUpload, { AttachmentPreview } from '../../src/components/FileUpload';

describe('FileUpload', () => {
  it('should render upload button', () => {
    render(<FileUpload onFileSelect={vi.fn()} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('title', 'Bifoga fil');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<FileUpload onFileSelect={vi.fn()} disabled />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should call onFileSelect with valid file', () => {
    const onFileSelect = vi.fn();
    render(<FileUpload onFileSelect={onFileSelect} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [file] } });

    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it('should show error for oversized file', () => {
    const onFileSelect = vi.fn();
    render(<FileUpload onFileSelect={onFileSelect} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Create a mock file larger than 25MB
    const largeBlob = new Blob([new ArrayBuffer(26 * 1024 * 1024)]);
    const file = new File([largeBlob], 'large.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 26 * 1024 * 1024 });

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText('Filen är för stor (max 25MB)')).toBeInTheDocument();
    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it('should show error for unsupported file type', () => {
    const onFileSelect = vi.fn();
    render(<FileUpload onFileSelect={onFileSelect} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.exe', { type: 'application/x-executable' });

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText('Filtypen stöds inte')).toBeInTheDocument();
    expect(onFileSelect).not.toHaveBeenCalled();
  });
});

describe('AttachmentPreview', () => {
  it('should render image for image type', () => {
    render(
      <AttachmentPreview
        fileName="test.png"
        fileUrl="https://example.com/test.png"
        fileType="image/png"
        fileSize={1024}
      />
    );

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/test.png');
    expect(img).toHaveAttribute('alt', 'test.png');
  });

  it('should render video element for video type', () => {
    const { container } = render(
      <AttachmentPreview
        fileName="test.mp4"
        fileUrl="https://example.com/test.mp4"
        fileType="video/mp4"
        fileSize={5000000}
      />
    );

    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', 'https://example.com/test.mp4');
    expect(video).toHaveAttribute('controls');
  });

  it('should render generic file preview for other types', () => {
    render(
      <AttachmentPreview
        fileName="document.pdf"
        fileUrl="https://example.com/document.pdf"
        fileType="application/pdf"
        fileSize={2048576}
      />
    );

    // Should show filename
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    
    // Should show formatted file size
    expect(screen.getByText('2.0 MB')).toBeInTheDocument();
  });

  it('should format file sizes correctly', () => {
    const { rerender } = render(
      <AttachmentPreview
        fileName="small.txt"
        fileUrl="https://example.com/small.txt"
        fileType="text/plain"
        fileSize={500}
      />
    );

    expect(screen.getByText('500 B')).toBeInTheDocument();

    rerender(
      <AttachmentPreview
        fileName="medium.txt"
        fileUrl="https://example.com/medium.txt"
        fileType="text/plain"
        fileSize={5120}
      />
    );

    expect(screen.getByText('5.0 KB')).toBeInTheDocument();
  });
});
