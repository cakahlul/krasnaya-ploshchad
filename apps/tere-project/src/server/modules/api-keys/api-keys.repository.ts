import { firestore } from '@server/lib/firebase-admin';
import type { ApiKeyEntity } from '@shared/types/api-key.types';

const COLLECTION = 'api_keys';

function toDate(field: any): Date {
  if (field === undefined || field === null) throw new Error('Missing required date field');
  if (typeof field.toDate === 'function') return field.toDate();
  if (field._seconds !== undefined) return new Date(field._seconds * 1000);
  if (typeof field === 'object' && field.seconds !== undefined) return new Date(field.seconds * 1000);
  const date = new Date(field);
  if (isNaN(date.getTime())) throw new Error(`Invalid date format: ${JSON.stringify(field)}`);
  return date;
}

function toDateOrNull(field: any): Date | null {
  if (field === undefined || field === null) return null;
  return toDate(field);
}

function mapDocToEntity(id: string, data: FirebaseFirestore.DocumentData): ApiKeyEntity {
  return {
    id,
    name: data.name,
    hashedKey: data.hashedKey,
    createdBy: data.createdBy,
    createdAt: toDate(data.createdAt),
    lastUsedAt: toDateOrNull(data.lastUsedAt),
    isActive: data.isActive ?? true,
  };
}

export class ApiKeysRepository {
  async create(data: Omit<ApiKeyEntity, 'id'>): Promise<ApiKeyEntity> {
    const docRef = await firestore.collection(COLLECTION).add(data);
    const doc = await docRef.get();
    const docData = doc.data();
    if (!docData) throw new Error('Failed to retrieve created API key document');
    return mapDocToEntity(doc.id, docData);
  }

  async findAll(): Promise<ApiKeyEntity[]> {
    const snapshot = await firestore.collection(COLLECTION).orderBy('createdAt', 'desc').get();
    return snapshot.docs.map((doc) => mapDocToEntity(doc.id, doc.data()));
  }

  async findById(id: string): Promise<ApiKeyEntity | null> {
    const doc = await firestore.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (!data) return null;
    return mapDocToEntity(doc.id, data);
  }

  async findByEmail(email: string): Promise<ApiKeyEntity[]> {
    const snapshot = await firestore
      .collection(COLLECTION)
      .where('createdBy', '==', email)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map((doc) => mapDocToEntity(doc.id, doc.data()));
  }

  async findByHashedKey(hashedKey: string): Promise<ApiKeyEntity | null> {
    const snapshot = await firestore
      .collection(COLLECTION)
      .where('hashedKey', '==', hashedKey)
      .where('isActive', '==', true)
      .limit(1)
      .get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return mapDocToEntity(doc.id, doc.data());
  }

  async update(id: string, data: Partial<ApiKeyEntity>): Promise<void> {
    await firestore.collection(COLLECTION).doc(id).update(data as any);
  }

  async delete(id: string): Promise<void> {
    await firestore.collection(COLLECTION).doc(id).delete();
  }
}

export const apiKeysRepository = new ApiKeysRepository();
