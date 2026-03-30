import axios from 'axios';

// Single shared axios instance for all JIRA API calls.
// Retry logic and rate limiting stay in the repository layer.
export const jiraClient = axios.create({
  baseURL: process.env.JIRA_URL ?? '',
  auth: {
    username: process.env.JIRA_USERNAME ?? '',
    password: process.env.JIRA_API_TOKEN ?? '',
  },
  timeout: parseInt(process.env.JIRA_REQUEST_TIMEOUT ?? '30000', 10),
});
