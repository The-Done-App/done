/** =========================================================================================
 * Filename: Root.tsx
 *
 * Description: This component is the root component for the application. It manages
 * the user session and initializes the user state on page load. It also contains the
 * Outlet for the application's routing as defined in main.tsx.
 *
 * Contains:
 * - User session initialization
 * - User state initialization
 * - Application routing
 * - Navigation bar
 ========================================================================================= */

import { Auth } from "aws-amplify";
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import styled from "styled-components";
import apiFetch from "../apiFetch";
import { InitializeUserResponse } from "../responseTypes";
import useUser from "../useUser";
import { TaskNotification, UserTask } from "../userType";
import AppContainer from "./AppContainer";
import Spinner from "./LoadingSpinner";
import NavigationBar from "./NavigationBar";

// Styled component for the page container
const PageContainer = styled.div`
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  height: 100vh;
  width: 900px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  color: #00b3ff;
  background: linear-gradient(to top, #d5d5d5, #aac3cf);
  padding: 0;
  margin: 0;
  margin-left: auto;
  margin-right: auto;
  position: relative;
`;

/** =========================================================================================
 * Functional component for the Root
 * 
 * The Root component is the main component for the application. It manages the user session and initializes
 * the user state on page load. It also contains the Outlet for the application's routing as defined in main.tsx.
 ========================================================================================= */
const Root: React.FC = () => {
  // Use the navigate hook from react-router-dom
  const navigate = useNavigate();
  // Use the user hook from useUser
  const { setUser } = useUser();
  // State variable for loading spinner
  const [isLoading, setIsLoading] = useState(false);

  // Function to get the user id and user data from the Cognito token
  const getTokenData = async () => {
    try {
      // Get first name, full name, email, and sub from the Auth session
      const session = await Auth.currentSession();
      const userId = session.getIdToken().payload.sub as string;
      const userData = {
        firstName: session.getIdToken().payload.given_name as string,
        fullName: session.getIdToken().payload.name as string,
        email: session.getIdToken().payload.email as string,
      };
      return { userId, userData };
    } catch (error) {
      console.error("Error getting token data:", error);
      throw error;
    }
  };

  // Function to initialize the user session
  const initializeUserSession = async () => {
    // Show the loading spinner
    setIsLoading(true);
    try {
      // Get the user data from the current session
      const { userId, userData } = await getTokenData();

      /** =========================================================================================
       * Call the initializeUser API endpoint. If the user does not exist, it will be created.
       * If the user does exist, the user data will be returned.
       ========================================================================================= */
      const userResponse = await apiFetch<InitializeUserResponse>("userAccount", "POST", userId);

      // If the user response is defined and contains data, set the user state
      if (userResponse && userResponse.body && userResponse.body.data) {
        // Destructure the user response
        const { userSettings, userTasks, userCategories, taskNotifications } = userResponse.body.data;
        // Use the map function to resolve the tasks and their notifications into a single array
        const resolvedUserTasks = userTasks.map((task: UserTask) => {
          // Filter the notifications to only include the notifications for the current task
          const relatedNotifications = taskNotifications.filter(
            (notification: TaskNotification) => notification.taskId === task.taskId,
          );
          // Return the task with the notifications
          return {
            ...task,
            taskNotifications: relatedNotifications,
          };
        });

        // Set the user state
        setUser({
          userId,
          userAccount: userData,
          userSettings,
          userTasks: resolvedUserTasks,
          userCategories,
        });
        console.log("User state initialized");
      }
    } catch (error) {
      console.error("Error initializing user data:", error);
    }
    // Hide the loading spinner
    setIsLoading(false);
  };

  /** =========================================================================================
   * Initialize the user session on page load if the user is signed in.
   * Otherwise, redirect to the user account page.
   ========================================================================================= */
  useEffect(() => {
    // Function to check if the user is signed in
    const checkUser = async () => {
      try {
        // Get the current authenticated Cognito user
        const user = await Auth.currentAuthenticatedUser();
        if (user) {
          // If the user is signed in, initialize the user session
          initializeUserSession();
        } else {
          // If the user is not signed in, redirect to the user account page
          navigate("/userAccount");
        }
      } catch (error) {
        if (error === "The user is not authenticated") {
          // If the user is not authenticated show "Error checking user" message
          console.error("Error checking user:", error);
          // Redirect to the user account page
          navigate("/userAccount");
        } else {
          // For any other error, show "Error with user initialization" message
          console.error("Error with user initialization:", error);
          // Redirect to the user account page
          navigate("/userAccount");
        }
      }
    };
    // Call the checkUser function
    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Return the JSX for the Root component
  return (
    <AppContainer>
      <PageContainer>
        <NavigationBar />
        {/* If the user is being initialized, show the loading spinner */}
        {isLoading ? (
          <div style={{ marginTop: 10 }}>
            <Spinner />
          </div>
        ) : (
          // Otherwise, show the Outlet for the application's routing
          <Outlet />
        )}
      </PageContainer>
    </AppContainer>
  );
};

export default Root;
