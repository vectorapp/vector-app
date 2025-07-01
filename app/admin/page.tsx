"use client";
import { useEffect, useState, useRef } from 'react';
import type { User, Gender, Domain, UnitType, Unit, AgeGroup, Event } from '../model/types';
import { DataService } from '../model/data/access';
import { useUser } from '../model/auth/UserContext';
import { useRouter } from 'next/navigation';

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
  // Ensure all promptFields are present in form state
  function getInitialForm() {
    const form: Record<string, any> = {};
    promptFields.forEach(field => {
      form[field.key] = (initialValues && initialValues[field.key] !== undefined) ? initialValues[field.key] : '';
    });
    return form;
  }
  const [form, setForm] = useState<Record<string, any>>(getInitialForm());

  useEffect(() => {
    if (open) setForm(getInitialForm());
  }, [open, initialValues, promptFields]);

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
                type={field.key === 'birthday' ? 'date' :
                  (field.key === 'lowerBound' || field.key === 'upperBound' ? 'number' : 'text')}
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
          if (title === 'Age Groups') {
            data.lowerBound = Number(data.lowerBound);
            data.upperBound = Number(data.upperBound);
          }
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
    try {
      const domainData = {
        label: data.label,
        value: data.value,
        mobileLabel: data.mobileLabel || '',
      };
      const result = await DataService.createDomain(domainData);
      fetchDomains();
    } catch (err) {
    }
  }

  async function removeDomain(id: string) {
    try {
      await DataService.deleteDomain(id);
      fetchDomains();
    } catch (err) {
    }
  }

  async function editDomain(id: string, data: Record<string, any>) {
    try {
      const domainData = {
        label: data.label,
        value: data.value,
        mobileLabel: data.mobileLabel || '',
      };
      const result = await DataService.updateDomain(id, domainData);
      fetchDomains();
    } catch (err) {
    }
  }

  return { 
    items: domains.map(domain => ({ 
      id: domain.id || '', 
      label: domain.label, 
      value: domain.value, 
      mobileLabel: domain.mobileLabel || '',
    })), 
    loading, 
    addItem: addDomain, 
    removeItem: removeDomain, 
    editItem: editDomain 
  };
}

// Custom hook for Gender DataService operations
function useGenderDataService() {
  const [genders, setGenders] = useState<Gender[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchGenders() {
    setLoading(true);
    try {
      const data = await DataService.getAllGenders();
      setGenders(data);
    } catch (err) {
      setGenders([]);
    }
    setLoading(false);
  }

  useEffect(() => { fetchGenders(); }, []);

  async function addGender(data: Record<string, any>) {
    try {
      const genderData = {
        value: data.value,
        label: data.label
      };
      const result = await DataService.createGender(genderData);
      fetchGenders();
    } catch (err) {
    }
  }

  async function removeGender(id: string) {
    try {
      await DataService.deleteGender(id);
      fetchGenders();
    } catch (err) {
    }
  }

  async function editGender(id: string, data: Record<string, any>) {
    try {
      const genderData = {
        value: data.value,
        label: data.label
      };
      const result = await DataService.updateGender(id, genderData);
      fetchGenders();
    } catch (err) {
    }
  }

  return { 
    items: genders.map(gender => ({ 
      id: gender.id || '', 
      value: gender.value, 
      label: gender.label 
    })), 
    loading, 
    addItem: addGender, 
    removeItem: removeGender, 
    editItem: editGender 
  };
}

// Custom hook for User DataService operations
function useUserDataService() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchUsers() {
    setLoading(true);
    try {
      const data = await DataService.getAllUsers();
      setUsers(data);
    } catch (err) {
      setUsers([]);
    }
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []);

  async function addUser(data: Record<string, any>) {
    try {
      // Convert form data to User format
      const userData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        gender: { value: data.gender, label: data.gender }, // Simplified for now
        birthday: data.birthday
      };
      const result = await DataService.createUser(userData);
      fetchUsers();
    } catch (err) {
    }
  }

  async function removeUser(id: string) {
    try {
      await DataService.deleteUser(id);
      fetchUsers();
    } catch (err) {
    }
  }

  async function editUser(id: string, data: Record<string, any>) {
    try {
      // Convert form data to User format
      const userData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        gender: { value: data.gender, label: data.gender }, // Simplified for now
        birthday: data.birthday
      };
      const result = await DataService.updateUser(id, userData);
      fetchUsers();
    } catch (err) {
    }
  }

  return { 
    items: users.map(user => ({ 
      id: user.id || '', 
      firstName: user.firstName, 
      lastName: user.lastName, 
      email: user.email, 
      gender: user.gender?.value, 
      birthday: user.birthday 
    })), 
    loading, 
    addItem: addUser, 
    removeItem: removeUser, 
    editItem: editUser 
  };
}

// Custom hook for Unit DataService operations
function useUnitDataService() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchUnits() {
    setLoading(true);
    try {
      const data = await DataService.getAllUnits();
      setUnits(data);
    } catch (err) {
      setUnits([]);
    }
    setLoading(false);
  }

  useEffect(() => { fetchUnits(); }, []);

  async function addUnit(data: Record<string, any>) {
    try {
      const unitData = {
        label: data.label,
        value: data.value
      };
      const result = await DataService.createUnit(unitData);
      fetchUnits();
    } catch (err) {
    }
  }

  async function removeUnit(id: string) {
    try {
      await DataService.deleteUnit(id);
      fetchUnits();
    } catch (err) {
    }
  }

  async function editUnit(id: string, data: Record<string, any>) {
    try {
      const unitData = {
        label: data.label,
        value: data.value
      };
      const result = await DataService.updateUnit(id, unitData);
      fetchUnits();
    } catch (err) {
    }
  }

  return { 
    items: units.map(unit => ({ 
      id: unit.id || '', 
      label: unit.label, 
      value: unit.value 
    })), 
    loading, 
    addItem: addUnit, 
    removeItem: removeUnit, 
    editItem: editUnit 
  };
}

// Custom hook for UnitType DataService operations
function useUnitTypeDataService() {
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchUnitTypes() {
    setLoading(true);
    try {
      const data = await DataService.getAllUnitTypes();
      setUnitTypes(data);
    } catch (err) {
      setUnitTypes([]);
    }
    setLoading(false);
  }

  useEffect(() => { fetchUnitTypes(); }, []);

  async function addUnitType(data: Record<string, any>) {
    try {
      const unitTypeData = {
        label: data.label,
        value: data.value,
        units: Array.isArray(data.units) ? data.units.map((unitValue: string) => ({
          value: unitValue,
          label: unitValue // We'll need to fetch the actual label if needed
        })) : []
      };
      const result = await DataService.createUnitType(unitTypeData);
      fetchUnitTypes();
    } catch (err) {
    }
  }

  async function removeUnitType(id: string) {
    try {
      await DataService.deleteUnitType(id);
      fetchUnitTypes();
    } catch (err) {
    }
  }

  async function editUnitType(id: string, data: Record<string, any>) {
    try {
      const unitTypeData = {
        label: data.label,
        value: data.value,
        units: Array.isArray(data.units) ? data.units.map((unitValue: string) => ({
          value: unitValue,
          label: unitValue // We'll need to fetch the actual label if needed
        })) : []
      };
      const result = await DataService.updateUnitType(id, unitTypeData);
      fetchUnitTypes();
    } catch (err) {
    }
  }

  return { 
    items: unitTypes.map(unitType => ({ 
      id: unitType.id || '', 
      label: unitType.label, 
      value: unitType.value,
      units: unitType.units
    })), 
    loading, 
    addItem: addUnitType, 
    removeItem: removeUnitType, 
    editItem: editUnitType 
  };
}

// Custom hook for AgeGroup DataService operations
function useAgeGroupDataService() {
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchAgeGroups() {
    setLoading(true);
    try {
      const data = await DataService.getAllAgeGroups();
      setAgeGroups(data);
    } catch (err) {
      setAgeGroups([]);
    }
    setLoading(false);
  }

  useEffect(() => { fetchAgeGroups(); }, []);

  async function addAgeGroup(data: Record<string, any>) {
    try {
      const ageGroupData = {
        lowerBound: Number(data.lowerBound),
        upperBound: Number(data.upperBound)
      };
      const result = await DataService.createAgeGroup(ageGroupData);
      fetchAgeGroups();
    } catch (err) {
    }
  }

  async function removeAgeGroup(id: string) {
    try {
      await DataService.deleteAgeGroup(id);
      fetchAgeGroups();
    } catch (err) {
    }
  }

  async function editAgeGroup(id: string, data: Record<string, any>) {
    try {
      const ageGroupData = {
        lowerBound: Number(data.lowerBound),
        upperBound: Number(data.upperBound)
      };
      const result = await DataService.updateAgeGroup(id, ageGroupData);
      fetchAgeGroups();
    } catch (err) {
    }
  }

  return { 
    items: ageGroups.map(ageGroup => ({ 
      id: ageGroup.id || '', 
      lowerBound: ageGroup.lowerBound, 
      upperBound: ageGroup.upperBound 
    })), 
    loading, 
    addItem: addAgeGroup, 
    removeItem: removeAgeGroup, 
    editItem: editAgeGroup 
  };
}

// Custom hook for Event DataService operations
function useEventDataService() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchEvents() {
    setLoading(true);
    try {
      const data = await DataService.getAllEvents();
      setEvents(data);
    } catch (err) {
      setEvents([]);
    }
    setLoading(false);
  }

  useEffect(() => { fetchEvents(); }, []);

  async function addEvent(data: Record<string, any>) {
    try {
      const eventData = {
        label: data.label,
        value: data.value,
        unitType: data.unitType,
        domain: data.domain,
        description: data.description
      };
      const result = await DataService.createEvent(eventData);
      fetchEvents();
    } catch (err) {
    }
  }

  async function removeEvent(id: string) {
    try {
      await DataService.deleteEvent(id);
      fetchEvents();
    } catch (err) {
    }
  }

  async function editEvent(id: string, data: Record<string, any>) {
    try {
      const eventData = {
        label: data.label,
        value: data.value,
        unitType: data.unitType,
        domain: data.domain,
        description: data.description
      };
      const result = await DataService.updateEvent(id, eventData);
      fetchEvents();
    } catch (err) {
    }
  }

  return { 
    items: events.map(event => ({ 
      id: event.id || '', 
      label: event.label, 
      value: event.value,
      unitType: event.unitType.value,
      domain: event.domain.value,
      description: event.description
    })), 
    loading, 
    addItem: addEvent, 
    removeItem: removeEvent, 
    editItem: editEvent 
  };
}

export default function AdminPage() {
  const { user, firebaseUser, loading: userLoading } = useUser();
  const router = useRouter();

  // Always call hooks at the top level
  const domains = useDomainDataService();
  const unitTypes = useUnitTypeDataService();
  const units = useUnitDataService();
  const events = useEventDataService();
  const users = useUserDataService();
  const genders = useGenderDataService();
  const ageGroups = useAgeGroupDataService();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  // Check if user is admin based on Firebase UID
  const isAdmin = firebaseUser?.uid === 'LnkelipubdcqpTrPJhWVCMyzVzg2';

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  // Prepare options for dependency fields
  const domainOptions = domains.items.map(d => ({ value: d.value, label: d.label }));
  const unitTypeOptions = unitTypes.items.map(u => ({ value: u.value, label: u.label }));
  const unitOptions = units.items.map(u => ({ value: u.value, label: u.label }));

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded shadow text-black">
      <h1 className="text-3xl font-bold mb-8 text-center">Admin Panel</h1>
      <div className="text-sm text-gray-600 mb-6 text-center">
        Welcome, {user.firstName || user.email}!
      </div>
      <AdminTable
        title="Domains"
        items={domains.items}
        loading={domains.loading}
        onAdd={domains.addItem}
        onDelete={domains.removeItem}
        onEdit={domains.editItem}
        promptFields={[
          { key: 'label', label: 'Label' },
          { key: 'value', label: 'Value' },
          { key: 'mobileLabel', label: 'Mobile Label' },
        ]}
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
  );
} 