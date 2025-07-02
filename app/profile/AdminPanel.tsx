"use client";
import { useEffect, useState, useRef } from 'react';
import type { User, Gender, Domain, UnitType, Unit, AgeGroup, Event } from '../model/types';
import { DataService } from '../model/data/access';

// --- AddModal and AdminTable components ---

const ADMIN_USER_ID = "o5NeITfIMwSQhhyV28HQ";

type FirestoreItem = { id: string; [key: string]: any };
type PromptField = { key: string; label: string; options?: { value: string; label: string }[]; multiple?: boolean };

function AddModal({ open, onClose, onSubmit, promptFields, initialValues, mode = 'Add' }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => void;
  promptFields: PromptField[];
  initialValues?: Record<string, any>;
  mode?: 'Add' | 'Edit';
}) {
  const [form, setForm] = useState<Record<string, any>>(initialValues || {});
  useEffect(() => { if (open) setForm(initialValues || {}); }, [open, initialValues]);

  // Debug logging
  useEffect(() => {
    if (open) {
      console.log('[AddModal] mode:', mode);
      console.log('[AddModal] promptFields:', promptFields);
      console.log('[AddModal] initialValues:', initialValues);
      console.log('[AddModal] form state:', form);
    }
  }, [open, mode, promptFields, initialValues, form]);

  return open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white p-6 rounded shadow-lg min-w-[300px]">
        <h3 className="text-lg font-bold mb-4">{mode} Entry</h3>
        <form onSubmit={e => { e.preventDefault(); onSubmit(form); onClose(); }} className="flex flex-col gap-3">
          {promptFields.map(field => (
            field.options ? (
              field.multiple ? (
                <select key={field.key} multiple value={form[field.key] || []} onChange={e => { const selected = Array.from(e.target.selectedOptions).map(opt => opt.value); setForm(f => ({ ...f, [field.key]: selected })); }} className="border rounded px-2 py-1" required>
                  {field.options.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                </select>
              ) : (
                <select key={field.key} value={form[field.key] || ''} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} className="border rounded px-2 py-1" required>
                  <option value="" disabled>Select {field.label}</option>
                  {field.options.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                </select>
              )
            ) : (
              <input key={field.key} type={field.key === 'birthday' ? 'date' : (field.key === 'lowerBound' || field.key === 'upperBound' ? 'number' : 'text')} placeholder={field.label} value={form[field.key] || ''} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} className="border rounded px-2 py-1" required />
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
  function renderCell(item: FirestoreItem, field: PromptField) {
    if (field.key === 'units' && Array.isArray(item.units)) {
      return item.units.map((u: any) => u.label || u.value || u).join(', ');
    }
    if (field.key === 'description' && typeof item.description === 'string') {
      return item.description.length > 30 ? item.description.slice(0, 30) + '...' : item.description;
    }
    const value = item[field.key];
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return value.map(v => (typeof v === 'object' && v !== null ? v.label || v.value || JSON.stringify(v) : v)).join(', ');
      }
      return value.label || value.value || JSON.stringify(value);
    }
    return value;
  }

  // Debug logging
  useEffect(() => {
    if (title === 'Domains') {
      console.log('[AdminTable] Domains promptFields:', promptFields);
      console.log('[AdminTable] Domains items:', items);
    }
  }, [title, promptFields, items]);

  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold">{title}</h2>
        <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700" onClick={() => setModalOpen(true)}>Add</button>
      </div>
      <AddModal open={modalOpen || !!editItem} onClose={() => { setModalOpen(false); setEditItem(null); }} onSubmit={async (data) => { if (title === 'Age Groups') { data.lowerBound = Number(data.lowerBound); data.upperBound = Number(data.upperBound); } if (editItem) { await onEdit(editItem.id, data); setEditItem(null); } else { await onAdd(data); } }} promptFields={promptFields} initialValues={editItem || undefined} mode={editItem ? 'Edit' : 'Add'} />
      <table className="min-w-full border border-gray-300 rounded">
        <thead className="bg-gray-100">
          <tr>
            {promptFields.map(f => (<th key={f.key} className="px-4 py-2 border-b text-left">{f.label}</th>))}
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
                {promptFields.map(f => (<td key={f.key} className="px-4 py-2 border-b">{renderCell(item, f)}</td>))}
                <td className="px-4 py-2 border-b" style={{ position: 'relative' }}>
                  <button className="text-xl px-2 hover:bg-gray-200 rounded" onClick={() => setMenuOpenId(menuOpenId === item.id ? null : item.id)} aria-label="Actions">&#8942;</button>
                  {menuOpenId === item.id && (
                    <div ref={el => { menuRefs.current[item.id] = el; }} className="absolute right-0 mt-1 bg-white border rounded shadow z-10 min-w-[80px]">
                      <button className="block w-full text-left px-4 py-2 text-blue-600 hover:bg-gray-100" onClick={() => { setEditItem(item); setMenuOpenId(null); }}>Edit</button>
                      <button className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100" onClick={() => { onDelete(item.id); setMenuOpenId(null); }}>Delete</button>
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

// Custom hook for Domain DataService operations
function useDomainDataService() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  async function fetchDomains() {
    setLoading(true);
    try {
      const data = await DataService.getAllDomains();
      setDomains(data);
    } catch (err) {
      setDomains([]);
    }
    setLoading(false);
  }
  useEffect(() => { fetchDomains(); }, []);
  async function addDomain(data: Record<string, any>) {
    try { await DataService.createDomain({ label: data.label, value: data.value, mobileLabel: data.mobileLabel }); fetchDomains(); } catch {}
  }
  async function removeDomain(id: string) { try { await DataService.deleteDomain(id); fetchDomains(); } catch {} }
  async function editDomain(id: string, data: Record<string, any>) { try { await DataService.updateDomain(id, { label: data.label, value: data.value, mobileLabel: data.mobileLabel }); fetchDomains(); } catch {} }
  return { items: domains.map(item => ({ ...item, id: item.id || item.value || item.label || '' })), loading, addItem: addDomain, removeItem: removeDomain, editItem: editDomain };
}

function useGenderDataService() {
  const [genders, setGenders] = useState<Gender[]>([]);
  const [loading, setLoading] = useState(true);
  async function fetchGenders() {
    setLoading(true);
    try { setGenders(await DataService.getAllGenders()); } catch { setGenders([]); }
    setLoading(false);
  }
  useEffect(() => { fetchGenders(); }, []);
  async function addGender(data: Record<string, any>) { try { await DataService.createGender({ label: data.label, value: data.value }); fetchGenders(); } catch {} }
  async function removeGender(id: string) { try { await DataService.deleteGender(id); fetchGenders(); } catch {} }
  async function editGender(id: string, data: Record<string, any>) { try { await DataService.updateGender(id, { label: data.label, value: data.value }); fetchGenders(); } catch {} }
  return { items: genders.map(item => ({ ...item, id: item.id || item.value || item.label || '' })), loading, addItem: addGender, removeItem: removeGender, editItem: editGender };
}

function useUserDataService() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  async function fetchUsers() {
    setLoading(true);
    try { setUsers(await DataService.getAllUsers()); } catch { setUsers([]); }
    setLoading(false);
  }
  useEffect(() => { fetchUsers(); }, []);
  async function addUser(data: Record<string, any>) {
    try {
      await DataService.createUser({
        email: data.email || '',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        gender: data.gender || '',
        birthday: data.birthday || '',
      });
      fetchUsers();
    } catch {}
  }
  async function removeUser(id: string) { try { await DataService.deleteUser(id); fetchUsers(); } catch {} }
  async function editUser(id: string, data: Record<string, any>) { try { await DataService.updateUser(id, data); fetchUsers(); } catch {} }
  return { items: users.map(item => ({ ...item, id: item.id || item.email || item.firstName || '' })), loading, addItem: addUser, removeItem: removeUser, editItem: editUser };
}

function useUnitDataService() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  async function fetchUnits() {
    setLoading(true);
    try { setUnits(await DataService.getAllUnits()); } catch { setUnits([]); }
    setLoading(false);
  }
  useEffect(() => { fetchUnits(); }, []);
  async function addUnit(data: Record<string, any>) { try { await DataService.createUnit({ label: data.label, value: data.value }); fetchUnits(); } catch {} }
  async function removeUnit(id: string) { try { await DataService.deleteUnit(id); fetchUnits(); } catch {} }
  async function editUnit(id: string, data: Record<string, any>) { try { await DataService.updateUnit(id, { label: data.label, value: data.value }); fetchUnits(); } catch {} }
  return { items: units.map(item => ({ ...item, id: item.id || item.value || item.label || '' })), loading, addItem: addUnit, removeItem: removeUnit, editItem: editUnit };
}

function useUnitTypeDataService() {
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [loading, setLoading] = useState(true);
  async function fetchUnitTypes() {
    setLoading(true);
    try { setUnitTypes(await DataService.getAllUnitTypes()); } catch { setUnitTypes([]); }
    setLoading(false);
  }
  useEffect(() => { fetchUnitTypes(); }, []);
  async function addUnitType(data: Record<string, any>) { try { await DataService.createUnitType({ label: data.label, value: data.value, units: data.units }); fetchUnitTypes(); } catch {} }
  async function removeUnitType(id: string) { try { await DataService.deleteUnitType(id); fetchUnitTypes(); } catch {} }
  async function editUnitType(id: string, data: Record<string, any>) { try { await DataService.updateUnitType(id, { label: data.label, value: data.value, units: data.units }); fetchUnitTypes(); } catch {} }
  return { items: unitTypes.map(item => ({ ...item, id: item.id || item.value || item.label || '' })), loading, addItem: addUnitType, removeItem: removeUnitType, editItem: editUnitType };
}

function useAgeGroupDataService() {
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  async function fetchAgeGroups() {
    setLoading(true);
    try { setAgeGroups(await DataService.getAllAgeGroups()); } catch { setAgeGroups([]); }
    setLoading(false);
  }
  useEffect(() => { fetchAgeGroups(); }, []);
  async function addAgeGroup(data: Record<string, any>) { try { await DataService.createAgeGroup({ lowerBound: Number(data.lowerBound), upperBound: Number(data.upperBound) }); fetchAgeGroups(); } catch {} }
  async function removeAgeGroup(id: string) { try { await DataService.deleteAgeGroup(id); fetchAgeGroups(); } catch {} }
  async function editAgeGroup(id: string, data: Record<string, any>) { try { await DataService.updateAgeGroup(id, { lowerBound: Number(data.lowerBound), upperBound: Number(data.upperBound) }); fetchAgeGroups(); } catch {} }
  return { items: ageGroups.map(item => ({ ...item, id: item.id || `${item.lowerBound}-${item.upperBound}` || '' })), loading, addItem: addAgeGroup, removeItem: removeAgeGroup, editItem: editAgeGroup };
}

function useEventDataService() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  async function fetchEvents() {
    setLoading(true);
    try { setEvents(await DataService.getAllEvents()); } catch { setEvents([]); }
    setLoading(false);
  }
  useEffect(() => { fetchEvents(); }, []);
  async function addEvent(data: Record<string, any>) { try { await DataService.createEvent({ label: data.label, value: data.value, unitType: data.unitType, domain: data.domain, description: data.description }); fetchEvents(); } catch {} }
  async function removeEvent(id: string) { try { await DataService.deleteEvent(id); fetchEvents(); } catch {} }
  async function editEvent(id: string, data: Record<string, any>) { try { await DataService.updateEvent(id, { label: data.label, value: data.value, unitType: data.unitType, domain: data.domain, description: data.description }); fetchEvents(); } catch {} }
  return { items: events.map(event => ({ id: event.id || '', label: event.label, value: event.value, unitType: event.unitType.value, domain: event.domain.value, description: event.description })), loading, addItem: addEvent, removeItem: removeEvent, editItem: editEvent };
}

export default function AdminPanel() {
  const domains = useDomainDataService();
  const unitTypes = useUnitTypeDataService();
  const units = useUnitDataService();
  const events = useEventDataService();
  const users = useUserDataService();
  const genders = useGenderDataService();
  const ageGroups = useAgeGroupDataService();

  // Prepare options for dependency fields
  const domainOptions = domains.items.map(d => ({ value: d.value, label: d.label }));
  const unitTypeOptions = unitTypes.items.map(u => ({ value: u.value, label: u.label }));
  const unitOptions = units.items.map(u => ({ value: u.value, label: u.label }));

  // Responsive: Only show on large screens
  return (
    <>
      <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded shadow text-black">
        <h1 className="text-3xl font-bold mb-8 text-center">Admin Panel</h1>
        <AdminTable
          title="Domains"
          items={domains.items}
          loading={domains.loading}
          onAdd={domains.addItem}
          onDelete={domains.removeItem}
          onEdit={domains.editItem}
          promptFields={[{ key: 'label', label: 'Label' }, { key: 'value', label: 'Value' }, { key: 'mobileLabel', label: 'Mobile Label' }]}
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
          items={events.items.slice().sort((a, b) => (a.domain || '').localeCompare(b.domain || ''))}
          loading={events.loading}
          onAdd={events.addItem}
          onDelete={events.removeItem}
          onEdit={events.editItem}
          promptFields={[
            { key: 'domain', label: 'Domain', options: domainOptions },
            { key: 'label', label: 'Label' },
            { key: 'value', label: 'Value' },
            { key: 'unitType', label: 'Unit', options: unitTypeOptions },
            { key: 'description', label: 'Description' },
          ]}
        />
        <AdminTable
          title="Users"
          items={users.items}
          loading={users.loading}
          onAdd={users.addItem}
          onDelete={users.removeItem}
          onEdit={users.editItem}
          promptFields={[
            { key: 'firstName', label: 'First Name' },
            { key: 'lastName', label: 'Last Name' },
            { key: 'email', label: 'Email' },
            { key: 'gender', label: 'Gender', options: genders.items.map(g => ({ value: g.value, label: g.label })) },
            { key: 'birthday', label: 'Birthday' },
          ]}
        />
        <AdminTable
          title="Genders"
          items={genders.items}
          loading={genders.loading}
          onAdd={genders.addItem}
          onDelete={genders.removeItem}
          onEdit={genders.editItem}
          promptFields={[
            { key: 'label', label: 'Label' },
            { key: 'value', label: 'Value' },
          ]}
        />
        <AdminTable
          title="Age Groups"
          items={ageGroups.items}
          loading={ageGroups.loading}
          onAdd={ageGroups.addItem}
          onDelete={ageGroups.removeItem}
          onEdit={ageGroups.editItem}
          promptFields={[
            { key: 'lowerBound', label: 'Lower Bound' },
            { key: 'upperBound', label: 'Upper Bound' },
          ]}
        />
      </div>
    </>
  );
} 