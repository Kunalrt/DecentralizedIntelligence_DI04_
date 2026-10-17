import React, { useState } from 'react';
import { Award, Copy, Check, ShieldCheck } from 'lucide-react';
import { DATASET_CREDIT } from '../../config/constants';
import { Badge, Button } from '../../design';

export const DatasetCitationCard: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const bibtex = `@inproceedings{mondal2025sentinelkilndb,
  title={SentinelKilnDB: A Large-Scale Benchmark for Brick Kiln Detection and Compliance Monitoring across the Indo-Gangetic Plains},
  author={Mondal, et al.},
  booktitle={Thirty-ninth Conference on Neural Information Processing Systems (NeurIPS 2025) Datasets and Benchmarks Track},
  year={2025},
  institution={Sustainability Lab, IIT Gandhinagar},
  license={CC BY-NC 4.0}
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bibtex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-white rounded-[4px] border border-[#D9D6CE] p-4 shadow-xs space-y-3 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9D6CE] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-[2px] bg-[#FAF9F5] border border-[#D9D6CE] text-[#1F4E5F]">
            <Award size={15} strokeWidth={1.5} />
          </span>
          <div>
            <h3 className="text-sm font-serif font-bold text-[#1F2328] m-0">
              Official Benchmark & Dataset Citation
            </h3>
            <p className="text-2xs text-[#656D76] font-mono m-0 mt-0.5">
              Strictly non-commercial research & regulatory compliance monitoring.
            </p>
          </div>
        </div>

        <Badge variant="outline" icon={<ShieldCheck size={12} strokeWidth={1.5} />}>
          {DATASET_CREDIT.license}
        </Badge>
      </div>

      <div className="space-y-1.5 text-[#1F2328] leading-relaxed font-sans text-xs">
        <p className="m-0 font-medium">
          <strong>Dataset Credit:</strong> {DATASET_CREDIT.fullText}
        </p>

        <p className="text-2xs text-[#656D76] m-0 font-mono">
          SentinelKilnDB comprises 114,300 Sentinel-2 multispectral satellite tiles with expert-verified oriented bounding boxes (OBB) across India, Pakistan, and Bangladesh. CC BY-NC 4.0 terms.
        </p>
      </div>

      {/* Copyable BibTeX Block */}
      <div className="bg-[#FAF9F5] rounded-[2px] border border-[#D9D6CE] p-2.5 relative">
        <div className="flex items-center justify-between mb-1">
          <span className="text-2xs font-mono uppercase text-[#656D76] font-bold tracking-wider">
            BibTeX Citation
          </span>
          <Button
            size="sm"
            variant="secondary"
            icon={copied ? <Check size={12} strokeWidth={2} /> : <Copy size={12} strokeWidth={1.5} />}
            onClick={handleCopy}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
        <pre className="text-2xs font-mono text-[#1F2328] overflow-x-auto whitespace-pre p-2 bg-white rounded-[2px] border border-[#D9D6CE] m-0">
          {bibtex}
        </pre>
      </div>
    </div>
  );
};
