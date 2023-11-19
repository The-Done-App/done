/** =========================================================================================
 * Filename: UserSettingsPage.tsx
 *
 * Description: This component provides an interface for the user to customize their settings.
 * The settings include options to toggle display name, time display format, notifications
 * enabled state, and default notification times.
 *
 * Contains:
 * - Display name toggle
 * - Time display toggle
 * - Notifications enabled toggle
 * - Default notification times
 * - Back Button
 ========================================================================================= */

import React, { useState } from "react";
import styled from "styled-components";
import apiFetch from "../apiFetch";
import { UserSettingsResponse } from "../responseTypes";
import useUser from "../useUser";
import { UserSettings } from "../userType";
import AddItemButton from "./AddItemButton";
import BackButton from "./BackButton";
import CheckBox from "./CheckMarkBox";
import Spinner from "./LoadingSpinner";

// Styled component for the overall settings container
const SettingsContainer = styled.div`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

// Styled component for settings groups
const SettingGroup = styled.div`
  display: flex;
  margin-bottom: 2rem;
`;

// Styled component for settings titles
const SettingTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: black;
`;

// Styled component for the notification options
const NotificationOption = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0.5rem 1rem;
`;

// Styled component for notification text
const NotificationText = styled.span`
  color: black;
  margin-bottom: 0.5rem;
`;

// Styled component for selected settings
const selectedStyle = {
  backgroundColor: "#4CAF50",
  color: "white",
  border: "3px solid black",
};

// Functional component for the UserSettingsPage
const UserSettingsPage: React.FC = () => {
  // Custom hook to access and manage the user state which holds all user data
  const { user, setUser } = useUser();
  // State variables for loading spinners
  const [isLoadingDisplayName, setIsLoadingDisplayName] = useState(false);
  const [isLoadingTimeDisplay, setIsLoadingTimeDisplay] = useState(false);
  const [isLoadingNotificationsEnabled, setIsLoadingNotificationsEnabled] = useState(false);
  const [isLoadingDefault5, setIsLoadingDefault5] = useState(false);
  const [isLoadingDefault15, setIsLoadingDefault15] = useState(false);
  const [isLoadingDefault30, setIsLoadingDefault30] = useState(false);
  const [isLoadingDefault45, setIsLoadingDefault45] = useState(false);
  const [isLoadingDefault60, setIsLoadingDefault60] = useState(false);

  // Function to update the user settings (called when toggling any setting)
  const updateUserSettings = async (
    key: string,
    value: string | boolean | UserSettings["defaultNotifications"] | UserSettings["sortMode"],
  ) => {
    try {
      // Make a PATCH request to the API to update the user settings
      await apiFetch<UserSettingsResponse>(
        `userSettings`,
        "PATCH",
        user.userId,
        JSON.stringify({
          [key]: value,
        }),
      );
    } catch (error) {
      console.error("Error updating user settings:", error);
    }
  };

  // Function to toggle the default notification times
  const toggleNotification = async (value: string) => {
    // Use a switch statement to show the correct loading spinner and hide the notification checkbox
    switch (value) {
      case "5":
        setIsLoadingDefault5(true);
        break;
      case "15":
        setIsLoadingDefault15(true);
        break;
      case "30":
        setIsLoadingDefault30(true);
        break;
      case "45":
        setIsLoadingDefault45(true);
        break;
      case "60":
        setIsLoadingDefault60(true);
        break;
    }
    // Update the default notification time in the backend
    await updateUserSettings("defaultNotifications", {
      ...user?.userSettings.defaultNotifications,
      [value]: !user?.userSettings.defaultNotifications[value],
    });

    // Update the user state with the new default notification time
    setUser((prevUser) => {
      return {
        // Use the spread operator to include all previous user data other than the user settings
        ...prevUser,
        userSettings: {
          // Use the spread operator to include all previous user settings other than the default notification times
          ...prevUser.userSettings,
          defaultNotifications: {
            // Use the spread operator to include all previous default notification times
            ...prevUser.userSettings.defaultNotifications,
            // Toggle the seleceted notification time
            [value]: !prevUser.userSettings.defaultNotifications[value],
          },
        },
      };
    });

    // Use a switch statement to hide the correct loading spinner and show the notification checkbox
    switch (value) {
      case "5":
        setIsLoadingDefault5(false);
        break;
      case "15":
        setIsLoadingDefault15(false);
        break;
      case "30":
        setIsLoadingDefault30(false);
        break;
      case "45":
        setIsLoadingDefault45(false);
        break;
      case "60":
        setIsLoadingDefault60(false);
        break;
    }
  };

  // Function to toggle the time display format
  const toggleTimeDisplay = async (twelveHour: boolean) => {
    // Show the loading spinner and hide the time display buttons
    setIsLoadingTimeDisplay(true);
    // Update the time display format in the backend
    await updateUserSettings("twelveHour", !user?.userSettings.twelveHour);

    // Update the user state with the new time display format
    setUser((prevUser) => ({
      // Use the spread operator to include all previous user data other than the user settings
      ...prevUser,
      userSettings: {
        // Use the spread operator to include all previous user settings other than the time display format
        ...prevUser.userSettings,
        // Set the new time display format
        twelveHour,
      },
    }));
    // Hide the loading spinner and show the time display button
    setIsLoadingTimeDisplay(false);
  };

  // Function to toggle the notifications enabled state
  const toggleNotificationsEnabled = async (enableNotifications: boolean) => {
    // Show the loading spinner and hide the notifications enabled buttons
    setIsLoadingNotificationsEnabled(true);
    // Update the notifications enabled state in the backend
    await updateUserSettings("enableNotifications", !user?.userSettings.enableNotifications);

    // Update the user state with the new notifications enabled state
    setUser((prevUser) => ({
      // Use the spread operator to include all previous user data other than the user settings
      ...prevUser,
      userSettings: {
        // Use the spread operator to include all previous user settings other than the notifications enabled state
        ...prevUser.userSettings,
        // Set the new notifications enabled state
        enableNotifications,
      },
    }));
    // Hide the loading spinner and show the notifications enabled button
    setIsLoadingNotificationsEnabled(false);
  };

  // Function to toggle the display name
  const toggleDisplayName = async (displayEmail: boolean) => {
    // Show the loading spinner and hide the display name buttons
    setIsLoadingDisplayName(true);
    // Update the display name in the backend
    await updateUserSettings("displayEmail", !user?.userSettings.displayEmail);

    // Update the user state with the new display name
    setUser((prevUser) => ({
      // Use the spread operator to include all previous user data other than the user settings
      ...prevUser,
      userSettings: {
        // Use the spread operator to include all previous user settings other than the display name
        ...prevUser.userSettings,
        // Set the new display name setting
        displayEmail,
      },
    }));
    // Hide the loading spinner and show the display name button
    setIsLoadingDisplayName(false);
  };

  // Return the JSX elements to be rendered
  return (
    <>
      <SettingsContainer>
        <BackButton style={{ position: "absolute", left: 100 }} />
        <SettingTitle>Display Name</SettingTitle>
        <SettingGroup>
          {/* Conditionally render the loading spinner or the display name buttons */}
          {isLoadingDisplayName ? (
            <Spinner />
          ) : (
            <>
              <AddItemButton
                style={user?.userSettings.displayEmail ? null : selectedStyle}
                label="First Name"
                onClick={() => toggleDisplayName(false)}
              />
              <AddItemButton
                style={user?.userSettings.displayEmail ? selectedStyle : null}
                label="Email"
                onClick={() => toggleDisplayName(true)}
              />
            </>
          )}
        </SettingGroup>

        <SettingTitle>Time Display</SettingTitle>
        <SettingGroup>
          {/* Conditionally render the loading spinner or the time display buttons */}
          {isLoadingTimeDisplay ? (
            <Spinner />
          ) : (
            <>
              <AddItemButton
                style={user?.userSettings.twelveHour ? selectedStyle : null}
                label="12-hr"
                onClick={() => toggleTimeDisplay(true)}
              />
              <AddItemButton
                style={!user?.userSettings.twelveHour ? selectedStyle : null}
                label="24-hr"
                onClick={() => toggleTimeDisplay(false)}
              />
            </>
          )}
        </SettingGroup>

        <SettingTitle>Notifications Enabled</SettingTitle>
        <SettingGroup>
          {/* Conditionally render the loading spinner or the notifications enabled buttons */}
          {isLoadingNotificationsEnabled ? (
            <Spinner />
          ) : (
            <>
              <AddItemButton
                style={user?.userSettings.enableNotifications ? selectedStyle : null}
                label="Yes"
                onClick={() => toggleNotificationsEnabled(true)}
                disabled={isLoadingNotificationsEnabled}
              />
              <AddItemButton
                style={!user?.userSettings.enableNotifications ? selectedStyle : null}
                label="No"
                onClick={() => toggleNotificationsEnabled(false)}
              />
            </>
          )}
        </SettingGroup>

        <SettingTitle>Default Notifications</SettingTitle>
        <SettingGroup>
          {/* Map over the default notification times and render the loading spinner or the notification checkbox */}
          {Object.keys(user?.userSettings.defaultNotifications || {}).map((time) => (
            <NotificationOption key={time}>
              <NotificationText>{time} minutes</NotificationText>
              {(() => {
                switch (time) {
                  case "5":
                    return isLoadingDefault5 ? (
                      <Spinner />
                    ) : (
                      <CheckBox
                        isComplete={!!user?.userSettings.defaultNotifications[time]}
                        onClick={() => toggleNotification(time)}
                      />
                    );
                  case "15":
                    return isLoadingDefault15 ? (
                      <Spinner />
                    ) : (
                      <CheckBox
                        isComplete={!!user?.userSettings.defaultNotifications[time]}
                        onClick={() => toggleNotification(time)}
                      />
                    );
                  case "30":
                    return isLoadingDefault30 ? (
                      <Spinner />
                    ) : (
                      <CheckBox
                        isComplete={!!user?.userSettings.defaultNotifications[time]}
                        onClick={() => toggleNotification(time)}
                      />
                    );
                  case "45":
                    return isLoadingDefault45 ? (
                      <Spinner />
                    ) : (
                      <CheckBox
                        isComplete={!!user?.userSettings.defaultNotifications[time]}
                        onClick={() => toggleNotification(time)}
                      />
                    );
                  case "60":
                    return isLoadingDefault60 ? (
                      <Spinner />
                    ) : (
                      <CheckBox
                        isComplete={!!user?.userSettings.defaultNotifications[time]}
                        onClick={() => toggleNotification(time)}
                      />
                    );
                  default:
                    return null;
                }
              })()}
            </NotificationOption>
          ))}
        </SettingGroup>

        {/* If the app is in development mode, display a button to show the user data for debugging */}
        {process.env.NODE_ENV === "development" && (
          <AddItemButton label="Show User" onClick={() => console.log(user)} />
        )}
      </SettingsContainer>
    </>
  );
};

export default UserSettingsPage;
