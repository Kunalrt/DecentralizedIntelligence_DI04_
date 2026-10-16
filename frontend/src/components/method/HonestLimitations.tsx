import React from 'react';
import { AlertCircle, Flame, Clock, EyeOff, CloudSun, HelpCircle } from 'lucide-react';

export const HonestLimitations: React.FC = () => {
  const limitations = [
    {
      title: '1. Cannot Detect Active Firing or Internal Combustion',
      desc: 'Optical RGB imagery records surface reflectance, not heat. Brick kiln firing occurs under soil and movable metal duct covers. Without Mid-Wave Infrared (MWIR) or thermal sensors (such as Landsat-8 TIRS or ECOSTRESS), optical passes cannot verify if bricks are actively burning inside the trench today.',
      icon: <Flame className="w-4 h-4 text-orange-500" />,
    },
    {
      title: '2. Cannot Distinguish Operational vs. Seasonal Idling in Single Pass',
      desc: 'A single satellite pass identifies physical infrastructure (chimney shadow, trench shape, brick stacks), but cannot determine if a site is temporarily idle between firings, undergoing winter overhaul, or fully operational. Multi-temporal change detection over 3–6 months is required to assess true utilization.',
      icon: <Clock className="w-4 h-4 text-blue-500" />,
    },
    {
      title: '3. 10-Meter Ground Resolution Ceiling',
      desc: 'Sentinel-2 pixels measure 10 m x 10 m. A standard 35 m kiln spans only 3 to 4 pixels in width. Small artisanal clamp kilns (< 20 m across) or rudimentary baking piles lack distinctive chimney shadows and fall beneath the optical detection threshold, blending into agricultural soils.',
      icon: <EyeOff className="w-4 h-4 text-purple-500" />,
    },
    {
      title: '4. Monsoon Cloud Cover & Dust Haze Blindness',
      desc: 'Optical satellites cannot penetrate dense cloud cover or thick smog during peak post-harvest haze and monsoon months (July–September). Synthetic Aperture Radar (SAR / Sentinel-1) or ground patrols are required when optical passes fail.',
      icon: <CloudSun className="w-4 h-4 text-amber-500" />,
    },
    {
      title: '5. Statistical Confidence Bounds vs. Physical Ground Truth',
      desc: 'No comprehensive ground-truth census team has yet visited every coordinate in this Demo District. Because precision is 0.89 for FCBK and 0.65 for Zigzag, our reported counts incorporate honest statistical confidence intervals (FCBK: 18–41, Zigzag: 21–45). Field validation remains mandatory.',
      icon: <HelpCircle className="w-4 h-4 text-emerald-600" />,
    },
  ];

  return (
    <div className="bg-slate-900 text-white rounded-xl p-5 sm:p-6 shadow-md border border-slate-800 space-y-4">
      <div className="border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-white m-0">
            Systemic Machine Learning & Remote Sensing Limitations
          </h3>
        </div>
        <p className="text-xs text-slate-400 m-0 mt-0.5">
          What this automated system CANNOT do: essential guardrails for judges, regulators, and field teams.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {limitations.map((item, index) => (
          <div
            key={index}
            className={`p-3.5 rounded-lg bg-slate-800/80 border border-slate-700/80 space-y-1.5 ${
              index === limitations.length - 1 ? 'md:col-span-2 lg:col-span-1' : ''
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs text-white">
              {item.icon}
              <span>{item.title}</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed m-0">
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800/80 flex items-center justify-between">
        <span>Scientific Integrity Protocol: Never overstate satellite AI capabilities.</span>
        <span className="text-amber-300 font-semibold">Human-in-the-loop inspection is mandatory.</span>
      </div>
    </div>
  );
};
