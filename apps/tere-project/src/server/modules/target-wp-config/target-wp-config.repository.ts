import { firestore } from '@server/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export type TargetWpRates = Record<string, number>;

export interface TargetWpConfig {
  id?: string;
  effective_date: string;
  rates: TargetWpRates;
}

const COLLECTION = 'target_wp_config';

const DEFAULT_RATES: TargetWpRates = {
  junior: 4.5,
  medior: 6,
  senior: 8,
  'individual contributor': 8,
};

function toDateString(value: unknown): string {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: unknown }).toDate === 'function') {
    const date = (value as FirebaseFirestore.Timestamp).toDate();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  return value as string;
}

function parseToTimestamp(dateStr: string): Timestamp {
  const [year, month, day] = dateStr.split('-').map(Number);
  return Timestamp.fromDate(new Date(year, month - 1, day));
}

function docToConfig(doc: FirebaseFirestore.QueryDocumentSnapshot): TargetWpConfig {
  const data = doc.data();
  return {
    id: doc.id,
    effective_date: toDateString(data.effective_date),
    rates: data.rates as TargetWpRates,
  };
}

export class TargetWpConfigRepository {
  async fetchAll(): Promise<TargetWpConfig[]> {
    try {
      const snapshot = await firestore
        .collection(COLLECTION)
        .orderBy('effective_date', 'desc')
        .get();
      return snapshot.docs.map(docToConfig);
    } catch {
      return [];
    }
  }

  async getEffectiveRates(sprintStartDate: string): Promise<TargetWpRates> {
    try {
      const all = await this.fetchAll();
      const match = all
        .filter(c => c.effective_date <= sprintStartDate)
        .sort((a, b) => b.effective_date.localeCompare(a.effective_date))[0];
      return match?.rates ?? DEFAULT_RATES;
    } catch {
      return DEFAULT_RATES;
    }
  }

  async create(effective_date: string, rates: TargetWpRates): Promise<TargetWpConfig> {
    const timestamp = parseToTimestamp(effective_date);
    const ref = await firestore.collection(COLLECTION).add({ effective_date: timestamp, rates });
    return { id: ref.id, effective_date, rates };
  }

  async delete(id: string): Promise<void> {
    await firestore.collection(COLLECTION).doc(id).delete();
  }
}
