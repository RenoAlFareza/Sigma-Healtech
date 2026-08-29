import type { Metadata } from 'next';
import { CycleCountManage } from '@/features/cycle-count/CycleCountManage';

export const metadata: Metadata = {
  title: 'Cycle Count — SIGMA',
  description: 'Manage inventory cycle counts.',
};

export default function CycleCountPage() {
  return (
    <div className="w-full">
      <CycleCountManage />
    </div>
  );
}
