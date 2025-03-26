interface JiraCustomFieldEntity {
  self: string;
  value: string;
  id: string;
}

export interface JiraIssueEntity {
  id: string;
  key: string;
  summary: string;
  fields: JiraFieldEntity;
}

export interface JiraFieldEntity {
  summary: string;
  customfield_10005: number; //story point
  customfield_10865: JiraCustomFieldEntity; //complexity
  assignee: JiraAssigneeEntity;
  customfield_10796: JiraCustomFieldEntity; //story point type
  issuetype: JiraIssueTypeEntity;
}

export interface JiraAssigneeEntity {
  self: string;
  accountId: string;
  emailAddress: string;
  displayName: string;
  active: boolean;
  timeZone: string;
  accountType: string;
}

export interface JiraQueryResponseEntity {
  expand: string;
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssueEntity[];
}

export interface JiraIssueTypeEntity {
  self: string;
  id: string;
  description: string;
  name: string;
}

export interface JiraProjectEntity {
  self: string;
  id: string;
  key: string;
  name: string;
}
