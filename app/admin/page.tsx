"use client";
import { useEffect, useState, useRef } from 'react';
import { db } from '../model/data/access';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  setDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import type { User, Gender, Domain, UnitType, Unit, AgeGroup } from '../model/types';
import { DataService } from '../model/data/access';

const ADMIN_USER_ID = "o5NeITfIMwSQhhyV28HQ";

type FirestoreItem = { id: string; [key: string]: any };

type PromptField = { key: string; label: string; options?: { value: string; label: string }[]; multiple?: boolean };

function useFirestoreCollection(collectionName: string) {
  const [items, setItems] = useState<FirestoreItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchItems() {
    setLoading(true);
    let q;
    if (collectionName === 'users') {
      q = query(collection(db, collectionName)); // No orderBy for users
    } else if (collectionName === 'ageGroups') {
      q = query(collection(db, collectionName), orderBy('lowerBound', 'asc'));
    } else {
      q = query(collection(db, collectionName), orderBy('label', 'asc'));
    }
    try {
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log(`[Firestore] Fetched from ${collectionName}:`, docs);
      setItems(docs);
    } catch (err) {
      console.error(`[Firestore] Error fetching from ${collectionName}:`, err);
      setItems([]);
    }
    setLoading(false);
  }

  useEffect(() => { fetchItems(); }, []);

  async function addItem(data: Record<string, any>) {
    try {
      const result = await addDoc(collection(db, collectionName), data);
      console.log(`[Firestore] Added to ${collectionName}:`, data, 'Result:', result);
      fetchItems();
    } catch (err) {
      console.error(`[Firestore] Error adding to ${collectionName}:`, err);
    }
  }

  async function removeItem(id: string) {
    try {
      await deleteDoc(doc(db, collectionName, id));
      console.log(`[Firestore] Deleted from ${collectionName}:`, id);
      fetchItems();
    } catch (err) {
      console.error(`[Firestore] Error deleting from ${collectionName}:`, err);
    }
  }

  async function editItem(id: string, data: Record<string, any>) {
    try {
      await setDoc(doc(db, collectionName, id), data, { merge: true });
      console.log(`[Firestore] Edited in ${collectionName}:`, id, data);
      fetchItems();
    } catch (err) {
      console.error(`[Firestore] Error editing in ${collectionName}:`, err);
    }
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
      console.log('[DataService] Fetched domains:', data);
      setDomains(data);
    } catch (err) {
      console.error('[DataService] Error fetching domains:', err);
      setDomains([]);
    }
    setLoading(false);
  }

  useEffect(() => { fetchDomains(); }, []);

  async function addDomain(data: Record<string, any>) {
    try {
      const domainData = {
        label: data.label,
        value: data.value
      };
      const result = await DataService.createDomain(domainData);
      console.log('[DataService] Added domain:', result);
      fetchDomains();
    } catch (err) {
      console.error('[DataService] Error adding domain:', err);
    }
  }

  async function removeDomain(id: string) {
    try {
      await DataService.deleteDomain(id);
      console.log('[DataService] Deleted domain:', id);
      fetchDomains();
    } catch (err) {
      console.error('[DataService] Error deleting domain:', err);
    }
  }

  async function editDomain(id: string, data: Record<string, any>) {
    try {
      const domainData = {
        label: data.label,
        value: data.value
      };
      const result = await DataService.updateDomain(id, domainData);
      console.log('[DataService] Updated domain:', result);
      fetchDomains();
    } catch (err) {
      console.error('[DataService] Error updating domain:', err);
    }
  }

  return { 
    items: domains.map(domain => ({ 
      id: domain.id || '', 
      label: domain.label, 
      value: domain.value 
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
      console.log('[DataService] Fetched genders:', data);
      setGenders(data);
    } catch (err) {
      console.error('[DataService] Error fetching genders:', err);
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
      console.log('[DataService] Added gender:', result);
      fetchGenders();
    } catch (err) {
      console.error('[DataService] Error adding gender:', err);
    }
  }

  async function removeGender(id: string) {
    try {
      await DataService.deleteGender(id);
      console.log('[DataService] Deleted gender:', id);
      fetchGenders();
    } catch (err) {
      console.error('[DataService] Error deleting gender:', err);
    }
  }

  async function editGender(id: string, data: Record<string, any>) {
    try {
      const genderData = {
        value: data.value,
        label: data.label
      };
      const result = await DataService.updateGender(id, genderData);
      console.log('[DataService] Updated gender:', result);
      fetchGenders();
    } catch (err) {
      console.error('[DataService] Error updating gender:', err);
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
      console.log('[DataService] Fetched users:', data);
      setUsers(data);
    } catch (err) {
      console.error('[DataService] Error fetching users:', err);
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
      console.log('[DataService] Added user:', result);
      fetchUsers();
    } catch (err) {
      console.error('[DataService] Error adding user:', err);
    }
  }

  async function removeUser(id: string) {
    try {
      await DataService.deleteUser(id);
      console.log('[DataService] Deleted user:', id);
      fetchUsers();
    } catch (err) {
      console.error('[DataService] Error deleting user:', err);
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
      console.log('[DataService] Updated user:', result);
      fetchUsers();
    } catch (err) {
      console.error('[DataService] Error updating user:', err);
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
      console.log('[DataService] Fetched units:', data);
      setUnits(data);
    } catch (err) {
      console.error('[DataService] Error fetching units:', err);
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
      console.log('[DataService] Added unit:', result);
      fetchUnits();
    } catch (err) {
      console.error('[DataService] Error adding unit:', err);
    }
  }

  async function removeUnit(id: string) {
    try {
      await DataService.deleteUnit(id);
      console.log('[DataService] Deleted unit:', id);
      fetchUnits();
    } catch (err) {
      console.error('[DataService] Error deleting unit:', err);
    }
  }

  async function editUnit(id: string, data: Record<string, any>) {
    try {
      const unitData = {
        label: data.label,
        value: data.value
      };
      const result = await DataService.updateUnit(id, unitData);
      console.log('[DataService] Updated unit:', result);
      fetchUnits();
    } catch (err) {
      console.error('[DataService] Error updating unit:', err);
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
      console.log('[DataService] Fetched unitTypes:', data);
      setUnitTypes(data);
    } catch (err) {
      console.error('[DataService] Error fetching unitTypes:', err);
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
      console.log('[DataService] Added unitType:', result);
      fetchUnitTypes();
    } catch (err) {
      console.error('[DataService] Error adding unitType:', err);
    }
  }

  async function removeUnitType(id: string) {
    try {
      await DataService.deleteUnitType(id);
      console.log('[DataService] Deleted unitType:', id);
      fetchUnitTypes();
    } catch (err) {
      console.error('[DataService] Error deleting unitType:', err);
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
      console.log('[DataService] Updated unitType:', result);
      fetchUnitTypes();
    } catch (err) {
      console.error('[DataService] Error updating unitType:', err);
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
      console.log('[DataService] Fetched ageGroups:', data);
      setAgeGroups(data);
    } catch (err) {
      console.error('[DataService] Error fetching ageGroups:', err);
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
      console.log('[DataService] Added ageGroup:', result);
      fetchAgeGroups();
    } catch (err) {
      console.error('[DataService] Error adding ageGroup:', err);
    }
  }

  async function removeAgeGroup(id: string) {
    try {
      await DataService.deleteAgeGroup(id);
      console.log('[DataService] Deleted ageGroup:', id);
      fetchAgeGroups();
    } catch (err) {
      console.error('[DataService] Error deleting ageGroup:', err);
    }
  }

  async function editAgeGroup(id: string, data: Record<string, any>) {
    try {
      const ageGroupData = {
        lowerBound: Number(data.lowerBound),
        upperBound: Number(data.upperBound)
      };
      const result = await DataService.updateAgeGroup(id, ageGroupData);
      console.log('[DataService] Updated ageGroup:', result);
      fetchAgeGroups();
    } catch (err) {
      console.error('[DataService] Error updating ageGroup:', err);
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

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Always call hooks at the top level
  const domains = useDomainDataService();
  const unitTypes = useUnitTypeDataService();
  const units = useUnitDataService();
  const events = useFirestoreCollection('events');
  const users = useUserDataService();
  const genders = useGenderDataService();
  const ageGroups = useAgeGroupDataService();

  useEffect(() => {
    async function fetchUser() {
      try {
        const user = await DataService.getUserById(ADMIN_USER_ID);
        console.log('[DataService] Fetched current user:', user);
        setCurrentUser(user);
      } catch (err) {
        console.error('[DataService] Error fetching current user:', err);
        setCurrentUser(null);
      }
    }
    fetchUser();
  }, []);

  if (currentUser === null) {
    return <div className="text-center mt-20 text-xl">Access denied.</div>;
  }

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