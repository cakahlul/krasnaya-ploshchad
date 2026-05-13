# Product Vision - Krasnaya Ploshchad

## Overview
**Krasnaya Ploshchad** is a monorepo housing a team management platform that collects and analyzes Jira data to produce sprint performance reports, alongside tools for managing team member availability, holidays, bug monitoring, and access control.

## Problem Statement
Team managers need consolidated insights from Jira workflow data and effective tools to manage team capacity. Manual report generation, leave tracking via spreadsheets, and ad-hoc access management are time-consuming and inconsistent.

## Target Users
- **Primary**: Team Managers, Engineering Leads
- **Secondary**: Team members consuming reports and managing their leave

## Apps in the Monorepo
1. **`apps/tere-project`** — Team Reporting (Tere): the main full-stack Next.js web app. Frontend UI + backend logic via Next.js API routes.
2. **`apps/mcp-server`** — `@esjn/mcp-tere-report`: a published MCP server exposing Tere report data to AI clients (Claude, etc.) via the Model Context Protocol.

> The former `aioc-service` (NestJS backend) is no longer part of this repository. Its responsibilities were folded into `tere-project`'s `src/server/` directory and exposed through Next.js API routes.

## Core Features (Tere Project)
- **Sprint Reporting**: Performance reports per sprint based on Jira issues, story points, complexity, and WP (work points) weights.
- **Dashboard**: Aggregated team productivity metrics and visualizations.
- **Bug Monitoring**: Track and visualize bug trends across projects.
- **Talent Leave Management**: Calendar view, CRUD for leave records, team grouping, weekend/holiday markers, month navigation.
- **Holiday Management**: Configure public holidays affecting capacity calculations.
- **Team Members / Roster**: View and organize team members by team and role.
- **API Keys**: Manage programmatic access (used by external clients including the MCP server).
- **User Access**: Role-based access control (RBAC).
- **Target WP Config / WP Weight Config**: Configure work point targets and weighting per project/board.
- **Auth**: Google sign-in via Firebase Authentication.

## Core Features (MCP Server)
- `list-sprints` — list available sprints
- `get-sprint-report` — sprint report by ID
- `get-open-sprint-report` — current open sprint
- `get-productivity-summary` — aggregated productivity metrics
- `get-epics` — list epics
- Auth via API key against Tere API endpoints.

## Key Metrics
- Story points, complexity, WP weights, sprint velocity
- Team availability and leave utilization
- Bug counts and trends

## Business Objectives
1. Automate sprint reporting; eliminate manual aggregation.
2. Centralize team capacity (leave + holidays) for sprint planning.
3. Make Tere data accessible to AI assistants via MCP.
4. Enforce access control on sensitive Jira-derived data.

## Feature Flag Notes
- **`isShowPlannedWP`** — scoped to Team Reporting only; not used in Dashboard or Productivity Summary.
