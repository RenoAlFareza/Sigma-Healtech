'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Building2 } from 'lucide-react';
import { Card, DataTable, Button, Input, Select, Modal, Skeleton, ErrorState, useToast } from '@/shared/ui';
import type { DataTableColumn } from '@/shared/ui';
import { listLocationsApi, createLocationApi } from './api';
import type { Location } from '@/shared/types/domain';

export function LocationsConfig() {
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<Location['type']>('DEPOT');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listLocationsApi();
      setLocations(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat lokasi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const created = await createLocationApi({ name, code, type });
      toast.success(`Lokasi ${created.name} dibuat`, 'Berhasil');
      setModalOpen(false);
      setName('');
      setCode('');
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat lokasi', 'Gagal');
    } finally {
      setSaving(false);
    }
  };

  const columns: DataTableColumn<Location>[] = useMemo(
    () => [
      { id: 'code', header: 'Kode', accessorKey: 'code', isMono: true },
      { id: 'name', header: 'Nama', accessorKey: 'name' },
      { id: 'type', header: 'Tipe', cell: (l) => <span className="font-mono text-xs">{l.type}</span> },
    ],
    []
  );

  if (loading) {
    return (
      <Card title="Manajemen Lokasi" padding="lg">
        <div className="flex flex-col gap-4"><Skeleton variant="rect" height={28} width="40%" count={1} /><Skeleton variant="text" height={16} count={4} /></div>
      </Card>
    );
  }
  if (error) return <ErrorState message={error} onRetry={fetchData} title="Gagal Memuat Lokasi" />;

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Manajemen Lokasi"
        subtitle="Kelola gudang, depo, dan apotek"
        headerAction={
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setModalOpen(true)}>
            Tambah Lokasi
          </Button>
        }
        padding="md"
      >
        <DataTable data={locations} columns={columns} keyExtractor={(l) => l.id} loading={false} emptyText="Tidak ada lokasi" emptyIcon={<Building2 className="w-6 h-6" />} />
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Tambah Lokasi"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button variant="primary" isLoading={saving} onClick={handleCreate}>Simpan</Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Input id="cf-loc-name" label="Nama" value={name} onChange={(e) => setName(e.target.value)} />
          <Input id="cf-loc-code" label="Kode" value={code} onChange={(e) => setCode(e.target.value)} isMono />
          <Select id="cf-loc-type" label="Tipe" value={type} onChange={(e) => setType(e.target.value as Location['type'])} options={['WAREHOUSE', 'DEPOT', 'WARD', 'PHARMACY'].map((t) => ({ value: t, label: t }))} />
        </div>
      </Modal>
    </div>
  );
}