/**
 * Filename: GoogleSignInButton.tsx
 *
 * Description: This component displays a button for signing in with Google.
 *
 * Contains:
 * - Google Sign-In button
 */

import React from "react";
import styled from "styled-components";
import GoogleLogo from "./GoogleLogo";

// Styled component for the button's container with various CSS properties
const GoogleButtonContainer = styled.button`
  display: flex;
  align-items: center;
  background-color: #eee;
  color: #1a1a1a;
  border: 2px solid #000000;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  margin: 5px;
  margin-left: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease-in-out;

  &:hover {
    background-color: #a1e1ff;
  }
`;

// Styled component for the icon's container, displayed next to the button label
const IconContainer = styled.div`
  margin-right: 8px;
  font-size: 20px;
`;

// Type definition for the props that the GoogleSignInButton component will accept
interface GoogleButtonProps {
  label: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  style?: React.CSSProperties;
  disabled?: boolean;
}

// Functional component for the GoogleSignInButton
const GoogleSignInButton: React.FC<GoogleButtonProps> = ({ onClick, style, disabled = false }) => (
  <GoogleButtonContainer style={style} onClick={onClick} disabled={disabled}>
    <IconContainer>
      <GoogleLogo width="30" height="30" />
    </IconContainer>
    {"Sign in with Google"}
  </GoogleButtonContainer>
);

export default GoogleSignInButton;
