/** =========================================================================================
 * Filename: ConfirmationModal.tsx
 *
 * Description: This component displays a confirmation modal. It is used when
 * the user wants to delete an item or their account to confirm that they
 * actually want to do so.
 *
 * Contains:
 * - Confirmation modal
 ========================================================================================= */

import React from "react";
import styled from "styled-components";
import AddItemButton from "./AddItemButton";

// Styled component for the modal's background overlay
const ModalBackgroundDiv = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: default;
`;

// Styled component for the modal's content area
const ModalContentDiv = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 300px;
`;

// TypeScript interface to define props for the ConfirmationModal component
interface ConfirmationModalProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  onClick: React.MouseEventHandler<HTMLDivElement>;
}

// Functional component for the ConfirmationModal with destructured props
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
  onClick,
  ...props
}) => {
  return (
    <ModalBackgroundDiv {...props} onClick={onClick}>
      <ModalContentDiv>
        <h2>{title}</h2>
        <p>{message}</p>
        <div style={{ display: "flex" }}>
          <AddItemButton
            label="Confirm"
            onClick={onConfirm}
            style={{ backgroundColor: "#bbb", borderColor: "#555", color: "#222" }}
          />
          <AddItemButton label="Cancel" onClick={onCancel} style={{}} />
        </div>
      </ModalContentDiv>
    </ModalBackgroundDiv>
  );
};

export default ConfirmationModal;
