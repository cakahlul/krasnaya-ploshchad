# Product Vision - Krasnaya Ploshchad

## Overview
**Krasnaya Ploshchad** is a team reporting platform that collects and analyzes data from Jira to create performance reports based on sprint summaries.

## Problem Statement
Teams need consolidated performance insights from their Jira workflow data. Manual report generation is time-consuming and inconsistent, making it difficult for team managers to track sprint performance and team productivity metrics.

## Target Users
- **Primary**: Team Managers
- **Use Case**: Creating and reviewing sprint performance reports based on Jira issue data

## Core Features
- **Data Collection**: Resume and collect data from Jira through API integration
- **Performance Reporting**: Generate summary reports for each sprint
- **Metrics Tracking**: Focus on story points and complexity metrics
- **Sprint Analysis**: Provide insights based on issues/tasks completed in Jira

## Key Metrics
- **Story Points**: Track story point completion and velocity
- **Complexity**: Analyze task complexity patterns
- **Sprint Performance**: Summary reports per sprint cycle
- **Team Productivity**: Based on Jira issue resolution data

## Business Objectives
1. **Automated Reporting**: Eliminate manual sprint report creation
2. **Performance Visibility**: Provide clear insights into team performance
3. **Data-Driven Decisions**: Enable managers to make informed decisions based on metrics
4. **Sprint Optimization**: Help teams improve sprint planning and execution

## Success Metrics
- Reduction in time spent on manual report generation
- Increased visibility into team performance trends
- Improved sprint planning accuracy
- Enhanced team productivity insights

## Services Architecture
- **AIoC Service**: Backend data collection and processing from Jira
- **Tere Project**: Frontend dashboard for report visualization and management