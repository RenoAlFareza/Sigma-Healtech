import type { Metadata } from 'next';
import { RequisitionList } from '@/features/requisitions/RequisitionList';

export const metadata: Metadata = {
  title: 'Requisitions — SIGMA',
  description: 'Stock requisition requests.',
};

const REQUISITION_STATUSES = ['ALL', 'CREATED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PICKING', 'ISSUED', 'RECEIVED'];

export default async function RequisitionsPage({ searchParams }: PageProps<'/requisitions'>) {
  const params = await searchParams;
  const requestedStatus = typeof params.status === 'string' ? params.status : 'ALL';
  const initialStatus = REQUISITION_STATUSES.includes(requestedStatus) ? requestedStatus : 'ALL';

  return (
    <div className="w-full">
      <RequisitionList key={initialStatus} initialStatus={initialStatus} />
    </div>
  );
}
