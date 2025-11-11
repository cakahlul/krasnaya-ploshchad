// Leave date range interface with status
export interface LeaveDateRange {
  dateFrom: string; // ISO 8601 timestamp - leave start date
  dateTo: string; // ISO 8601 timestamp - leave end date
  status: string; // e.g., "Confirmed", "Draft" - status per leave range
}

// Request DTO for creating leave
export interface CreateTalentLeaveDto {
  name: string; // Team member name
  team: string; // Team name/identifier
  leaveDate?: LeaveDateRange[]; // Optional array of leave date ranges with status
  role: string; // Team member role (e.g., "BE", "QA", "Mobile")
}

// Request DTO for updating leave (all fields optional)
export interface UpdateTalentLeaveDto {
  name?: string;
  team?: string;
  leaveDate?: LeaveDateRange[]; // Array of leave date ranges with status
  role?: string; // Team member role (optional for updates)
}

// Response DTO
export interface TalentLeaveResponseDto {
  id: string; // Firestore document ID
  name: string;
  team: string;
  leaveDate: LeaveDateRange[]; // Array of leave date ranges with status
  role: string; // Team member role
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

// Filter DTO for queries
export interface LeaveFilterDto {
  startDate?: string; // Filter: overlapping leaves with dateFrom/dateTo
  endDate?: string; // Filter: overlapping leaves with dateFrom/dateTo
  status?: string; // Filter: status == status
  team?: string; // Filter: team == team
}

// Response DTO for talent (team members)
export interface TalentResponseDto {
  id: string; // Firestore document ID
  name: string; // Team member name
  team: string; // Team name - resolved from Firestore reference
  role: string; // Team member role - resolved from Firestore reference
}
