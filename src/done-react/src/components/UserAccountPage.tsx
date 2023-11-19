/** =========================================================================================
 * Filename: UserAccountPage.tsx
 *
 * Description: This component displays the user's account information and
 * allows them to sign out or delete their account. When signed out or not
 * authenticated, the component prompts for sign-in through Google.
 *
 * Contains:
 * - User's name and email display
 * - Sign Out button
 * - Delete Account button with a confirmation modal
 * - Google Sign-In button for authentication
 ========================================================================================= */

import { CognitoHostedUIIdentityProvider } from "@aws-amplify/auth";
import { Auth } from "aws-amplify";
import { useState } from "react";
import styled from "styled-components";
import apiFetch from "../apiFetch";
import { DeleteResponse } from "../responseTypes";
import useUser from "../useUser";
import AddItemButton from "./AddItemButton";
import BackButton from "./BackButton";
import ConfirmationModal from "./ConfirmationModal";
import GoogleLogo from "./GoogleLogo";
import GoogleSignInButton from "./GoogleSignInButton";
import Spinner from "./LoadingSpinner";

// Styled component for the page container
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  font-size: 2rem;
`;

// Styled component for the welcome container (user not signed in)
const WelcomeContainer = styled.div`
  text-align: center;
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

// Styled component for the welcome title (user not signed in)
const WelcomeTitle = styled.h2`
  color: #333;
  font-size: 3rem;
  margin-bottom: 1rem;
`;

// Styled component for the welcome text (user not signed in)
const WelcomeText = styled.p`
  color: #666;
  font-size: 1.5rem;
`;

// Styled component for the info container
const InfoContainer = styled.div`
  margin: 1rem;
`;

// Styled component for the logo container
const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

// Functional component for the UserAccountPage
const UserAccountPage: React.FC = () => {
  // Custom hook to access and manage the user state which holds all user data
  const { user } = useUser();
  // State variable for the confirmation modal
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  // State variables for loading spinners
  const [isLoadingSignOut, setIsLoadingSignOut] = useState(false);
  const [isLoadingDeleteAccount, setIsLoadingDeleteAccount] = useState(false);

  // Function to handle signing out
  const handleSignOut = async () => {
    // Show the loading spinner and hide the sign out button
    setIsLoadingSignOut(true);
    console.log("Sign out");
    // Sign the user out using the Amplify Auth API
    await Auth.signOut();
    // Hide the loading spinner and show the sign out button
    setIsLoadingSignOut(false);
  };

  // Function to handle clicking the delete account button
  const handleDeleteAccount = () => {
    // Show the confirmation modal
    setShowConfirmationModal(true);
  };

  // Function to handle confirming the account deletion
  const handleConfirm = async () => {
    // Show the loading spinner and hide the delete account button
    setIsLoadingDeleteAccount(true);
    // Hide the confirmation modal
    setShowConfirmationModal(false);
    try {
      // Make a DELETE request to the API to delete all user account data
      await apiFetch<DeleteResponse>("userAccount", "DELETE", user.userId);

      // If there is no error, log a success message
      console.log("Account deleted successfully");

      // Log the user out after deleting their account
      await Auth.signOut();
    } catch (error) {
      console.error("Error deleting account", error);
    }
    // Hide the loading spinner and show the delete account button
    setIsLoadingDeleteAccount(false);
  };

  // Function to handle cancelling the account deletion
  const handleCancel = () => {
    // Hide the confirmation modal
    setShowConfirmationModal(false);
  };

  // Return the JSX elements for rendering the page
  return (
    <Container>
      {/* If the user is signed in, display their account information */}
      {user ? (
        <>
          <BackButton style={{ position: "relative", right: 300 }} />
          <LogoContainer>
            <span style={{ color: "black" }}>Logged in with:</span>
            <GoogleLogo />
          </LogoContainer>
          <InfoContainer>
            <div style={{ color: "black" }}>Name: {user.userAccount.fullName}</div>
            <div style={{ color: "black" }}>Email: {user.userAccount.email}</div>
          </InfoContainer>
          <div style={{ display: "flex" }}>
            {/* If the user is signing out or deleting their account, display a loading spinner */}
            {isLoadingSignOut || isLoadingDeleteAccount ? (
              <Spinner />
            ) : (
              <>
                <AddItemButton label="Sign Out" onClick={handleSignOut} />
                <AddItemButton label="Delete Account" onClick={handleDeleteAccount} />
              </>
            )}
          </div>
          {/* If the user clicks the delete account button, display the confirmation modal */}
          {showConfirmationModal && (
            <ConfirmationModal
              title="Delete Account"
              message="Are you sure you want to do this? This will delete all tasks and settings from the database. These CANNOT be recovered."
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              onClick={(e) => e.stopPropagation()}
              style={{ color: "red", fontSize: "1rem" }}
            />
          )}
        </>
      ) : (
        // If the user is not signed in, display the welcome message and Google Sign-In button
        <WelcomeContainer>
          <WelcomeTitle>Welcome to Done!</WelcomeTitle>
          <WelcomeText>Done is your go-to to-do app.</WelcomeText>
          <GoogleSignInButton
            label="Sign In With Google"
            // Use the Amplify Auth API to sign in with Google using the Cognito Identity Provider
            onClick={() => Auth.federatedSignIn({ provider: CognitoHostedUIIdentityProvider.Google })}
          />
        </WelcomeContainer>
      )}
    </Container>
  );
};

export default UserAccountPage;
