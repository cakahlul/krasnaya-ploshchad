import axios from 'axios';
import { BugMonitoringData } from '../types/bug-monitoring.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_AIOC_SERVICE || 'http://localhost:3000';

export const bugMonitoringApi = {
  getBugs: async (boardId: number): Promise<BugMonitoringData> => {
    const response = await axios.get<BugMonitoringData>(
      `${API_BASE_URL}/bug-monitoring/bugs`,
      {
        params: { boardId },
        headers: {
          Authorization: `Bearer ${await getAuthToken()}`,
        },
      },
    );
    return response.data;
  },
};

async function getAuthToken(): Promise<string> {
  // Get Firebase token from authentication context
  // This assumes you have Firebase auth set up in your app
  if (typeof window !== 'undefined') {
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
  }
  return '';
}
