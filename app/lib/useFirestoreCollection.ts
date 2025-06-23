import { useEffect, useState } from 'react';
import { db } from '../model/data/access/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export function useFirestoreCollection<T = any>(
  collectionName: string,
  orderField?: string
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      let q;
      if (orderField) {
        q = query(collection(db, collectionName), orderBy(orderField, 'asc'));
      } else {
        q = query(collection(db, collectionName));
      }
      try {
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
        setItems(docs);
        console.log(`[useFirestoreCollection] Fetched from ${collectionName} (order by ${orderField || 'none'}):`, docs);
      } catch (err) {
        setItems([]);
        console.error(`[useFirestoreCollection] Error fetching from ${collectionName}:`, err);
      }
      setLoading(false);
    }
    fetchItems();
  }, [collectionName, orderField]);

  return { items, loading };
} 