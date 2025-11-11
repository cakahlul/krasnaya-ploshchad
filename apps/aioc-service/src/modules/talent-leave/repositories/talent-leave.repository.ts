import { Injectable, InternalServerErrorException } from '@nestjs/common';
import admin from '../../../firebase/firebase-admin';
import { TalentLeaveEntity } from '../interfaces/talent-leave.entity';
import { LeaveFilterDto } from '../interfaces/talent-leave.dto';

@Injectable()
export class TalentLeaveRepository {
  private readonly firestore: admin.firestore.Firestore;
  private readonly collectionName = 'talent-leave';

  constructor() {
    this.firestore = admin.firestore();
  }

  /**
   * Safely converts a field to Date, handling both Firestore Timestamps and string dates
   */

  private toDate(field: any, fieldName?: string): Date {
    // Handle undefined/null fields
    if (field === undefined || field === null) {
      const errorMsg = fieldName
        ? `Missing required date field: ${fieldName}`
        : 'Missing required date field';
      console.error(errorMsg, 'field value:', field);
      throw new InternalServerErrorException(errorMsg);
    }

    // Handle Firestore Timestamp objects with toDate method
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (typeof field.toDate === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return field.toDate();
    }

    // Handle Firestore Timestamp objects with _seconds property
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (field._seconds !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return new Date(field._seconds * 1000);
    }

    // Handle objects with seconds and nanoseconds (Firestore Timestamp format)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (typeof field === 'object' && field.seconds !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return new Date(field.seconds * 1000);
    }

    // Handle string dates
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const date = new Date(field);

    // Validate the date
    if (isNaN(date.getTime())) {
      const errorMsg = fieldName
        ? `Invalid date format in field '${fieldName}': ${JSON.stringify(field)}`
        : `Invalid date format in database: ${JSON.stringify(field)}`;
      console.error(errorMsg);
      throw new InternalServerErrorException(errorMsg);
    }

    return date;
  }

  async create(data: TalentLeaveEntity): Promise<TalentLeaveEntity> {
    try {
      const docRef = await this.firestore
        .collection(this.collectionName)
        .add(data);
      const doc = await docRef.get();
      const docData = doc.data();

      if (!docData) {
        throw new InternalServerErrorException(
          'Failed to retrieve created document',
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const leaveDateArray = docData.leaveDate || [];
      return {
        id: doc.id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        name: docData.name,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        team: docData.team,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        leaveDate: leaveDateArray.map((leave: any) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          dateFrom: this.toDate(leave.dateFrom, 'leaveDate.dateFrom'),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          dateTo: this.toDate(leave.dateTo, 'leaveDate.dateTo'),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          status: leave.status,
        })),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        role: docData.role || '',

        createdAt: this.toDate(docData.createdAt, 'createdAt'),

        updatedAt: this.toDate(docData.updatedAt, 'updatedAt'),
      } as TalentLeaveEntity;
    } catch (error) {
      console.error('Firestore create error:', error);
      throw new InternalServerErrorException('Failed to create leave record');
    }
  }

  async findAll(filters?: LeaveFilterDto): Promise<TalentLeaveEntity[]> {
    try {
      let query: admin.firestore.Query = this.firestore.collection(
        this.collectionName,
      );

      // Apply team filter if provided
      if (filters?.team) {
        query = query.where('team', '==', filters.team);
      }

      const snapshot = await query.get();

      // Determine if date filtering should be applied
      const shouldFilterDates =
        filters && (filters.startDate || filters.endDate);
      const filterStart =
        shouldFilterDates && filters.startDate
          ? new Date(filters.startDate)
          : null;
      const filterEnd =
        shouldFilterDates && filters.endDate ? new Date(filters.endDate) : null;

      const results = snapshot.docs.map((doc) => {
        const data = doc.data();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const leaveDateArray = data.leaveDate || [];

        // Convert leave dates and optionally filter them based on date range
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        let processedLeaveDates = leaveDateArray.map((leave: any) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          dateFrom: this.toDate(leave.dateFrom, 'leaveDate.dateFrom'),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          dateTo: this.toDate(leave.dateTo, 'leaveDate.dateTo'),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          status: leave.status,
        }));

        // Filter leaveDate array based on date range and/or status
        if (shouldFilterDates || filters?.status) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
          processedLeaveDates = processedLeaveDates.filter((leave) => {
            // Apply date range filter
            let dateMatch = true;
            if (shouldFilterDates) {
              if (filterStart && filterEnd) {
                // Check if leave overlaps with filter range

                dateMatch =
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  leave.dateFrom <= filterEnd && leave.dateTo >= filterStart;
              } else if (filterStart) {
                // Check if leave ends after filter start
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                dateMatch = leave.dateTo >= filterStart;
              } else if (filterEnd) {
                // Check if leave starts before filter end
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                dateMatch = leave.dateFrom <= filterEnd;
              }
            }

            // Apply status filter
            const statusMatch = filters?.status
              ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                leave.status === filters.status
              : true;

            return dateMatch && statusMatch;
          });
        }

        return {
          id: doc.id,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          name: data.name,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          team: data.team,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          leaveDate: processedLeaveDates,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          role: data.role || '',

          createdAt: this.toDate(data.createdAt, 'createdAt'),

          updatedAt: this.toDate(data.updatedAt, 'updatedAt'),
        } as TalentLeaveEntity;
      });

      // Sort by first leave date ascending, records with no dates go last
      results.sort((a, b) => {
        const aFirstDate =
          a.leaveDate[0]?.dateFrom.getTime() || Number.MAX_SAFE_INTEGER;
        const bFirstDate =
          b.leaveDate[0]?.dateFrom.getTime() || Number.MAX_SAFE_INTEGER;
        return aFirstDate - bFirstDate;
      });

      return results;
    } catch (error) {
      console.error('Firestore findAll error:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve leave records',
      );
    }
  }

  async findById(id: string): Promise<TalentLeaveEntity | null> {
    try {
      const docRef = await this.firestore
        .collection(this.collectionName)
        .doc(id)
        .get();

      if (!docRef.exists) {
        return null;
      }

      const data = docRef.data();
      if (!data) {
        return null;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const leaveDateArray = data.leaveDate || [];
      return {
        id: docRef.id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        name: data.name,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        team: data.team,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        leaveDate: leaveDateArray.map((leave: any) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          dateFrom: this.toDate(leave.dateFrom, 'leaveDate.dateFrom'),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          dateTo: this.toDate(leave.dateTo, 'leaveDate.dateTo'),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          status: leave.status,
        })),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        role: data.role || '',

        createdAt: this.toDate(data.createdAt, 'createdAt'),

        updatedAt: this.toDate(data.updatedAt, 'updatedAt'),
      } as TalentLeaveEntity;
    } catch (error) {
      console.error('Firestore findById error:', error);
      throw new InternalServerErrorException('Failed to retrieve leave record');
    }
  }

  async findByName(name: string): Promise<TalentLeaveEntity | null> {
    try {
      const snapshot = await this.firestore
        .collection(this.collectionName)
        .where('name', '==', name)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const leaveDateArray = data.leaveDate || [];
      return {
        id: doc.id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        name: data.name,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        team: data.team,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        leaveDate: leaveDateArray.map((leave: any) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          dateFrom: this.toDate(leave.dateFrom, 'leaveDate.dateFrom'),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          dateTo: this.toDate(leave.dateTo, 'leaveDate.dateTo'),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          status: leave.status,
        })),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        role: data.role || '',

        createdAt: this.toDate(data.createdAt, 'createdAt'),

        updatedAt: this.toDate(data.updatedAt, 'updatedAt'),
      } as TalentLeaveEntity;
    } catch (error) {
      console.error('Firestore findByName error:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve leave record by name',
      );
    }
  }

  async update(
    id: string,
    data: Partial<TalentLeaveEntity>,
  ): Promise<TalentLeaveEntity | null> {
    try {
      const docRef = this.firestore.collection(this.collectionName).doc(id);

      // Check if document exists
      const doc = await docRef.get();
      if (!doc.exists) {
        return null;
      }

      // Update the document
      await docRef.update(data);

      // Fetch and return updated document
      const updatedDoc = await docRef.get();

      const updatedData = updatedDoc.data();

      if (!updatedData) {
        return null;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const leaveDateArray = updatedData.leaveDate || [];
      return {
        id: updatedDoc.id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        name: updatedData.name,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        team: updatedData.team,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        leaveDate: leaveDateArray.map((leave: any) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          dateFrom: this.toDate(leave.dateFrom, 'leaveDate.dateFrom'),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          dateTo: this.toDate(leave.dateTo, 'leaveDate.dateTo'),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          status: leave.status,
        })),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        role: updatedData.role || '',

        createdAt: this.toDate(updatedData.createdAt, 'createdAt'),

        updatedAt: this.toDate(updatedData.updatedAt, 'updatedAt'),
      } as TalentLeaveEntity;
    } catch (error) {
      console.error('Firestore update error:', error);
      throw new InternalServerErrorException('Failed to update leave record');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.firestore.collection(this.collectionName).doc(id).delete();
    } catch (error) {
      console.error('Firestore delete error:', error);
      throw new InternalServerErrorException('Failed to delete leave record');
    }
  }

  /**
   * Fetch all unique team names from the 'team' Firestore collection
   * @returns Array of unique team names sorted alphabetically
   */
  async findAllTeams(): Promise<string[]> {
    try {
      const snapshot = await this.firestore.collection('team').get();

      if (snapshot.empty) {
        return [];
      }

      const teamSet = new Set<string>();

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const teamName = data.name || data.teamName;

        if (typeof teamName === 'string' && teamName.trim() !== '') {
          teamSet.add(teamName.trim());
        }
      });

      return Array.from(teamSet).sort();
    } catch (error) {
      console.error('Failed to fetch teams from Firestore:', error);
      throw new InternalServerErrorException('Failed to fetch teams');
    }
  }

  /**
   * Fetch all talents (team members) from the 'talent' Firestore collection
   * Resolves team and role references to get the actual names
   * @returns Array of talent records with resolved team and role names
   */
  async findAllTalents(): Promise<
    Array<{
      id: string;
      name: string;
      team: string;
      role: string;
    }>
  > {
    try {
      const snapshot = await this.firestore.collection('talent').get();

      if (snapshot.empty) {
        return [];
      }

      const talents = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          let teamName = '';
          let roleName = '';

          // Resolve team reference if it exists
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (data.team && typeof data.team.get === 'function') {
            try {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
              const teamDoc = await data.team.get();
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              if (teamDoc.exists) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                const teamData = teamDoc.data();
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                teamName = teamData.name || teamData.teamName || '';
              }
            } catch (error) {
              console.error(
                `Failed to resolve team reference for talent ${doc.id}:`,
                error,
              );
            }
          } else if (typeof data.team === 'string') {
            // If team is already a string, use it directly

            teamName = data.team;
          }

          // Resolve role reference if it exists
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (data.role && typeof data.role.get === 'function') {
            try {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
              const roleDoc = await data.role.get();
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              if (roleDoc.exists) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                const roleData = roleDoc.data();
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                roleName = roleData.name || roleData.roleName || '';
              }
            } catch (error) {
              console.error(
                `Failed to resolve role reference for talent ${doc.id}:`,
                error,
              );
            }
          } else if (typeof data.role === 'string') {
            // If role is already a string, use it directly

            roleName = data.role;
          }

          return {
            id: doc.id,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            name: data.name,
            team: teamName,
            role: roleName,
          };
        }),
      );

      return talents;
    } catch (error) {
      console.error('Failed to fetch talents from Firestore:', error);
      throw new InternalServerErrorException('Failed to fetch talents');
    }
  }
}
