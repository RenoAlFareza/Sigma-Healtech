'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, PackageCheck, ArrowLeft } from 'lucide-react';
import { Card, DataTable, StatusBadge, Button, Modal, Textarea, Skeleton, ErrorState, useToast } from '@/shared/ui';
import type { DataTableColumn } from '@/shared/ui';
import { formatDate, formatQuantity } from '@/shared/lib/format';
import { useAuth } from '@/features/auth/AuthProvider';
import { getRequisition, transitionStatus } from './api';
import type { Requisition } from '@/shared/types/domain';

export function RequisitionDetail({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { role } = useAuth();

  const [data, setData] = useState<Requisition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [working, setWorking] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRequisition(id);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat permintaan');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const transition = useCallback(
    async (status: string, reason?: string) => {
      setWorking(true);
      try {
        const updated = await transitionStatus(id, { status: status as never, reason });
        setData(updated);
        toast.success('Status diperbarui', 'Berhasil');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Gagal memperbarui status', 'Gagal');
      } finally {
        setWorking(false);
      }
    },
    [id, toast]
  );

  const handleApprove = () => transition('APPROVED');
  const handleReject = () => {
    transition('REJECTED', rejectReason || 'Ditolak tanpa alasan');
    setRejectModalOpen(false);
    setRejectReason('');
  };
  const handleIssue = () => transition('ISSUED');

  const columns: DataTableColumn<Requisition['items'][number]>[] = [
    { id: 'productId', header: 'SKU', accessorKey: 'productId', isMono: true, width: '120px' },
    {
      id: 'qtyRequested',
      header: 'Diminta',
      align: 'right',
      cell: (it) => formatQuantity(it.qtyRequested),
    },
    {
      id: 'qtyApproved',
      header: 'Disetujui',
      align: 'right',
      cell: (it) => (it.qtyApproved !== undefined ? formatQuantity(it.qtyApproved) : '—'),
    },
    {
      id: 'qtyIssued',
      header: 'Dikeluarkan',
      align: 'right',
      cell: (it) => (it.qtyIssued !== undefined ? formatQuantity(it.qtyIssued) : '—'),
    },
  ];

  if (loading) {
    return (
      <Card title="Detail Permintaan" padding="lg">
        <div className="flex flex-col gap-4">
          <Skeleton variant="rect" height={28} width="40%" count={1} />
          <Skeleton variant="text" height={16} count={6} />
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return <ErrorState message={error || 'Permintaan tidak ditemukan'} title="Detail Permintaan" />;
  }

  const canApprove = role === 'MANAGER' && data.status === 'SUBMITTED';
  const canIssue = (role === 'ASSISTANT' || role === 'MANAGER') && data.status === 'APPROVED';
  const isReadOnly = role === 'REQUESTOR' || role === 'VIEWER';

  return (
    <div className="flex flex-col gap-4">
      <Card
        title={
          <span className="flex items-center gap-3">
            <span className="font-mono">{data.requestNumber}</span>
            <StatusBadge status={data.status} size="sm" />
            <StatusBadge
              status={data.priority === 'URGENT' ? 'CRITICAL' : 'INFO'}
              label={data.priority}
              size="sm"
            />
          </span>
        }
        subtitle={`Asal: ${data.originId} → Tujuan: ${data.destinationId} · Tanggal: ${formatDate(data.createdAt, 'short')}`}
        headerAction={
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => router.back()}>
            Kembali
          </Button>
        }
        padding="md"
      >
        <DataTable
          data={data.items}
          columns={columns}
          keyExtractor={(it) => it.productId}
          emptyText="Tidak ada item"
        />

        {data.reason && (
          <div className="mt-4 rounded-md border border-warning/30 bg-warning-light/30 p-3 text-xs text-muted">
            <span className="font-semibold text-warning">Alasan: </span>
            {data.reason}
          </div>
        )}

        {!isReadOnly && (canApprove || canIssue) && (
          <div className="mt-4 flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
            {canApprove && (
              <>
                <Button
                  variant="primary"
                  isLoading={working}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={handleApprove}
                >
                  Setujui
                </Button>
                <Button
                  variant="outline"
                  leftIcon={<XCircle className="w-4 h-4" />}
                  onClick={() => setRejectModalOpen(true)}
                >
                  Tolak
                </Button>
              </>
            )}
            {canIssue && (
              <Button
                variant="primary"
                isLoading={working}
                leftIcon={<PackageCheck className="w-4 h-4" />}
                onClick={handleIssue}
              >
                Proses Pengeluaran
              </Button>
            )}
          </div>
        )}
      </Card>

      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Tolak Permintaan"
        description="Berikan alasan penolakan"
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" isLoading={working} onClick={handleReject}>
              Konfirmasi Tolak
            </Button>
          </>
        }
      >
        <Textarea
          id="reject-reason"
          label="Alasan"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Misal: stok tidak tersedia"
        />
      </Modal>
    </div>
  );
}