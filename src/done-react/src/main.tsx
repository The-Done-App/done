/** =========================================================================================
 * Filename: main.tsx
 *
 * Description: This file is the main entry point for the react app.
 *
 * Contains:
 * - Router object
 * - Amplify configuration
 * - React DOM render
 ========================================================================================= */

import { Amplify } from "aws-amplify";
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import amplifyConfig from "./amplify.config";
import AppContainer from "./components/AppContainer";
import HomePage from "./components/HomePage";
import NavigationBar from "./components/NavigationBar";
import RedirectToHome from "./components/RedirectToHome";
import Root from "./components/Root";
import TaskNotificationPage from "./components/TaskNotificationPage";
import UserAccountPage from "./components/UserAccountPage";
import UserSettingsPage from "./components/UserSettingsPage";
import UserTaskPage from "./components/UserTaskPage";
import ErrorPage from "./error-page";
import "./index.css";
import UserProvider from "./UserProvider";

// Configure Amplify with the amplifyConfig object to connect to the Cognito user pool for authentication
Amplify.configure(amplifyConfig);

// Create the router object with the routes for the application
const router = createBrowserRouter([
  {
    // The root route is the root component which contains the navigation bar and the page content
    path: "/",
    element: <Root />,
    errorElement: (
      <AppContainer>
        <NavigationBar />
        <ErrorPage />
      </AppContainer>
    ),
    children: [
      {
        // The home page is the main page of the application (the default route)
        index: true,
        element: <HomePage />,
      },
      {
        // The user account page displays the user's account information and allows them to sign out or delete their account
        path: "/userAccount",
        element: <UserAccountPage />,
      },
      {
        // The user settings page displays the user's settings and allows them to change them
        path: "/userSettings",
        element: <UserSettingsPage />,
      },
      {
        // The user task page displays the details of a specific task. The URL contains the task ID
        path: "/userTask/:taskId",
        element: <UserTaskPage />,
      },
      {
        // The task notifications page displays the notifications for a specific task. The URL contains the task ID
        path: "/taskNotifications/:taskId",
        element: <TaskNotificationPage />,
      },
      {
        // All other routes redirect to the home page
        path: "*",
        element: <RedirectToHome />,
      },
    ],
  },
]);

// Render the application to the root html element in the index.html file
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* Wrap the router in the UserProvider to provide the user data to all components */}
    <UserProvider>
      {/* Use the RouterProvider to render the appropriate UI based on the current route */}
      <RouterProvider router={router} />
    </UserProvider>
  </React.StrictMode>,
);
