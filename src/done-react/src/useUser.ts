/** =========================================================================================
 * Filename: useUser.ts
 *
 * Description: This file contains the useUser hook, which is used to access the
 * user object stored in the UserContext. It also provides helper functions to
 * access the user's available categories and default notifications.
 ========================================================================================= */

import { useContext } from "react";
import UserContext from "./UserContext";
import { UserCategory, UserSettings } from "./userType";

// useUser is a hook that returns the user object stored in the UserContext
const useUser = () => {
  // Get the UserContext properties from the useContext hook
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }

  // Define a helper function to get the user's available categories
  const getAvailableCategories = (): UserCategory[] => {
    return context.user ? context.user.userCategories : [];
  };

  // Define a helper function to get the user's default notifications
  const getDefaultNotifications = (): UserSettings["defaultNotifications"] => {
    return context.user
      ? context.user.userSettings.defaultNotifications
      : { "5": false, "15": false, "30": false, "45": false, "60": false };
  };

  // Return the user object and helper functions
  return { ...context, getAvailableCategories, getDefaultNotifications };
};

export default useUser;
