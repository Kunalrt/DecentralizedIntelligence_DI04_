import React, { useState } from 'react';
import { Upload, Cpu, Loader2, Info, Crosshair, AlertTriangle, RefreshCw } from 'lucide-react';
import { KILN_COLORS, API_CONFIG } from '../../config/constants';
import { Badge } from '../../design';

interface DemoSample {
  id: string;
  label: string;
  desc: string;
  cls: 'FCBK' | 'Zigzag' | 'CFCBK';
  confidence: number;
  box: [number, number][]; // normalized [x, y] 4 corners
  status: string;
  interpretation: string;
  priority: 'HIGH' | 'MEDIUM' | 'COMPLIANT';
}

const PRESET_SAMPLES: DemoSample[] = [
  {
    id: 'sample-1',
    label: 'Sample A: Persistent FCBK',
    desc: 'Cluster 1 &bull; Prohibited natural-draft oval trench',
    cls: 'FCBK',
    confidence: 0.954,
    box: [
      [0.28, 0.35],
      [0.72, 0.35],
      [0.72, 0.65],
      [0.28, 0.65],
    ],
    status: 'Non-Compliant (2022 Ban)',
    interpretation:
      'Persistent natural-draft FCBK oval layout with central chimney shadow. Priority inspection target.',
    priority: 'HIGH',
  },
  {
    id: 'sample-2',
    label: 'Sample B: Compliant Zigzag',
    desc: 'Cluster 3 &bull; Forced-draft zigzag channel layout',
    cls: 'Zigzag',
    confidence: 0.861,
    box: [
      [0.25, 0.32],
      [0.75, 0.32],
      [0.75, 0.68],
      [0.25, 0.68],
    ],
    status: 'Compliant (Zigzag Retrofit)',
    interpretation:
      'Verified rectangular forced-draft zigzag retrofit. Significantly lower particulate emissions.',
    priority: 'COMPLIANT',
  },
  {
    id: 'sample-3',
    label: 'Sample C: Circular CFCBK',
    desc: 'Cluster 9 &bull; Rare circular Bull’s Trench footprint (~3% prevalence)',
    cls: 'CFCBK',
    confidence: 0.937,
    box: [
      [0.30, 0.30],
      [0.70, 0.30],
      [0.70, 0.70],
      [0.30, 0.70],
    ],
    status: 'Heritage Review',
    interpretation:
      'Circular Bull’s Trench kiln. Near-zero classification confusion. Check local licensing registry.',
    priority: 'MEDIUM',
  },
];

export const TileInferenceDemo: React.FC = () => {
  const [selectedSample, setSelectedSample] = useState<DemoSample>(PRESET_SAMPLES[0]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [customFile, setCustomFile] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customPrediction, setCustomPrediction] = useState<DemoSample | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [detectedCount, setDetectedCount] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeData = customPrediction || selectedSample;
  const color = KILN_COLORS[activeData.cls] || '#E8710A';

  // Configurable Backend API URL from environment variable
  const apiUrl = API_CONFIG.baseUrl;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setErrorMessage(null);
    setCustomPrediction(null);
    setLatencyMs(null);
    setDetectedCount(null);

    // Generate immediate image preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setCustomFile(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDetect = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      // Send as multipart/form-data to ${VITE_API_URL}/predict per specification
      let res = await fetch(`${apiUrl}/predict`, {
        method: 'POST',
        body: formData,
      });

      // Backward-compatible fallback to /api/predict if /predict returns 404
      if (res.status === 404) {
        res = await fetch(`${apiUrl}/api/predict`, {
          method: 'POST',
          body: formData,
        });
      }

      if (!res.ok) {
        const errDetail = await res.text().catch(() => '');
        throw new Error(
          `Inference server error (HTTP ${res.status}): ${errDetail || res.statusText || 'Request failed'}`
        );
      }

      const data = await res.json();
      const detections = data.detections || [];
      if (detections.length === 0) {
        throw new Error('Inference succeeded, but no kilns were detected in this image tile.');
      }

      const det = detections[0];
      const clsName = (det.cls as 'FCBK' | 'Zigzag' | 'CFCBK') || 'FCBK';

      setLatencyMs(data.inference_time_ms ?? null);
      setDetectedCount(data.detections_count ?? detections.length);

      setCustomPrediction({
        id: `custom-live-${Date.now()}`,
        label: `Custom: ${uploadedFile.name}`,
        desc: `YOLO11s Inference: ${data.inference_time_ms} ms (${data.device || 'CPU'})`,
        cls: clsName,
        confidence: typeof det.confidence === 'number' ? det.confidence : 0.92,
        box: det.box_normalized || [
          [0.28, 0.35],
          [0.72, 0.35],
          [0.72, 0.65],
          [0.28, 0.65],
        ],
        status:
          det.legal_status ||
          (clsName === 'Zigzag'
            ? 'Compliant (Mandate-Approved)'
            : clsName === 'CFCBK'
            ? 'Special Review Required'
            : 'Prohibited (2022 Mandate Violation)'),
        interpretation:
          det.farida_interpretation ||
          `Detected ${clsName} kiln structure with ${(det.confidence * 100).toFixed(1)}% model confidence.`,
        priority:
          (det.priority_level as any) ||
          (clsName === 'Zigzag' ? 'COMPLIANT' : clsName === 'CFCBK' ? 'MEDIUM' : 'HIGH'),
      });
    } catch (err: any) {
      console.error('[YOLO11 INFERENCE ERROR]', err);
      setErrorMessage(
        err.message ||
          `Failed to connect to backend at ${apiUrl}/predict. Please verify server status or network connection.`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-[4px] border border-[#D9D6CE] shadow-xs p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9D6CE] pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-[2px] bg-[#FAF9F5] border border-[#D9D6CE] text-[#1F4E5F]">
              <Cpu size={15} strokeWidth={1.5} />
            </span>
            <h3 className="text-sm font-serif font-bold text-[#1F2328] m-0">
              Sentinel-2 Tile Inference Demo
            </h3>
          </div>
          <p className="text-2xs text-[#656D76] font-mono m-0 mt-0.5">
            Real-time YOLO11s-OBB detection &bull; Connected to <span className="text-[#1F4E5F] font-semibold">{apiUrl}</span>
          </p>
        </div>

        <Badge variant="outline">
          Inference Engine (YOLO11s-OBB)
        </Badge>
      </div>

      {/* Preset Selectors & Upload */}
      <div className="flex flex-wrap items-center gap-2 font-mono text-2xs">
        {PRESET_SAMPLES.map((sample) => (
          <button
            key={sample.id}
            type="button"
            onClick={() => {
              setCustomPrediction(null);
              setUploadedFile(null);
              setCustomFile(null);
              setErrorMessage(null);
              setLatencyMs(null);
              setDetectedCount(null);
              setSelectedSample(sample);
            }}
            className={`px-2.5 py-1 rounded-[2px] border font-medium transition-colors ${
              activeData.id === sample.id
                ? 'bg-[#1F4E5F] text-white border-[#1F4E5F] shadow-xs'
                : 'bg-[#FAF9F5] text-[#1F2328] border-[#D9D6CE] hover:bg-[#F5F3EE]'
            }`}
          >
            {sample.label.split(':')[0]}
          </button>
        ))}

        {/* Upload Custom Tile */}
        <label className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FAF9F5] text-[#1F2328] border border-[#D9D6CE] rounded-[2px] text-2xs font-mono font-medium cursor-pointer hover:bg-[#F5F3EE] transition-colors shadow-xs">
          <Upload size={12} strokeWidth={1.5} />
          <span>{uploadedFile ? uploadedFile.name : 'Upload Image'}</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/tiff"
            onChange={handleFileSelect}
            disabled={isProcessing}
            className="hidden"
          />
        </label>

        {/* Dedicated Detect Action Button */}
        {uploadedFile && (
          <button
            type="button"
            onClick={handleDetect}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1F2328] text-white rounded-[2px] text-2xs font-mono font-semibold hover:bg-black transition-colors shadow-xs disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 size={12} strokeWidth={1.5} className="animate-spin text-[#38BDF8]" />
            ) : (
              <Crosshair size={12} strokeWidth={1.5} className="text-[#38BDF8]" />
            )}
            <span>{isProcessing ? 'Detecting...' : 'Detect'}</span>
          </button>
        )}
      </div>

      {/* Useful Error Message Banner */}
      {errorMessage && (
        <div
          role="alert"
          className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-[4px] text-xs font-mono text-[#991B1B] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="flex-shrink-0 text-[#DC2626]" />
            <span>{errorMessage}</span>
          </div>
          {uploadedFile && (
            <button
              type="button"
              onClick={handleDetect}
              disabled={isProcessing}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#DC2626] text-white rounded-[2px] text-2xs font-mono font-semibold hover:bg-[#B91C1C] transition-colors w-fit"
            >
              <RefreshCw size={11} className={isProcessing ? 'animate-spin' : ''} />
              <span>Retry Detect</span>
            </button>
          )}
        </div>
      )}

      {/* Interactive Inference Preview Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Simulated Tile with OBB Canvas */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div className="relative w-56 h-56 rounded-[2px] border border-[#D9D6CE] bg-[#14181C] overflow-hidden flex items-center justify-center">
            {customFile ? (
              <img
                src={customFile}
                alt="Uploaded Satellite Tile Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#E5E3DC] relative">
                {/* Simulated Kiln Structure */}
                <div
                  className="absolute rounded-full border border-[#1F2328]/60"
                  style={{
                    left: `${activeData.box[0][0] * 100}%`,
                    top: `${activeData.box[0][1] * 100}%`,
                    width: `${(activeData.box[1][0] - activeData.box[0][0]) * 100}%`,
                    height: `${(activeData.box[2][1] - activeData.box[0][1]) * 100}%`,
                    backgroundColor: 'rgba(120, 53, 15, 0.35)',
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-[#1F2328] mx-auto mt-6" />
                </div>
              </div>
            )}

            {/* Rotated Bounding Box (OBB) Overlay */}
            {(customPrediction || !customFile) && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <polygon
                  points={activeData.box
                    .map(([x, y]) => `${x * 224},${y * 224}`)
                    .join(' ')}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeDasharray="4, 2"
                />
                <circle
                  cx={((activeData.box[0][0] + activeData.box[1][0]) / 2) * 224}
                  cy={((activeData.box[0][1] + activeData.box[2][1]) / 2) * 224}
                  r="3"
                  fill={color}
                />
              </svg>
            )}

            {/* In-Tile Badge */}
            {customPrediction || !customFile ? (
              <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-[2px] bg-black/80 text-white font-mono text-2xs">
                {activeData.cls} &bull; {(activeData.confidence * 100).toFixed(1)}%
              </div>
            ) : uploadedFile && !isProcessing ? (
              <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-[2px] bg-[#1F4E5F]/90 text-white font-mono text-2xs">
                Ready &bull; Click "Detect"
              </div>
            ) : null}

            {/* Loading Indicator Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/65 backdrop-blur-[1px] flex flex-col items-center justify-center text-white gap-2 z-10">
                <Loader2 size={26} className="animate-spin text-[#38BDF8]" />
                <span className="text-2xs font-mono font-medium tracking-wide">YOLO11s Running...</span>
              </div>
            )}
          </div>
          <div className="text-2xs text-[#656D76] mt-1 font-mono">
            Sentinel-2 &bull; 10 m/px RGB Optical Input (128x128)
          </div>
        </div>

        {/* Inference Results */}
        <div className="md:col-span-7 space-y-2.5 text-xs">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <h4 className="text-sm font-serif font-bold text-[#1F2328] m-0">
                {activeData.cls} Kiln Detected
              </h4>
              <Badge
                variant={
                  activeData.priority === 'HIGH'
                    ? 'danger'
                    : activeData.priority === 'COMPLIANT'
                    ? 'success'
                    : 'warning'
                }
              >
                {activeData.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded-[2px] bg-[#FAF9F5] border border-[#D9D6CE]">
              <div className="text-2xs text-[#656D76]">Confidence</div>
              <div className="text-sm font-bold text-[#1F2328] mt-0.5">
                {(activeData.confidence * 100).toFixed(1)}%
              </div>
            </div>

            <div className="p-2 rounded-[2px] bg-[#FAF9F5] border border-[#D9D6CE]">
              <div className="text-2xs text-[#656D76]">
                {latencyMs !== null ? 'Inference Latency' : 'Typical Latency'}
              </div>
              <div className="text-sm font-bold text-[#16A34A] mt-0.5">
                {latencyMs !== null ? `${latencyMs} ms` : '~1.3 ms / tile'}
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-[2px] bg-[#FAF9F5] border border-[#D9D6CE] space-y-1">
            <div className="font-mono text-2xs font-semibold text-[#1F4E5F] flex items-center gap-1">
              <Info size={12} strokeWidth={1.5} />
              <span>Inspection Guidance:</span>
            </div>
            <p className="text-2xs text-[#656D76] leading-relaxed m-0 font-sans">
              {activeData.interpretation}
            </p>
          </div>

          {detectedCount !== null && (
            <div className="text-2xs font-mono text-[#656D76]">
              Total Detected: <strong className="text-[#1F2328]">{detectedCount}</strong> kiln{detectedCount !== 1 ? 's' : ''} in tile
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
