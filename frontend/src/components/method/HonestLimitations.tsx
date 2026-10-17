import React from 'react';
import { AlertCircle, Flame, Clock, EyeOff, CloudSun, HelpCircle } from 'lucide-react';
import { InfoTooltip, DetailsCollapse } from '../../design';

export const HonestLimitations: React.FC = () => {
  const limitations = [
    {
      title: 'No Active Firing Detection',
      short: 'Optical RGB records surface reflectance, not internal heat or combustion.',
      full: 'Brick firing occurs beneath soil and metal duct covers. Mid-Wave Infrared (MWIR) or thermal sensors (e.g. Landsat-8 TIRS) are required to determine if bricks are currently firing inside the trench.',
      icon: <Flame size={15} strokeWidth={1.5} className="text-[#E8710A]" />,
    },
    {
      title: 'Operational vs. Seasonal Idling',
      short: 'Single pass cannot distinguish active vs temporarily idle kilns.',
      full: 'A single satellite pass identifies physical structures (chimney, trench, brick stacks), but multi-temporal change detection over 3-6 months is required to assess true seasonal utilization.',
      icon: <Clock size={15} strokeWidth={1.5} className="text-[#1A73E8]" />,
    },
    {
      title: '10 m Resolution Ceiling',
      short: 'Small clamp kilns (<20 m) blend into dry soil without chimney shadows.',
      full: 'Sentinel-2 pixels measure 10 m x 10 m. A standard 35 m kiln spans only 3-4 pixels. Rudiementary baking piles lack distinctive shadows and fall below the optical detection ceiling.',
      icon: <EyeOff size={15} strokeWidth={1.5} className="text-[#656D76]" />,
    },
    {
      title: 'Monsoon Cloud Blindness',
      short: 'Optical passes cannot penetrate monsoon clouds or heavy smog.',
      full: 'During peak post-harvest haze and monsoon months (July-September), Synthetic Aperture Radar (SAR / Sentinel-1) or ground patrols are required when optical passes fail.',
      icon: <CloudSun size={15} strokeWidth={1.5} className="text-[#E8710A]" />,
    },
    {
      title: 'Empirical Bounds vs. Ground Truth',
      short: 'Precision 0.89 (FCBK) and 0.65 (Zigzag) require reported confidence intervals.',
      full: 'No complete physical ground census exists for all 3,000 km². Statistical ranges (FCBK: 18-41, Zigzag: 21-45) account for false positives and false negatives.',
      icon: <HelpCircle size={15} strokeWidth={1.5} className="text-[#188038]" />,
    },
  ];

  return (
    <div className="bg-white rounded-[4px] border border-[#D9D6CE] p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-[#D9D6CE]">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-[2px] bg-[#FAF9F5] border border-[#D9D6CE] text-[#1F4E5F]">
            <AlertCircle size={15} strokeWidth={1.5} />
          </span>
          <div>
            <h3 className="text-sm font-serif font-bold text-[#1F2328] m-0">
              Systemic Model & Remote Sensing Limitations
            </h3>
            <p className="text-2xs text-[#656D76] font-mono m-0 mt-0.5">
              Verified physical constraints and boundaries of automated satellite surveillance.
            </p>
          </div>
        </div>
      </div>

      {/* 5 Compact Cards with Info Tooltips */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {limitations.map((item, index) => (
          <div
            key={index}
            className="p-2.5 rounded-[4px] bg-[#FAF9F5] border border-[#D9D6CE] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5 font-bold text-xs text-[#1F2328] font-serif">
                  {item.icon}
                  <span>{item.title}</span>
                </div>
                <InfoTooltip content={item.full} label={item.title} />
              </div>
              <p className="text-2xs text-[#656D76] leading-relaxed m-0 font-sans">
                {item.short}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Collapsible Full Methodology Limitations */}
      <DetailsCollapse summary="Comprehensive Physical & Remote Sensing Constraints">
        <div className="text-xs text-[#1F2328] font-sans space-y-2 pt-1">
          {limitations.map((item, idx) => (
            <div key={idx}>
              <strong className="text-[#1F2328]">{item.title}:</strong>{' '}
              <span className="text-[#656D76]">{item.full}</span>
            </div>
          ))}
        </div>
      </DetailsCollapse>
    </div>
  );
};
