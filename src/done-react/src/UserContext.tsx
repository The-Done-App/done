/** =========================================================================================
 * Filename: UserContext.tsx
 *
 * Description: This file creates a context for the user. This context
 * is used to store all of the data for the users including their tasks,
 * notifications, and settings. It may be accessed globally by any component
 * in the app through the UserProvider component and the useUser hook.
 ========================================================================================= */

import React, { createContext } from "react";
import { User } from "./userType";

// Interface for the properties of the UserContext
interface UserContextProps {
  // The user object which contains all of the user's data
  user: User | null;
  // Function to set the user object
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

// Create the UserContext with the UserContextProps interface
const UserContext = createContext<UserContextProps | undefined>(undefined);

export default UserContext;
