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
  customfield_11015: JiraCustomFieldEntity; //Weight of complexity
  customfield_11444: JiraCustomFieldEntity; //Appendix weight point
  customfield_11312: JiraCustomFieldEntity; //Story point v2
  customfield_11543: JiraCustomFieldEntity[]; //Appendix v3
  issuetype: JiraIssueTypeEntity;
  created?: string; // Issue creation date
  resolutiondate?: string; // Resolution date (when marked as Done)
  resolution?: { name: string }; // Resolution status
  parent?: JiraParentEntity; // Parent issue (Epic)
}

export interface JiraParentEntity {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    priority: {
      name: string;
      id: string;
    };
    status: {
      name: string;
      id: string;
    };
    issuetype: {
      id: string;
      description: string;
      name: string;
      subtask: boolean;
      hierarchyLevel: number;
    };
  };
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
