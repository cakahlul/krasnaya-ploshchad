import { firestore } from '@server/lib/firebase-admin';

export interface TalentLeaveEntity {
  id?: string;
  name: string;
  team: string;
  leaveDate: Array<{ dateFrom: Date; dateTo: Date; status: string }>;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveFilterDto {
  startDate?: string;
  endDate?: string;
  status?: string;
  team?: string;
}

function toDate(field: any): Date {
  if (field === undefined || field === null) throw new Error('Missing required date field');
  if (typeof field.toDate === 'function') return field.toDate();
  if (field._seconds !== undefined) return new Date(field._seconds * 1000);
  if (typeof field === 'object' && field.seconds !== undefined) return new Date(field.seconds * 1000);
  const date = new Date(field);
  if (isNaN(date.getTime())) throw new Error(`Invalid date format: ${JSON.stringify(field)}`);
  return date;
}

function mapDocToEntity(id: string, data: FirebaseFirestore.DocumentData): TalentLeaveEntity {
  const leaveDateArray = data.leaveDate || [];
  return {
    id,
    name: data.name,
    team: data.team,
    leaveDate: leaveDateArray.map((leave: any) => ({
      dateFrom: toDate(leave.dateFrom),
      dateTo: toDate(leave.dateTo),
      status: leave.status,
    })),
    role: data.role || '',
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

const COLLECTION = 'talent-leave';

export class TalentLeaveRepository {
  async create(data: TalentLeaveEntity): Promise<TalentLeaveEntity> {
    const docRef = await firestore.collection(COLLECTION).add(data);
    const doc = await docRef.get();
    const docData = doc.data();
    if (!docData) throw new Error('Failed to retrieve created document');
    return mapDocToEntity(doc.id, docData);
  }

  async findAll(filters?: LeaveFilterDto): Promise<TalentLeaveEntity[]> {
    let query: FirebaseFirestore.Query = firestore.collection(COLLECTION);
    if (filters?.team) query = query.where('team', '==', filters.team);
    const snapshot = await query.get();

    const shouldFilterDates = filters && (filters.startDate || filters.endDate);
    const filterStart = shouldFilterDates && filters.startDate ? new Date(filters.startDate) : null;
    const filterEnd = shouldFilterDates && filters.endDate ? new Date(filters.endDate) : null;

    const results = snapshot.docs.map((doc) => {
      const data = doc.data();
      const leaveDateArray = data.leaveDate || [];
      let processedLeaveDates = leaveDateArray.map((leave: any) => ({
        dateFrom: toDate(leave.dateFrom),
        dateTo: toDate(leave.dateTo),
        status: leave.status,
      }));

      if (shouldFilterDates || filters?.status) {
        processedLeaveDates = processedLeaveDates.filter((leave: any) => {
          let dateMatch = true;
          if (shouldFilterDates) {
            if (filterStart && filterEnd) dateMatch = leave.dateFrom <= filterEnd && leave.dateTo >= filterStart;
            else if (filterStart) dateMatch = leave.dateTo >= filterStart;
            else if (filterEnd) dateMatch = leave.dateFrom <= filterEnd;
          }
          const statusMatch = filters?.status ? leave.status === filters.status : true;
          return dateMatch && statusMatch;
        });
      }

      return { id: doc.id, name: data.name, team: data.team, leaveDate: processedLeaveDates, role: data.role || '', createdAt: toDate(data.createdAt), updatedAt: toDate(data.updatedAt) } as TalentLeaveEntity;
    });

    results.sort((a, b) => {
      const aFirst = a.leaveDate[0]?.dateFrom.getTime() || Number.MAX_SAFE_INTEGER;
      const bFirst = b.leaveDate[0]?.dateFrom.getTime() || Number.MAX_SAFE_INTEGER;
      return aFirst - bFirst;
    });

    return results;
  }

  async findById(id: string): Promise<TalentLeaveEntity | null> {
    const docRef = await firestore.collection(COLLECTION).doc(id).get();
    if (!docRef.exists) return null;
    const data = docRef.data();
    if (!data) return null;
    return mapDocToEntity(docRef.id, data);
  }

  async findByName(name: string): Promise<TalentLeaveEntity | null> {
    const snapshot = await firestore.collection(COLLECTION).where('name', '==', name).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return mapDocToEntity(doc.id, doc.data());
  }

  async update(id: string, data: Partial<TalentLeaveEntity>): Promise<TalentLeaveEntity | null> {
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

  async findAllTeams(): Promise<string[]> {
    const snapshot = await firestore.collection('team').get();
    if (snapshot.empty) return [];
    const teamSet = new Set<string>();
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const teamName = data.name || data.teamName;
      if (typeof teamName === 'string' && teamName.trim() !== '') teamSet.add(teamName.trim());
    });
    return Array.from(teamSet).sort();
  }

  async findAllTalents(): Promise<Array<{ id: string; name: string; team: string; role: string }>> {
    const snapshot = await firestore.collection('talent').get();
    if (snapshot.empty) return [];
    return Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        let teamName = '';
        let roleName = '';
        if (data.team && typeof data.team.get === 'function') {
          try {
            const teamDoc = await data.team.get();
            if (teamDoc.exists) { const td = teamDoc.data(); teamName = td.name || td.teamName || ''; }
          } catch {}
        } else if (typeof data.team === 'string') { teamName = data.team; }
        if (data.role && typeof data.role.get === 'function') {
          try {
            const roleDoc = await data.role.get();
            if (roleDoc.exists) { const rd = roleDoc.data(); roleName = rd.name || rd.roleName || ''; }
          } catch {}
        } else if (typeof data.role === 'string') { roleName = data.role; }
        return { id: doc.id, name: data.name, team: teamName, role: roleName };
      })
    );
  }
}

export const talentLeaveRepository = new TalentLeaveRepository();
