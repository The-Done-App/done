/** ===========================================================================
 * Filename: userType.ts
 *
 * Description: This file contains the type definitions for the user objects
 * returned by the backend API and stored in the frontend state (UserContext).
 =========================================================================== */

export type User = {
  userId: string;
  userAccount: UserAccount;
  userSettings: UserSettings;
  userCategories: UserCategory[];
  userTasks: UserTask[];
};

export type UserAccount = {
  email: string;
  firstName: string;
  fullName: string;
};

export type UserSettings = {
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
};

export type UserCategory = {
  categoryId: string;
  categoryName: string;
  createdAt: number;
  updatedAt: number;
};

export type UserTask = {
  taskId: string;
  taskTitle: string;
  taskNotes: string;
  taskDueDate: number;
  taskCompleted: boolean;
  categoryId: string | null;
  taskNotifications: TaskNotification[];
  createdAt: number;
  updatedAt: number;
};

export type TaskNotification = {
  taskId: string;
  notificationId: string;
  notificationEnabled: boolean;
  reminderTimeBeforeDue: number;
  createdAt: number;
  updatedAt: number;
};
