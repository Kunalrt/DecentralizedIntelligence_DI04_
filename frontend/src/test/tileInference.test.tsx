import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TileInferenceDemo } from '../components/downloads/TileInferenceDemo';

describe('TileInferenceDemo Component', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('renders presets and upload button initially', () => {
    render(<TileInferenceDemo />);
    expect(screen.getByText('Sentinel-2 Tile Inference Demo')).toBeTruthy();
    expect(screen.getByText('Upload Image')).toBeTruthy();
    expect(screen.getByText('Sample A')).toBeTruthy();
    expect(screen.getByText('Sample B')).toBeTruthy();
    expect(screen.getByText('Sample C')).toBeTruthy();
  });

  it('shows Detect button after selecting a file and runs inference', async () => {
    const mockResponse = {
      filename: 'satellite_tile.png',
      inference_time_ms: 45.2,
      device: 'cuda:0',
      detections_count: 1,
      detections: [
        {
          kiln_id: 'KILN-TEST-999',
          cls: 'Zigzag',
          confidence: 0.965,
          box_normalized: [
            [0.2, 0.3],
            [0.8, 0.3],
            [0.8, 0.7],
            [0.2, 0.7],
          ],
          legal_status: 'Compliant (Mandate-Approved)',
          farida_interpretation: 'Compliant zigzag retrofit detected.',
          priority_level: 'COMPLIANT',
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    render(<TileInferenceDemo />);

    const file = new File(['mock content'], 'test_tile.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    // Detect button should now be visible
    const detectBtn = await screen.findByText('Detect');
    expect(detectBtn).toBeTruthy();

    // Click Detect
    fireEvent.click(detectBtn);

    // Verify fetch was called with multipart/form-data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      const call = (global.fetch as any).mock.calls[0];
      expect(call[0]).toMatch(/\/predict/);
      expect(call[1].method).toBe('POST');
      expect(call[1].body instanceof FormData).toBe(true);
    });

    // Verify returned object name and confidence percentage are displayed
    expect(await screen.findByText(/Zigzag Kiln Detected/)).toBeTruthy();
    expect(screen.getByText('96.5%')).toBeTruthy();
    expect(screen.getByText('Compliant (Mandate-Approved)')).toBeTruthy();
  });

  it('displays a useful error message when the backend API fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error: Failed to fetch'));

    render(<TileInferenceDemo />);

    const file = new File(['mock content'], 'offline_tile.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    const detectBtn = await screen.findByText('Detect');
    fireEvent.click(detectBtn);

    // Error message banner should be displayed
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText(/Network error|Failed to connect to backend/)).toBeTruthy();
    expect(screen.getByText('Retry Detect')).toBeTruthy();
  });
});
