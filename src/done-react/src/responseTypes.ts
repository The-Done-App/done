/**
 * Filename: responseTypes.ts
 *
 * Description: This file contains the type definitions for the response objects
 * returned by the backend API.
 */

import { TaskNotification, UserCategory, UserSettings, UserTask } from "./userType";

export interface InitializeUserResponse {
  data: {
    userSettings: UserSettings;
    userCategories: UserCategory[];
    userTasks: UserTask[];
    taskNotifications: TaskNotification[];
  };
  message?: string;
}

export interface UserSettingsResponse {
  data: UserSettings | null;
  message?: string;
}

export interface UserTaskResponse {
  data: {
    task: UserTask;
    notifications: TaskNotification[];
  } | null;
  message?: string;
}

export interface UserCategoryResponse {
  data: UserCategory | null;
  message?: string;
}

export interface TaskNotificationResponse {
  data: TaskNotification | null;
  message?: string;
}

export interface DeleteResponse {
  message: string;
}

export interface ErrorResponse {
  message: string;
  error: string;
}
