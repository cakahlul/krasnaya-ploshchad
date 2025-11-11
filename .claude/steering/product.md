# Product Vision - Krasnaya Ploshchad

## Overview
**Krasnaya Ploshchad** is a comprehensive team management platform that collects and analyzes data from Jira to create performance reports based on sprint summaries, while also providing tools for managing team member availability and leave schedules.

## Problem Statement
Teams need consolidated performance insights from their Jira workflow data and effective tools to manage team capacity. Manual report generation and leave tracking through spreadsheets are time-consuming and inconsistent, making it difficult for team managers to track sprint performance, team productivity metrics, and plan sprints considering team member availability.

## Target Users
- **Primary**: Team Managers
- **Use Cases**:
  - Creating and reviewing sprint performance reports based on Jira issue data
  - Managing team member leave schedules and capacity planning
  - Tracking team availability for sprint planning

## Core Features
- **Data Collection**: Resume and collect data from Jira through API integration
- **Performance Reporting**: Generate summary reports for each sprint
- **Metrics Tracking**: Focus on story points and complexity metrics
- **Sprint Analysis**: Provide insights based on issues/tasks completed in Jira
- **Talent Leave Management**: Track and manage team member leave schedules
  - Calendar view showing leave dates across teams
  - CRUD operations for leave records (create, read, update, delete)
  - Team grouping with role visibility
  - Visual indicators for weekends, public holidays, and leave dates
  - Month-by-month calendar navigation
- **Team Roster Management**: View and organize team members by team and role

## Key Metrics
- **Story Points**: Track story point completion and velocity
- **Complexity**: Analyze task complexity patterns
- **Sprint Performance**: Summary reports per sprint cycle
- **Team Productivity**: Based on Jira issue resolution data
- **Team Availability**: Track leave patterns and team capacity
- **Leave Days**: Monitor leave utilization across teams

## Business Objectives
1. **Automated Reporting**: Eliminate manual sprint report creation
2. **Performance Visibility**: Provide clear insights into team performance
3. **Data-Driven Decisions**: Enable managers to make informed decisions based on metrics
4. **Sprint Optimization**: Help teams improve sprint planning and execution
5. **Capacity Planning**: Enable better sprint planning by visualizing team availability
6. **Leave Management**: Automate and centralize team member leave tracking

## Success Metrics
- Reduction in time spent on manual report generation
- Increased visibility into team performance trends
- Improved sprint planning accuracy considering team availability
- Enhanced team productivity insights
- Reduced time spent on manual leave tracking and spreadsheet management
- Better sprint capacity estimation based on team availability data

## Services Architecture
- **AIoC Service**: Backend data collection and processing
  - Jira API integration for sprint data
  - Talent leave management API with Firestore persistence
  - Team roster management from Firestore
- **Tere Project**: Frontend dashboard for visualization and management
  - Sprint performance reports
  - Talent leave calendar interface
  - Team management views