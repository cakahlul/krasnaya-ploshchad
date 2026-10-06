'use client';

import { useEffect } from 'react';
import { App } from 'antd';
import type { AxiosError } from 'axios';
import axiosClient from '@src/lib/axiosClient';

const STATUS_MESSAGES: Record<number, { title: string; description: string }> =
  {
    400: {
      title: 'Invalid request',
      description: 'Review the entered values and try again.',
    },
    401: {
      title: 'Sign-in required',
      description: 'Your session has expired. Sign in again to continue.',
    },
    403: {
      title: 'Access denied',
      description: 'You do not have permission to perform this action.',
    },
    404: {
      title: 'Not found',
      description: 'The requested resource is unavailable.',
    },
    408: {
      title: 'Request timed out',
      description: 'The service did not respond in time. Try again.',
    },
    409: {
      title: 'Update conflict',
      description: 'The data changed before your update could be applied. Refresh and try again.',
    },
    422: {
      title: 'Validation failed',
      description: 'Review the entered values and try again.',
    },
    429: {
      title: 'Too many requests',
      description: 'Wait briefly before trying again.',
    },
    500: {
      title: 'Service error',
      description: 'The service could not complete this request. Try again shortly.',
    },
    502: {
      title: 'Upstream service error',
      description: 'A connected service returned an error. Try again shortly.',
    },
    503: {
      title: 'Service unavailable',
      description: 'The service is temporarily unavailable. Try again shortly.',
    },
    504: {
      title: 'Upstream timeout',
      description: 'A connected service did not respond in time. Try again.',
    },
  };

const FALLBACK_MESSAGE = {
  title: 'Unexpected error',
  description: 'The request could not be completed. Try again.',
};

const NETWORK_MESSAGE = {
  title: 'Network unavailable',
  description: 'Check your connection and try again.',
};

export default function AxiosErrorInterceptor() {
  const { notification } = App.useApp();

  useEffect(() => {
    const interceptorId = axiosClient.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        if (!error.response) {
          notification.error({
            message: NETWORK_MESSAGE.title,
            description: NETWORK_MESSAGE.description,
            placement: 'bottomRight',
            duration: 5,
          });
          return Promise.reject(error);
        }

        const status = error.response.status;
        const mapped = STATUS_MESSAGES[status] ?? FALLBACK_MESSAGE;

        notification.error({
          message: mapped.title,
          description: mapped.description,
          placement: 'bottomRight',
          duration: 5,
        });

        return Promise.reject(error);
      },
    );

    return () => {
      axiosClient.interceptors.response.eject(interceptorId);
    };
  }, [notification]);

  return null;
}
