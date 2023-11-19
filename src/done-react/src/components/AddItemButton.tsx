/** =========================================================================================
 * Filename: AddItemButton.tsx
 *
 * Description: This component displays a button for adding a new task, category, or notification.
 *
 * Contains:
 * - Button
========================================================================================= */

import React from "react";
import { MdAddTask, MdNotificationAdd, MdPlaylistAdd } from "react-icons/md";
import styled from "styled-components";

// Styled component for the button's container with various CSS properties
const ButtonContainer = styled.button`
  display: flex;
  align-items: center;
  background-color: #00b3ff;
  color: white;
  border: 2px solid #000000;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  margin: 5px;
  margin-left: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease-in-out;

  &:hover {
    background-color: #008dcf;
  }
`;

// Styled component for the icon's container, displayed next to the button label
const IconContainer = styled.div`
  margin-right: 8px;
  font-size: 20px;
`;

// Interface for the props that the AddItemButton component will accept
interface AddItemButtonProps {
  label: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  style?: React.CSSProperties;
  disabled?: boolean;
}

// Functional component for the AddItemButton
const AddItemButton: React.FC<AddItemButtonProps> = ({ label, onClick, style, disabled = false }) => (
  <ButtonContainer style={style} onClick={onClick} disabled={disabled}>
    {/* Conditional rendering for icons based on the button's label */}
    {label === "Add Task" || label === "Add Category" || label === "Add Notification" ? (
      <IconContainer>
        {/* Select and render the appropriate icon based on the label */}
        {label === "Add Task" && <MdAddTask />}
        {label === "Add Category" && <MdPlaylistAdd />}
        {label === "Add Notification" && <MdNotificationAdd />}
      </IconContainer>
    ) : null}
    {/* Button label text */}
    {label}
  </ButtonContainer>
);

export default AddItemButton;
