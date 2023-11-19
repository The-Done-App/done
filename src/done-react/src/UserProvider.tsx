/** =========================================================================================
 * Filename: UserProvider.tsx
 *
 * Description: This file creates a context for the user as defined in
 * UserContext.tsx.
 ========================================================================================= */

import React, { ReactNode, useState } from "react";
import UserContext from "./UserContext";
import { User } from "./userType";

// Interface for the properties of the UserProvider
interface UserProviderProps {
  children: ReactNode;
}

// Functional component for the UserProvider which provides the user context to all components in the app
const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  // State variable for the user object
  const [user, setUser] = useState<User | null>(null);

  // Return the UserContext.Provider with the user and setUser values
  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
};

export default UserProvider;
