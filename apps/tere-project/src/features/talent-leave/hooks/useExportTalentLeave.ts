'use client';
import { useState } from 'react';

interface ExportResponse {
  success: boolean;
  message: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  exportedAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_AIOC_SERVICE || 'http://localhost:3001';

export function useExportTalentLeave() {
  const [isExporting, setIsExporting] = useState(false);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  /**
   * Step 1: Get Google OAuth authorization URL
   */
  const getAuthUrl = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/talent-leave/auth/google`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get authorization URL');
      }

      setAuthUrl(data.authUrl);
      return data.authUrl;
    } catch (error) {
      // Don't show message here, let the component handle it
      throw error;
    }
  };

  /**
   * Step 2: Export talent leave data to Google Spreadsheet
   */
  const exportToSpreadsheet = async (
    startDate: string,
    endDate: string,
    accessToken: string,
  ): Promise<ExportResponse> => {
    setIsExporting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/talent-leave/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          accessToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to export data');
      }

      // Don't show message here, let the component handle it
      return data;
    } catch (error) {
      // Don't show message here, let the component handle it
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Complete export flow: Get auth URL → User authorizes → Extract token → Export
   */
  const startExportFlow = async (startDate: string, endDate: string) => {
    try {
      // Get authorization URL
      const url = await getAuthUrl();

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        url,
        'Google Authorization',
        `width=${width},height=${height},left=${left},top=${top}`,
      );

      if (!popup) {
        throw new Error('Please allow popups for this site');
      }

      // Wait for OAuth callback via postMessage
      return new Promise<ExportResponse>((resolve, reject) => {
        let hasReceivedToken = false;

        // Listen for message from popup
        const handleMessage = (event: MessageEvent) => {
          // Verify message is from our callback
          if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
            const { accessToken } = event.data;

            if (accessToken) {
              hasReceivedToken = true;
              // Clean up
              clearInterval(checkPopupClosed);
              window.removeEventListener('message', handleMessage);

              // Proceed with export
              exportToSpreadsheet(startDate, endDate, accessToken)
                .then(resolve)
                .catch(reject);
            }
          }
        };

        window.addEventListener('message', handleMessage);

        // Check if popup was closed without authorization
        const checkPopupClosed = setInterval(() => {
          if (popup.closed && !hasReceivedToken) {
            clearInterval(checkPopupClosed);
            window.removeEventListener('message', handleMessage);
            reject(new Error('Authorization cancelled'));
          }
        }, 500);

        // Timeout after 5 minutes
        setTimeout(() => {
          if (!hasReceivedToken) {
            clearInterval(checkPopupClosed);
            window.removeEventListener('message', handleMessage);
            if (!popup.closed) {
              popup.close();
            }
            reject(new Error('Authorization timeout'));
          }
        }, 5 * 60 * 1000);
      });
    } catch (error) {
      // Don't show message here, let the component handle it
      throw error;
    }
  };

  return {
    isExporting,
    authUrl,
    getAuthUrl,
    exportToSpreadsheet,
    startExportFlow,
  };
}
