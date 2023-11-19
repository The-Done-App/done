/** =========================================================================================
 * Filename: SortBar.tsx
 *
 * Description: This component displays a bar with buttons to sort the user's tasks.
 * Tasks can be sorted by category (default) or by date.
 *
 * Contains:
 * - Sort by category button
 * - Sort by date button
 ========================================================================================= */

import { Auth } from "aws-amplify";
import React from "react";
import styled from "styled-components";
import useUser from "../useUser";

// Styled component for the header bar
const Header = styled.div`
  position: sticky;
  top: 0;
  background-color: #f5f5f5;
  z-index: 900;
  display: flex;
  width: 100%;
  padding-top: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #00b3ff;
`;

// Styled component for the selector buttons
const SelectorButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #00b3ff;
  color: white;
  border: 1px solid #000000;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-left: 1rem;

  &:hover {
    background-color: #0087cc;
  }
`;

// Styled component for the sort text
const SortText = styled.p`
  font-size: 1.5rem;
  font-weight: bold;
  padding: 0;
  margin: 0;
  margin-left: 1rem;
`;

// Functional component for the SortBar
const SortBar: React.FC = () => {
  // Use the useUser hook to access the user data
  const { user, setUser } = useUser();

  // Return the JSX for the SortBar
  return (
    <Header>
      <SortText>Sort:</SortText>
      {/* Selector button for sorting tasks category */}
      <SelectorButton
        onClick={() =>
          setUser((prevUser) => ({ ...prevUser, userSettings: { ...prevUser.userSettings, sortMode: "category" } }))
        }
      >
        By Category
      </SelectorButton>

      {/* Selector button for sorting tasks by date */}
      <SelectorButton
        onClick={() =>
          setUser((prevUser) => ({ ...prevUser, userSettings: { ...prevUser.userSettings, sortMode: "date" } }))
        }
      >
        By Date
      </SelectorButton>

      {/* If the app is in development mode, display a button to show the user data for debugging */}
      {import.meta.env.VITE_NODE_ENV === "development" && (
        <SelectorButton
          onClick={async () => {
            console.log("Auth:", await Auth.currentSession());
            console.log("User:", user);
          }}
        >
          Show User
        </SelectorButton>
      )}
    </Header>
  );
};

export default SortBar;
