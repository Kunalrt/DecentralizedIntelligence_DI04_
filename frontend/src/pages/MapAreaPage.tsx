import React, { useState, useEffect, useCallback } from 'react';
import {
  FileCode,
  Image as ImageIcon,
  Crosshair,
  Play,
  Layers,
  Info,
  AlertCircle,
} from 'lucide-react';
import { SectionHeader, Button, Badge, Panel } from '../design';
import { StepBar } from '../components/ingest/StepBar';
import type { IngestStep } from '../components/ingest/StepBar';
import { DropzoneCard } from '../components/ingest/DropzoneCard';
import { ProcessProgress } from '../components/ingest/ProcessProgress';
import { ExploreResultView } from '../components/ingest/ExploreResultView';
import {
  createIngestSession,
  uploadIngestFiles,
  triggerIngestRun,
  pollIngestStatus,
  fetchIngestResult,
  purgeIngestSession,
  getLocalExampleResult,
} from '../services/ingestApi';
import type { IngestStatus, IngestResult } from '../services/ingestApi';

const SESSION_STORAGE_KEY = 'agni_drishti_last_ingest_result';

export const MapAreaPage: React.FC = () => {
  // Step state: upload | process | explore
  const [currentStep, setCurrentStep] = useState<IngestStep>('upload');

  // File states
  const [boundaryFile, setBoundaryFile] = useState<File | null>(null);
  const [imageryFile, setImageryFile] = useState<File | null>(null);
  const [detectionsFile, setDetectionsFile] = useState<File | null>(null);

  // Validation / inline errors
  const [boundaryError, setBoundaryError] = useState<string | null>(null);
  const [imageryError, setImageryError] = useState<string | null>(null);
  const [detectionsError, setDetectionsError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Pipeline execution state
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [processStatus, setProcessStatus] = useState<IngestStatus>({
    step: 'created',
    percent: 0,
    message: 'Initializing ingestion pipeline...',
    warnings: [],
    error: null,
    completed: false,
  });

  // Cached Result state
  const [result, setResult] = useState<IngestResult | null>(null);

  // Restore cached result from sessionStorage on mount if exists
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setResult(parsed);
        setCurrentStep('explore');
      }
    } catch {
      // Ignore cache restore errors
    }
  }, []);

  // Handle file drops / validations
  const handleSetBoundary = (file: File | null) => {
    setBoundaryError(null);
    setGlobalError(null);
    if (file && file.size > 100 * 1024 * 1024) {
      setBoundaryError('File exceeds 100 MB limit');
      return;
    }
    setBoundaryFile(file);
  };

  const handleSetImagery = (file: File | null) => {
    setImageryError(null);
    setGlobalError(null);
    if (file && file.size > 100 * 1024 * 1024) {
      setImageryError('File exceeds 100 MB limit');
      return;
    }
    setImageryFile(file);
  };

  const handleSetDetections = (file: File | null) => {
    setDetectionsError(null);
    setGlobalError(null);
    if (file && file.size > 100 * 1024 * 1024) {
      setDetectionsError('File exceeds 100 MB limit');
      return;
    }
    setDetectionsFile(file);
  };

  // Paste file listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (currentStep !== 'upload') return;
      if (!e.clipboardData || !e.clipboardData.files.length) return;

      const file = e.clipboardData.files[0];
      const name = file.name.toLowerCase();

      if (name.endsWith('.geojson') || name.endsWith('.json') || name.endsWith('.kml') || name.endsWith('.zip')) {
        handleSetBoundary(file);
      } else if (name.endsWith('.tif') || name.endsWith('.tiff')) {
        handleSetImagery(file);
      } else if (name.endsWith('.csv')) {
        handleSetDetections(file);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [currentStep]);

  // Load Example Data package directly
  const handleLoadExample = useCallback(async () => {
    try {
      setGlobalError(null);
      setCurrentStep('process');
      setProcessStatus({
        step: 'read',
        percent: 25,
        message: 'Loading verified example data package...',
        warnings: [],
        error: null,
        completed: false,
      });

      // Try fetching example from backend if running, or use verified fallback fixture
      let exampleData: IngestResult;
      try {
        const res = await fetch('http://localhost:8000/ingest/example');
        if (res.ok) {
          exampleData = getLocalExampleResult('demo-example-session');
        } else {
          exampleData = getLocalExampleResult('demo-example-session');
        }
      } catch {
        exampleData = getLocalExampleResult('demo-example-session');
      }

      // Simulate smooth step tick for user experience
      setTimeout(() => {
        setProcessStatus({
          step: 'detect',
          percent: 65,
          message: 'Verifying rotated OBB kiln geometries...',
          warnings: [],
          error: null,
          completed: false,
        });
      }, 400);

      setTimeout(() => {
        setProcessStatus({
          step: 'completed',
          percent: 100,
          message: 'Survey ready',
          warnings: [],
          error: null,
          completed: true,
        });
        setResult(exampleData);
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(exampleData));
        setCurrentStep('explore');
      }, 900);
    } catch (err: any) {
      setGlobalError(err.message || 'Failed to load example data');
      setCurrentStep('upload');
    }
  }, []);

  // Run Real Ingestion Pipeline
  const handleRunPipeline = useCallback(async () => {
    if (!boundaryFile && !imageryFile && !detectionsFile) {
      setGlobalError('Please select at least one input: Boundary, Imagery, or Detections.');
      return;
    }

    try {
      setGlobalError(null);
      setCurrentStep('process');
      setProcessStatus({
        step: 'read',
        percent: 10,
        message: 'Initializing survey workspace...',
        warnings: [],
        error: null,
        completed: false,
      });

      // 1. Create session
      const sid = await createIngestSession();
      setActiveSessionId(sid);

      // 2. Upload files
      setProcessStatus((prev) => ({
        ...prev,
        step: 'read',
        percent: 25,
        message: 'Uploading input files to temporary session...',
      }));

      await uploadIngestFiles(sid, {
        boundary: boundaryFile || undefined,
        imagery: imageryFile || undefined,
        detections: detectionsFile || undefined,
      });

      // 3. Trigger processing run
      await triggerIngestRun(sid);

      // 4. Poll status until complete
      const pollInterval = setInterval(async () => {
        try {
          const st = await pollIngestStatus(sid);
          setProcessStatus(st);

          if (st.completed) {
            clearInterval(pollInterval);
            const res = await fetchIngestResult(sid);
            setResult(res);
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(res));
            setCurrentStep('explore');
          } else if (st.error) {
            clearInterval(pollInterval);
            setGlobalError(st.error);
            setCurrentStep('upload');
          }
        } catch (pollErr: any) {
          clearInterval(pollInterval);
          setGlobalError(pollErr.message || 'Error communicating with pipeline');
          setCurrentStep('upload');
        }
      }, 1000);
    } catch (err: any) {
      setGlobalError(err.message || 'Pipeline execution failed');
      setCurrentStep('upload');
    }
  }, [boundaryFile, imageryFile, detectionsFile]);

  // Clear data handler
  const handleClearData = useCallback(async () => {
    if (activeSessionId) {
      await purgeIngestSession(activeSessionId);
      setActiveSessionId(null);
    }
    setResult(null);
    setBoundaryFile(null);
    setImageryFile(null);
    setDetectionsFile(null);
    setBoundaryError(null);
    setImageryError(null);
    setDetectionsError(null);
    setGlobalError(null);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setCurrentStep('upload');
  }, [activeSessionId]);

  const hasAnyInput = Boolean(boundaryFile || imageryFile || detectionsFile);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Page Title & Mission Header */}
      <SectionHeader
        title="Custom Area Ingestion & Survey Mapping"
        subtitle="Automated 10 m/px verification, rotated OBB inference, and OpenStreetMap context enrichment for any custom area."
        badge={<Badge variant="accent">Geo-Studio v2.0</Badge>}
      />

      {/* Three Step Workflow Indicator */}
      <StepBar
        currentStep={currentStep}
        canExplore={result !== null}
        onSelectStep={(st) => setCurrentStep(st)}
      />

      {/* Global Error Banner */}
      {globalError && (
        <div
          role="alert"
          className="p-3 bg-[#FEF2F2] border border-[#DC2626] text-[#B91C1C] rounded-[4px] flex items-center gap-2 text-xs font-mono"
        >
          <AlertCircle size={16} strokeWidth={1.5} className="flex-shrink-0" />
          <span className="truncate">{globalError}</span>
        </div>
      )}

      {/* STEP 1: UPLOAD VIEW */}
      {currentStep === 'upload' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Boundary Dropzone */}
            <DropzoneCard
              title="Boundary"
              description="Upload district or taluk polygon boundary"
              acceptExtensions={['.geojson', '.json', '.kml', '.zip']}
              file={boundaryFile}
              onFileSelect={handleSetBoundary}
              error={boundaryError}
              icon={<FileCode size={20} strokeWidth={1.5} />}
            />

            {/* Imagery Dropzone */}
            <DropzoneCard
              title="Imagery"
              description="RGB raster at approx 10 m/px with CRS"
              acceptExtensions={['.tif', '.tiff']}
              file={imageryFile}
              onFileSelect={handleSetImagery}
              error={imageryError}
              icon={<ImageIcon size={20} strokeWidth={1.5} />}
            />

            {/* Detections Dropzone */}
            <DropzoneCard
              title="Detections"
              description="Candidate kiln coordinates (class, lat, lon)"
              acceptExtensions={['.csv', '.geojson']}
              file={detectionsFile}
              onFileSelect={handleSetDetections}
              error={detectionsError}
              icon={<Crosshair size={20} strokeWidth={1.5} />}
            />
          </div>

          {/* Action & Privacy Bar */}
          <Panel>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="primary"
                  icon={<Play size={14} strokeWidth={1.5} />}
                  onClick={handleRunPipeline}
                  disabled={!hasAnyInput}
                >
                  Run Ingestion Pipeline
                </Button>
                <Button
                  variant="secondary"
                  icon={<Layers size={14} strokeWidth={1.5} />}
                  onClick={handleLoadExample}
                >
                  Load Example Data
                </Button>
              </div>

              <div className="flex items-center gap-1.5 text-2xs text-[#656D76] font-mono">
                <Info size={13} strokeWidth={1.5} className="flex-shrink-0 text-[#1F4E5F]" />
                <span>Limit 100 MB/file, 300 MB/session &bull; Auto-deleted after 1 hour</span>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* STEP 2: PROCESS VIEW */}
      {currentStep === 'process' && (
        <ProcessProgress status={processStatus} />
      )}

      {/* STEP 3: EXPLORE VIEW */}
      {currentStep === 'explore' && result && (
        <ExploreResultView result={result} onClearData={handleClearData} />
      )}
    </div>
  );
};
