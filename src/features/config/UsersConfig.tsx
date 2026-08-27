'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, UserPlus } from 'lucide-react';
import { Card, DataTable, Button, Input, Select, Checkbox, Modal, StatusBadge, Skeleton, ErrorState, useToast } from '@/shared/ui';
import type { DataTableColumn } from '@/shared/ui';
import { listUsers, createUserApi, updateUserApi } from './api';
import { listLocationsApi } from './api';
import type { Location, Role, User } from '@/shared/types/domain';

const ROLES: Role[] = ['ADMIN', 'MANAGER', 'ASSISTANT', 'PHARMACIST', 'REQUESTOR', 'BUYER', 'VIEWER'];

interface UserFormState {
  username: string;
  name: string;
  role: Role;
  defaultLocationId: string;
  locationIds: string[];
  active: boolean;
}

const emptyForm = (defaultLoc?: string): UserFormState => ({
  username: '',
  name: '',
  role: 'REQUESTOR',
  defaultLocationId: defaultLoc ?? '',
  locationIds: [],
  active: true,
});

export function UsersConfig() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [u, l] = await Promise.all([listUsers(), listLocationsApi()]);
      setUsers(u);
      setLocations(l);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(locations[0]?.id));
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setForm({
      username: user.username,
      name: user.name,
      role: user.role,
      defaultLocationId: user.defaultLocationId,
      locationIds: [...user.locationIds],
      active: user.active,
    });
    setModalOpen(true);
  };

  const toggleLocation = (locId: string) =>
    setForm((prev) => ({
      ...prev,
      locationIds: prev.locationIds.includes(locId) ? prev.locationIds.filter((l) => l !== locId) : [...prev.locationIds, locId],
    }));

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        const updated = await updateUserApi(editing.id, {
          name: form.name,
          role: form.role,
          defaultLocationId: form.defaultLocationId,
          locationIds: form.locationIds,
          active: form.active,
        });
        toast.success(`User ${updated.name} diperbarui`, 'Berhasil');
      } else {
        const created = await createUserApi(form);
        toast.success(`User ${created.name} dibuat`, 'Berhasil');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan user', 'Gagal');
    } finally {
      setSaving(false);
    }
  };

  const columns: DataTableColumn<User>[] = useMemo(
    () => [
      { id: 'username', header: 'Username', accessorKey: 'username', isMono: true },
      { id: 'name', header: 'Nama', accessorKey: 'name' },
      { id: 'role', header: 'Role', cell: (u) => <StatusBadge status="INFO" label={u.role} size="sm" /> },
      { id: 'defaultLocationId', header: 'Lokasi Default', accessorKey: 'defaultLocationId', isMono: true },
      { id: 'active', header: 'Aktif', cell: (u) => (u.active ? 'Ya' : 'Tidak') },
    ],
    []
  );

  if (loading) {
    return (
      <Card title="Manajemen User" padding="lg">
        <div className="flex flex-col gap-4"><Skeleton variant="rect" height={28} width="40%" count={1} /><Skeleton variant="text" height={16} count={5} /></div>
      </Card>
    );
  }
  if (error) return <ErrorState message={error} onRetry={fetchData} title="Gagal Memuat User" />;

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Manajemen User"
        subtitle="Kelola akun pengguna dan role"
        headerAction={
          <Button variant="primary" size="sm" leftIcon={<UserPlus className="w-4 h-4" />} onClick={openCreate}>
            Tambah User
          </Button>
        }
        padding="md"
      >
        <DataTable data={users} columns={columns} keyExtractor={(u) => u.id} loading={false} emptyText="Tidak ada user" onRowClick={openEdit} />
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit User ${editing.username}` : 'Tambah User'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button variant="primary" isLoading={saving} onClick={handleSave}>Simpan</Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Input id="cf-username" label="Username" value={form.username} disabled={!!editing} readOnly={!!editing} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <Input id="cf-name" label="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select id="cf-role" label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} options={ROLES.map((r) => ({ value: r, label: r }))} />
          <Select id="cf-default" label="Lokasi Default" value={form.defaultLocationId} onChange={(e) => setForm({ ...form, defaultLocationId: e.target.value })} options={locations.map((l) => ({ value: l.id, label: `${l.name} (${l.code})` }))} />
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-text-main">Lokasi Akses</span>
            {locations.map((l) => (
              <Checkbox key={l.id} id={`cf-loc-${l.id}`} label={`${l.name} (${l.code})`} checked={form.locationIds.includes(l.id)} onChange={() => toggleLocation(l.id)} />
            ))}
          </div>
          <Checkbox id="cf-active" label="Aktif" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
        </div>
      </Modal>
    </div>
  );
}