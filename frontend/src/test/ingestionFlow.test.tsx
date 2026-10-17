import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepBar } from '../components/ingest/StepBar';
import { DropzoneCard } from '../components/ingest/DropzoneCard';
import { ProcessProgress } from '../components/ingest/ProcessProgress';
import { Upload } from 'lucide-react';
import type { IngestStatus } from '../services/ingestApi';

describe('Ingestion Workflow UI Components', () => {
  it('StepBar renders all 3 steps and respects canExplore flag', () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <StepBar currentStep="upload" onSelectStep={onSelect} canExplore={false} />
    );

    expect(screen.getByText('Upload')).toBeTruthy();
    expect(screen.getByText('Process')).toBeTruthy();
    expect(screen.getByText('Explore')).toBeTruthy();

    // Click Explore when disabled
    const exploreBtn = screen.getByText('Explore').closest('button');
    expect(exploreBtn?.hasAttribute('disabled')).toBe(true);

    // Rerender with canExplore = true
    rerender(<StepBar currentStep="upload" onSelectStep={onSelect} canExplore={true} />);
    expect(exploreBtn?.hasAttribute('disabled')).toBe(false);
    fireEvent.click(exploreBtn!);
    expect(onSelect).toHaveBeenCalledWith('explore');
  });

  it('DropzoneCard renders chips when valid and displays error when present', () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <DropzoneCard
        title="Boundary"
        description="Drop polygon boundary"
        acceptExtensions={['.geojson', '.kml']}
        file={null}
        onFileSelect={onSelect}
        error={null}
        icon={<Upload size={16} />}
      />
    );

    expect(screen.getByText('Boundary')).toBeTruthy();
    expect(screen.getByText('.geojson')).toBeTruthy();
    expect(screen.getByText('.kml')).toBeTruthy();

    // Now test with error
    rerender(
      <DropzoneCard
        title="Boundary"
        description="Drop polygon boundary"
        acceptExtensions={['.geojson', '.kml']}
        file={null}
        onFileSelect={onSelect}
        error="Invalid CRS format"
        icon={<Upload size={16} />}
      />
    );

    expect(screen.getByText('Invalid CRS format')).toBeTruthy();
  });

  it('ProcessProgress displays progress bar, 6 steps, and warnings as chips', () => {
    const mockStatus: IngestStatus = {
      step: 'detect',
      percent: 65,
      message: 'Running rotated OBB inference...',
      warnings: ['Imagery resampled from 15 m/px; accuracy may drop'],
      error: null,
      completed: false,
    };

    render(<ProcessProgress status={mockStatus} />);

    expect(screen.getByText('65%')).toBeTruthy();
    expect(screen.getByText('Read')).toBeTruthy();
    expect(screen.getByText('Check')).toBeTruthy();
    expect(screen.getByText('Detect')).toBeTruthy();
    expect(screen.getByText('Locate')).toBeTruthy();
    expect(screen.getByText('Roads')).toBeTruthy();
    expect(screen.getByText('Summarise')).toBeTruthy();

    // Warning should be visible
    expect(screen.getByText(/Imagery resampled/)).toBeTruthy();
  });
});
