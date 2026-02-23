import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import admin from '../../firebase/firebase-admin';

export interface Holiday {
  id?: string;
  holiday_date: string;      // e.g., "2026-01-01" (maps to Firestore 'date')
  holiday_name: string;      // e.g., "Tahun Baru 2026 Masehi" (maps to Firestore 'name')
  is_national_holiday: boolean;  // true for national holidays
}

@Injectable()
export class HolidaysRepository {
  private readonly logger = new Logger(HolidaysRepository.name);
  private readonly firestore: admin.firestore.Firestore;
  private readonly collectionName = 'holiday';

  constructor() {
    this.firestore = admin.firestore();
  }

  async findAll(): Promise<Holiday[]> {
    try {
      const snapshot = await this.firestore.collection(this.collectionName).get();
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          holiday_date: data.date,
          holiday_name: data.name,
          is_national_holiday: data.is_national_holiday !== false // Default to true if missing
        };
      });
    } catch (error) {
      this.logger.error(`Error fetching holidays: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch holidays');
    }
  }

  async fetchHolidaysByYear(year: number): Promise<Holiday[]> {
    try {
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;
      const snapshot = await this.firestore.collection(this.collectionName)
        .where('date', '>=', start)
        .where('date', '<=', end)
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          holiday_date: data.date,
          holiday_name: data.name,
          is_national_holiday: data.is_national_holiday !== false
        };
      });
    } catch (error) {
      this.logger.error(`Error fetching holidays by year: ${error.message}`);
      return [];
    }
  }

  async fetchHolidaysForYears(years: number[]): Promise<Holiday[]> {
    if (!years || years.length === 0) return [];
    
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    try {
      const start = `${minYear}-01-01`;
      const end = `${maxYear}-12-31`;
      const snapshot = await this.firestore.collection(this.collectionName)
        .where('date', '>=', start)
        .where('date', '<=', end)
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          holiday_date: data.date,
          holiday_name: data.name,
          is_national_holiday: data.is_national_holiday !== false
        };
      }).filter(h => {
        const hYear = parseInt(h.holiday_date.substring(0, 4), 10);
        return years.includes(hYear);
      });
    } catch (error) {
      this.logger.error(`Error fetching holidays for multiple years: ${error.message}`);
      return [];
    }
  }

  async create(data: { date: string; name: string; is_national_holiday?: boolean }): Promise<Holiday> {
    try {
      const isNational = data.is_national_holiday !== false;
      const docRef = await this.firestore.collection(this.collectionName).add({
        date: data.date,
        name: data.name,
        is_national_holiday: isNational
      });
      return {
        id: docRef.id,
        holiday_date: data.date,
        holiday_name: data.name,
        is_national_holiday: isNational
      };
    } catch (error) {
      this.logger.error(`Error creating holiday: ${error.message}`);
      throw new InternalServerErrorException('Failed to create holiday');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.firestore.collection(this.collectionName).doc(id).delete();
    } catch (error) {
      this.logger.error(`Error deleting holiday: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete holiday');
    }
  }

  async bulkCreate(holidays: Array<{ date: string; name: string }>): Promise<void> {
    try {
      const batch = this.firestore.batch();
      holidays.forEach(holiday => {
        const docRef = this.firestore.collection(this.collectionName).doc();
        batch.set(docRef, {
          date: holiday.date,
          name: holiday.name,
          is_national_holiday: true
        });
      });
      await batch.commit();
    } catch (error) {
      this.logger.error(`Error in bulk create: ${error.message}`);
      throw new InternalServerErrorException('Failed to bulk create holidays');
    }
  }
}
