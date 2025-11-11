// Leave date range entity for Firestore with status
export interface LeaveDateRangeEntity {
  dateFrom: Date; // Firestore Timestamp - leave start date
  dateTo: Date; // Firestore Timestamp - leave end date
  status: string; // Status per leave range (e.g., "Confirmed", "Draft")
}

// Internal entity representing Firestore document
export interface TalentLeaveEntity {
  id?: string; // Firestore document ID (optional for creation)
  name: string;
  team: string;
  leaveDate: LeaveDateRangeEntity[]; // Array of leave date ranges with status
  role: string; // Team member role (e.g., "BE", "QA", "Mobile")
  createdAt: Date; // Firestore Timestamp
  updatedAt: Date; // Firestore Timestamp
}
