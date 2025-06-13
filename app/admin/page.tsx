"use client";
import { useEffect, useState, useRef } from 'react';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  setDoc,
} from 'firebase/firestore';

const userId = 'nlayton'; // Hardcoded admin

type FirestoreItem = { id: string; [key: string]: any };

type PromptField = { key: string; label: string; options?: { value: string; label: string }[]; multiple?: boolean };

function useFirestoreCollection(collectionName: string) {
  const [items, setItems] = useState<FirestoreItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchItems() {
    setLoading(true);
    const q = query(collection(db, collectionName), orderBy('label', 'asc'));
    const snapshot = await getDocs(q);
    setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  }

  useEffect(() => { fetchItems(); }, []);

  async function addItem(data: Record<string, any>) {
    await addDoc(collection(db, collectionName), data);
    fetchItems();
  }

  async function removeItem(id: string) {
    await deleteDoc(doc(db, collectionName, id));
    fetchItems();
  }

  async function editItem(id: string, data: Record<string, any>) {
    await setDoc(doc(db, collectionName, id), data, { merge: true });
    fetchItems();
  }

  return { items, loading, addItem, removeItem, editItem };
}

function AddModal({ open, onClose, onSubmit, promptFields, initialValues, mode = 'Add' }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => void;
  promptFields: PromptField[];
  initialValues?: Record<string, any>;
  mode?: 'Add' | 'Edit';
}) {
  const [form, setForm] = useState<Record<string, any>>(initialValues || {});

  useEffect(() => {
    if (open) setForm(initialValues || {});
  }, [open, initialValues]);

  return open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white p-6 rounded shadow-lg min-w-[300px]">
        <h3 className="text-lg font-bold mb-4">{mode} Entry</h3>
        <form
          onSubmit={e => {
            e.preventDefault();
            onSubmit(form);
            onClose();
          }}
          className="flex flex-col gap-3"
        >
          {promptFields.map(field => (
            field.options ? (
              field.multiple ? (
                <select
                  key={field.key}
                  multiple
                  value={form[field.key] || []}
                  onChange={e => {
                    const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                    setForm(f => ({ ...f, [field.key]: selected }));
                  }}
                  className="border rounded px-2 py-1"
                  required
                >
                  {field.options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <select
                  key={field.key}
                  value={form[field.key] || ''}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  className="border rounded px-2 py-1"
                  required
                >
                  <option value="" disabled>Select {field.label}</option>
                  {field.options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )
            ) : (
              <input
                key={field.key}
                type="text"
                placeholder={field.label}
                value={form[field.key] || ''}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                className="border rounded px-2 py-1"
                required
              />
            )
          ))}
          <div className="flex gap-2 mt-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700">{mode}</button>
            <button type="button" className="bg-gray-200 px-4 py-1 rounded hover:bg-gray-300" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  ) : null;
}

function AdminTable({ title, items, loading, onAdd, onDelete, onEdit, promptFields }: {
  title: string;
  items: FirestoreItem[];
  loading: boolean;
  onAdd: (data: Record<string, any>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (id: string, data: Record<string, any>) => Promise<void>;
  promptFields: PromptField[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<FirestoreItem | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuOpenId && menuRefs.current[menuOpenId]) {
        if (!menuRefs.current[menuOpenId]?.contains(e.target as Node)) {
          setMenuOpenId(null);
        }
      }
    }
    if (menuOpenId) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [menuOpenId]);

  // Helper to render units as comma-separated labels if present
  function renderCell(item: FirestoreItem, field: PromptField) {
    if (field.key === 'units' && Array.isArray(item.units)) {
      return item.units.map((u: any) => u.label || u.value || u).join(', ');
    }
    if (field.key === 'description' && typeof item.description === 'string') {
      return item.description.length > 30
        ? item.description.slice(0, 30) + '...'
        : item.description;
    }
    return item[field.key];
  }

  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold">{title}</h2>
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          onClick={() => setModalOpen(true)}
        >
          Add
        </button>
      </div>
      <AddModal
        open={modalOpen || !!editItem}
        onClose={() => { setModalOpen(false); setEditItem(null); }}
        onSubmit={async (data) => {
          if (editItem) {
            await onEdit(editItem.id, data);
            setEditItem(null);
          } else {
            await onAdd(data);
          }
        }}
        promptFields={promptFields}
        initialValues={editItem || undefined}
        mode={editItem ? 'Edit' : 'Add'}
      />
      <table className="min-w-full border border-gray-300 rounded">
        <thead className="bg-gray-100">
          <tr>
            {promptFields.map(f => (
              <th key={f.key} className="px-4 py-2 border-b text-left">{f.label}</th>
            ))}
            <th className="px-4 py-2 border-b text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={promptFields.length + 1}>Loading...</td></tr>
          ) : items.length === 0 ? (
            <tr><td colSpan={promptFields.length + 1}>No entries</td></tr>
          ) : (
            items.map(item => (
              <tr key={item.id}>
                {promptFields.map(f => (
                  <td key={f.key} className="px-4 py-2 border-b">{renderCell(item, f)}</td>
                ))}
                <td className="px-4 py-2 border-b" style={{ position: 'relative' }}>
                  <button
                    className="text-xl px-2 hover:bg-gray-200 rounded"
                    onClick={() => setMenuOpenId(menuOpenId === item.id ? null : item.id)}
                    aria-label="Actions"
                  >
                    &#8942;
                  </button>
                  {menuOpenId === item.id && (
                    <div
                      ref={el => { menuRefs.current[item.id] = el; }}
                      className="absolute right-0 mt-1 bg-white border rounded shadow z-10 min-w-[80px]"
                    >
                      <button
                        className="block w-full text-left px-4 py-2 text-blue-600 hover:bg-gray-100"
                        onClick={() => { setEditItem(item); setMenuOpenId(null); }}
                      >
                        Edit
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                        onClick={() => { onDelete(item.id); setMenuOpenId(null); }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminPage() {
  if (userId !== 'nlayton') {
    return <div className="text-center mt-20 text-xl">Access denied.</div>;
  }

  const domains = useFirestoreCollection('domains');
  const unitTypes = useFirestoreCollection('unitTypes');
  const units = useFirestoreCollection('units');
  const events = useFirestoreCollection('events');

  // Prepare options for dependency fields
  const domainOptions = domains.items.map(d => ({ value: d.value, label: d.label }));
  const unitTypeOptions = unitTypes.items.map(u => ({ value: u.value, label: u.label }));
  const unitOptions = units.items.map(u => ({ value: u.value, label: u.label }));

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded shadow text-black">
      <h1 className="text-3xl font-bold mb-8 text-center">Admin Panel</h1>
      <AdminTable
        title="Domains"
        items={domains.items}
        loading={domains.loading}
        onAdd={domains.addItem}
        onDelete={domains.removeItem}
        onEdit={domains.editItem}
        promptFields={[{ key: 'label', label: 'Label' }, { key: 'value', label: 'Value' }]}
      />
      <AdminTable
        title="Units"
        items={units.items}
        loading={units.loading}
        onAdd={units.addItem}
        onDelete={units.removeItem}
        onEdit={units.editItem}
        promptFields={[{ key: 'label', label: 'Label' }, { key: 'value', label: 'Value' }]}
      />
      <AdminTable
        title="Unit Types"
        items={unitTypes.items}
        loading={unitTypes.loading}
        onAdd={unitTypes.addItem}
        onDelete={unitTypes.removeItem}
        onEdit={unitTypes.editItem}
        promptFields={[
          { key: 'label', label: 'Label' },
          { key: 'value', label: 'Value' },
          { key: 'units', label: 'Units', options: unitOptions, multiple: true },
        ]}
      />
      <AdminTable
        title="Events"
        items={events.items}
        loading={events.loading}
        onAdd={events.addItem}
        onDelete={events.removeItem}
        onEdit={events.editItem}
        promptFields={[
          { key: 'label', label: 'Label' },
          { key: 'value', label: 'Value' },
          { key: 'unitType', label: 'Unit Type', options: unitTypeOptions },
          { key: 'domain', label: 'Domain', options: domainOptions },
          { key: 'description', label: 'Description' },
        ]}
      />
    </div>
  );
} 