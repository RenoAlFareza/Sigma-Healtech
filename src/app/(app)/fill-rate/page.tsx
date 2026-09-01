import type { Metadata } from 'next';
import { FillRateIntelligence } from '@/features/fill-rate/FillRateIntelligence';

export const metadata: Metadata = {
  title: 'Fill Rate Intelligence — SIGMA',
  description: 'Analisis requested, approved, issued, gap, dan service level requisition.',
};

export default function FillRatePage() { return <FillRateIntelligence />; }
