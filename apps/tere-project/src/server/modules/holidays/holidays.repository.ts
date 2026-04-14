import { firestore } from '@server/lib/firebase-admin';

export interface Holiday {
  id?: string;
  holiday_date: string;
  holiday_name: string;
  is_national_holiday: boolean;
}

const COLLECTION = 'holiday';

function docToHoliday(doc: FirebaseFirestore.QueryDocumentSnapshot): Holiday {
  const data = doc.data();
  return {
    id: doc.id,
    holiday_date: data.date as string,
    holiday_name: data.name as string,
    is_national_holiday: data.is_national_holiday !== false,
  };
}

export class HolidaysRepository {
  async fetchHolidaysByYear(year: number): Promise<Holiday[]> {
    try {
      const snapshot = await firestore
        .collection(COLLECTION)
        .where('date', '>=', `${year}-01-01`)
        .where('date', '<=', `${year}-12-31`)
        .get();
      return snapshot.docs.map(docToHoliday);
    } catch {
      return [];
    }
  }

  async fetchHolidaysForYears(years: number[]): Promise<Holiday[]> {
    if (!years.length) return [];
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    try {
      const snapshot = await firestore
        .collection(COLLECTION)
        .where('date', '>=', `${minYear}-01-01`)
        .where('date', '<=', `${maxYear}-12-31`)
        .get();
      return snapshot.docs.map(docToHoliday).filter((h) => {
        const y = parseInt(h.holiday_date.substring(0, 4), 10);
        return years.includes(y);
      });
    } catch {
      return [];
    }
  }

  async createHoliday(date: string, name: string): Promise<Holiday> {
    const ref = await firestore.collection(COLLECTION).add({
      date,
      name,
      is_national_holiday: true,
    });
    return { id: ref.id, holiday_date: date, holiday_name: name, is_national_holiday: true };
  }

  async deleteHoliday(id: string): Promise<void> {
    await firestore.collection(COLLECTION).doc(id).delete();
  }
}
