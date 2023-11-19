/** =========================================================================================
 * Filename: NavigationBar.tsx
 *
 * Description: This component displays the navigation bar at the top of the page.
 *
 * Contains:
 * - Done Logo (Home Button)
 * - Current time
 * - Profile link
 ========================================================================================= */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import useUser from "../useUser";

// Styled component for the navigation bar
const StyledNav = styled.nav`
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  position: sticky;
  height: 71px;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 1rem 2rem;
  background-color: #333;
  box-sizing: border-box;
  z-index: 1000;
`;

// Styled component for the Done logo when set as a link
const DoneLink = styled(Link)`
  color: #fff;
  text-decoration: none;
  transition: color 0.3s ease;

  background: linear-gradient(45deg, #00c9b5, #008be1);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 2rem;
  font-weight: bold;
  text-shadow: 0 2px 2px rgba(0, 0, 0, 0.3);

  &:hover {
    background-color: #555;
  }
`;

// Styled component for the Done logo
const Done = styled.span`
  color: #fff;
  text-decoration: none;
  transition: color 0.3s ease;

  background: linear-gradient(45deg, #00c9b5, #008be1);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 2rem;
  font-weight: bold;
  text-shadow: 0 2px 2px rgba(0, 0, 0, 0.3);
`;

// Styled component for the profile link
const ProfileLink = styled(Link)`
  color: #00d0ff;
  text-decoration: none;
  transition: border-color 0.3s ease;
  border-bottom: 2px solid transparent;
  &:hover {
    border-color: #fff;
  }
  font-size: 1.5rem;
  font-weight: bold;
`;

// Styled component for the current time
const TimeText = styled.span`
  margin-left: 15px;
  color: #fff;
  font-size: 1.5rem;
  font-weight: bold;
`;

// Functional component for the NavigationBar
const NavigationBar: React.FC = () => {
  // Use the useUser hook to get the current user data
  const { user } = useUser();
  // State variable for the current time
  const [currentTime, setCurrentTime] = useState<string>("");

  // Update the current time on either:
  // * Mounting of the component
  // * Change of the user's time settings
  // * 1 second intervals
  useEffect(
    () => {
      const updateCurrentTime = () => {
        // Get the current time
        const date = new Date();
        // Set options to format the time based on the user's time settings
        const options: Intl.DateTimeFormatOptions = user?.userSettings.twelveHour
          ? { hour: "numeric", minute: "2-digit", hour12: true }
          : { hour: "numeric", minute: "2-digit", hour12: false };

        // Format the time
        let time = date.toLocaleTimeString("en-US", options).toUpperCase();

        // If the user is using 24-hour time, convert 24:00 to 00:00
        if (!user?.userSettings.twelveHour && time.startsWith("24:")) {
          time = "00:" + time.slice(3);
        }

        // Update the current time state variable
        setCurrentTime(time);
      };

      // Update the current time every second
      updateCurrentTime();
      // Set an interval to update the current time every second
      const timerId = setInterval(updateCurrentTime, 1000);

      // Return a cleanup function to clear the interval when the component unmounts
      return () => {
        clearInterval(timerId);
      };
    },
    [user?.userSettings.twelveHour] /* Set the dependencies for the useEffect hook */,
  );

  // Conditionally render the display name based on the user's display email setting
  let displayName: string;
  if (user) {
    displayName = user.userSettings.displayEmail ? user.userAccount.email : user.userAccount.firstName;
  } else {
    displayName = "Account";
  }

  // Return the JSX for the NavigationBar
  return (
    <StyledNav>
      <div>
        {/* If the user is not defined, do not link the Done logo to the home page */}
        {!user ? <Done>Done</Done> : <DoneLink to="/">Done</DoneLink>}
        <TimeText>{currentTime}</TimeText>
      </div>
      {/* Link to the user account page */}
      <ProfileLink to={"/userAccount"}>{displayName}</ProfileLink>
    </StyledNav>
  );
};

export default NavigationBar;
