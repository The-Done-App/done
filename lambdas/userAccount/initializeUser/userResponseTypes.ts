/** =========================================================================================
 * Filename: userResponseTypes.ts
 * 
 * Description: This file contains the type definitions for the response objects returned by the
 * DynamoDB table for use in the initializeUser Lambda function.
========================================================================================= */

import { GetCommandOutput, QueryCommandOutput } from "@aws-sdk/lib-dynamodb";

export interface UserAccountResponse extends GetCommandOutput {
  Item?: {
    email: string;
    firstName: string;
    fullName: string;
    createdAt: number;
    updatedAt: number;
    pk: string;
    sk: string;
  };
}

type UserSettings = {
  twelveHour: boolean;
  enableNotifications: boolean;
  displayEmail: boolean;
  defaultNotifications: {
    "5": boolean;
    "15": boolean;
    "30": boolean;
    "45": boolean;
    "60": boolean;
  };
  sortMode: "category" | "date";
  createdAt: number;
  updatedAt: number;
  pk: string;
  sk: string;
};

export type UserSettingsResponse = Omit<GetCommandOutput, "Item"> & {
  Item?: UserSettings;
};

export interface UserCategoriesResponse extends QueryCommandOutput {
  Items?: {
    categoryName: string;
    createdAt: number;
    updatedAt: number;
    pk: string;
    sk: string;
  }[];
  LastEvaluatedKey?: Record<string, any>;
}

export interface UserTasksResponse extends QueryCommandOutput {
  Items?: {
    taskTitle: string;
    taskNotes: string;
    taskDueDate: number;
    taskCompleted: boolean;
    categoryId: string | null;
    createdAt: number;
    updatedAt: number;
    pk: string;
    sk: string;
  }[];
  LastEvaluatedKey?: Record<string, any>;
}

export interface TaskNotificationsResponse extends QueryCommandOutput {
  Items: {
    notificationEnabled: boolean;
    reminderTimeBeforeDue: number;
    createdAt: number;
    updatedAt: number;
    pk: string;
    sk: string;
  }[];
  LastEvaluatedKey?: Record<string, any>;
}
