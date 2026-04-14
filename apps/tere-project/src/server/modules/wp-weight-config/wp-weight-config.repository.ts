import { firestore } from '@server/lib/firebase-admin';
import type { AppendixWeightPoint } from '@shared/utils/appendix-level';

export type WpWeights = Record<AppendixWeightPoint, number>;

export interface WpWeightConfig {
  id?: string;
  effective_date: string;
  weights: WpWeights;
}

const COLLECTION = 'wp_weight_config';

const DEFAULT_WEIGHTS: WpWeights = {
  'Very Low': 1,
  'Low': 2,
  'Medium': 4,
  'High': 8,
};

function docToConfig(doc: FirebaseFirestore.QueryDocumentSnapshot): WpWeightConfig {
  const data = doc.data();
  return {
    id: doc.id,
    effective_date: data.effective_date as string,
    weights: data.weights as WpWeights,
  };
}

export class WpWeightConfigRepository {
  async fetchAll(): Promise<WpWeightConfig[]> {
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

  async getEffectiveWeights(sprintStartDate: string): Promise<WpWeights> {
    try {
      const snapshot = await firestore
        .collection(COLLECTION)
        .where('effective_date', '<=', sprintStartDate)
        .orderBy('effective_date', 'desc')
        .limit(1)
        .get();
      if (snapshot.empty) return DEFAULT_WEIGHTS;
      return docToConfig(snapshot.docs[0]).weights;
    } catch {
      return DEFAULT_WEIGHTS;
    }
  }

  async create(effective_date: string, weights: WpWeights): Promise<WpWeightConfig> {
    const ref = await firestore.collection(COLLECTION).add({ effective_date, weights });
    return { id: ref.id, effective_date, weights };
  }

  async delete(id: string): Promise<void> {
    await firestore.collection(COLLECTION).doc(id).delete();
  }
}
