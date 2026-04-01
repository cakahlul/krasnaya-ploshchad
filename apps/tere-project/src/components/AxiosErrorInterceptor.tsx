'use client';

import { useEffect } from 'react';
import { App } from 'antd';
import type { AxiosError } from 'axios';
import axiosClient from '@src/lib/axiosClient';

const STATUS_MESSAGES: Record<number, { title: string; description: string }> =
  {
    400: {
      title: "That request didn't make sense 🤔",
      description:
        "Something's off with the data you sent. The server is very confused right now.",
    },
    401: {
      title: "Who are you again? 🕵️",
      description:
        "Your session expired or you're not logged in. Time to prove yourself!",
    },
    403: {
      title: "Access denied, rookie 🚫",
      description:
        "You don't have clearance for this. Maybe bribe the admin? (kidding)",
    },
    404: {
      title: "Gone fishing 🎣",
      description:
        "That resource vanished into thin air. It either never existed or ghosted us.",
    },
    408: {
      title: "Still waiting... like your PR reviewer on a Friday ⏳",
      description: "The request timed out. The server is having a slow day.",
    },
    409: {
      title: "There's a conflict! ⚔️",
      description:
        "Two things are fighting over the same data. Only one can win.",
    },
    422: {
      title: "Almost, but not quite 🤏",
      description:
        "The data looked good but didn't pass validation. So close, yet so far.",
    },
    429: {
      title: "Whoa, slow down turbo! 🏎️",
      description:
        "You're sending too many requests. Even servers need a breather.",
    },
    500: {
      title: "Server tripped on its shoelaces 😵",
      description:
        "Something exploded on our end. Our team is already crying about it.",
    },
    502: {
      title: "Bad gateway? More like bad day 🌩️",
      description:
        "The server got a bad response from upstream. Classic domino effect.",
    },
    503: {
      title: "Server is taking a nap 😴",
      description: "Service unavailable. Someone forgot to wake it up on time.",
    },
    504: {
      title: "Upstream fell asleep too 💤",
      description:
        "Gateway timeout. Everyone on the chain is having a slow day.",
    },
  };

const FALLBACK_MESSAGE = {
  title: "Something went sideways 🛸",
  description:
    "An unexpected error occurred. We're as surprised as you are, honestly.",
};

const NETWORK_MESSAGE = {
  title: "Houston, we have a problem 🚀",
  description:
    "Can't reach the server. Check your internet — even pigeons would be faster right now.",
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
