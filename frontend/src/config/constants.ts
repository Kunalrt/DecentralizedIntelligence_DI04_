/**
 * Project Constants & Styling Rules
 * Unified color palette, shapes, and regulatory descriptions.
 */

import type { KilnClass } from '../types/data';

export const KILN_COLORS: Record<KilnClass, string> = {
  FCBK: '#E8710A',    // Orange (Oval)
  Zigzag: '#1A73E8',  // Blue (Rectangular)
  CFCBK: '#188038',   // Green (Circular)
};

export const KILN_SHAPES: Record<KilnClass, { name: string; symbol: string; cssClass: string }> = {
  FCBK: {
    name: 'Circle',
    symbol: '●',
    cssClass: 'marker-circle',
  },
  Zigzag: {
    name: 'Square',
    symbol: '■',
    cssClass: 'marker-square',
  },
  CFCBK: {
    name: 'Triangle',
    symbol: '▲',
    cssClass: 'marker-triangle',
  },
};

export const KILN_DESCRIPTIONS: Record<KilnClass, { title: string; legalStatus: string; description: string }> = {
  FCBK: {
    title: "Fixed Chimney Bull's Trench Kiln",
    legalStatus: 'Non-Compliant (Banned under 2022 Mandate)',
    description: 'Traditional oval kiln with high particulate emissions. Continued operation is a regulatory violation.',
  },
  Zigzag: {
    title: 'Zigzag Draft Kiln',
    legalStatus: 'Compliant (Mandate-Approved)',
    description: 'Modernized rectangular design forcing flue gas through a serpentine path to dramatically cut black carbon emissions.',
  },
  CFCBK: {
    title: 'Circular Fixed Chimney Kiln',
    legalStatus: 'Special Review Required',
    description: 'Rare circular footprint (~3% prevalence) requiring individual heritage and emission compliance review.',
  },
};

export const MAP_CONFIG = {
  defaultCenter: [28.6100, 77.1600] as [number, number],
  defaultZoom: 12,
  minZoom: 10,
  maxZoom: 18,
  tileLayerUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};

export const DATASET_CREDIT = {
  title: 'SentinelKilnDB',
  authors: 'Mondal et al., Sustainability Lab, IIT Gandhinagar',
  venue: 'NeurIPS 2025 Datasets & Benchmarks Track',
  license: 'CC BY-NC (Non-Commercial Use Only)',
  fullText: 'Dataset credit: SentinelKilnDB by Mondal et al., Sustainability Lab, IIT Gandhinagar (NeurIPS 2025 Datasets & Benchmarks), CC BY-NC, non-commercial use only.',
};

export const DISTRICT_INFO = {
  name: 'Demo District (Surveillance Zone A)',
  state: 'State Pollution Control Board (SPCB)',
  inspector: 'Inspector Farida Khan',
  areaKm2: 3000,
  satelliteSource: 'Sentinel-2 RGB Multispectral (10 m/pixel nadir)',
  modelVersion: 'AgniDrishti-OBB v1.0 (Rotated IoU mAP: 0.834)',
};

export const API_CONFIG = {
  baseUrl: (import.meta.env.VITE_API_URL || 'https://agni-dhrishti-v1.onrender.com').replace(/\/+$/, ''),
};
