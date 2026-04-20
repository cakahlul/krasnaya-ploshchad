import { firestore } from '@server/lib/firebase-admin';
import type { MemberEntity } from '@shared/types/member.types';
import { Level } from '@shared/types/common.types';

const COLLECTION = 'members';

function toDate(field: any): Date {
  if (field === undefined || field === null) throw new Error('Missing required date field');
  if (typeof field.toDate === 'function') return field.toDate();
  if (field._seconds !== undefined) return new Date(field._seconds * 1000);
  if (typeof field === 'object' && field.seconds !== undefined) return new Date(field.seconds * 1000);
  const date = new Date(field);
  if (isNaN(date.getTime())) throw new Error(`Invalid date format: ${JSON.stringify(field)}`);
  return date;
}

function mapDocToEntity(id: string, data: FirebaseFirestore.DocumentData): MemberEntity {
  return {
    id,
    name: data.name,
    fullName: data.fullName,
    email: data.email,
    level: data.level as Level,
    teams: data.teams ?? [],
    isLead: data.isLead ?? false,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export class MembersRepository {
  async create(data: MemberEntity): Promise<MemberEntity> {
    const docRef = await firestore.collection(COLLECTION).add(data);
    const doc = await docRef.get();
    const docData = doc.data();
    if (!docData) throw new Error('Failed to retrieve created member document');
    return mapDocToEntity(doc.id, docData);
  }

  async createWithId(id: string, data: MemberEntity): Promise<MemberEntity> {
    const docRef = firestore.collection(COLLECTION).doc(id);
    await docRef.set(data);
    const doc = await docRef.get();
    const docData = doc.data();
    if (!docData) throw new Error('Failed to retrieve created member document');
    return mapDocToEntity(doc.id, docData);
  }

  async findAll(): Promise<MemberEntity[]> {
    const snapshot = await firestore.collection(COLLECTION).orderBy('name').get();
    return snapshot.docs.map((doc) => mapDocToEntity(doc.id, doc.data()));
  }

  async findById(id: string): Promise<MemberEntity | null> {
    const doc = await firestore.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (!data) return null;
    return mapDocToEntity(doc.id, data);
  }

  async findByEmail(email: string): Promise<MemberEntity | null> {
    const snapshot = await firestore.collection(COLLECTION).where('email', '==', email).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return mapDocToEntity(doc.id, doc.data());
  }

  async update(id: string, data: Partial<MemberEntity>): Promise<MemberEntity | null> {
    const docRef = firestore.collection(COLLECTION).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return null;
    await docRef.update(data as any);
    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data();
    if (!updatedData) return null;
    return mapDocToEntity(updatedDoc.id, updatedData);
  }

  async delete(id: string): Promise<void> {
    await firestore.collection(COLLECTION).doc(id).delete();
  }
}

export const membersRepository = new MembersRepository();
