/** =========================================================================================
 * Filename: ChangeDueDateModal.tsx
 *
 * Description: This component displays a modal that allows the
 * user to change the due date of a task.
 *
 * Contains:
 * - Change Due Date modal
 * - Date Selector
 * - Time Selector
 ========================================================================================= */

import React, { useState } from "react";
import styled from "styled-components";

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
`;

// Styled component for the modal's content area
const ModalContentDiv = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 300px;
`;

// Styled component for the individual input fields within the modal
const FieldDiv = styled.div`
  margin-bottom: 16px;
  margin-right: 16px;
`;

// Styled input field with specific styles applied
const StyledInput = styled.input`
  width: 100%;
  padding: 8px;
  margin-top: 4px;
`;

// TypeScript interface to define props for the ChangeDueDateModal component
interface ChangeDueDateModalProps {
  currentDueDate: number;
  onClose: () => void;
  onSave: (newDueDate: number) => void;
}

// Functional component for the ChangeDueDateModal
const ChangeDueDateModal: React.FC<ChangeDueDateModalProps> = ({ currentDueDate, onClose, onSave }) => {
  // State variables for the date, time, and error message
  const [taskDate, setTaskDate] = useState(() => new Date(currentDueDate).toISOString().substring(0, 10));
  const [taskTime, setTaskTime] = useState(() => new Date(currentDueDate).toTimeString().substring(0, 5));
  const [error, setError] = useState<string | null>(null);

  // Function to handle the submission of the new due date
  const handleSubmit = () => {
    setError(null);
    const datePart = taskDate || "1970-01-01";
    const timePart = taskTime || "00:00:00";
    const newDueDate = new Date(`${datePart}T${timePart}`).getTime();

    // Validate due date is not before 1970
    if (newDueDate < 0) {
      setError("Due dates cannot be set before 1970.");
      return;
    }
    if (newDueDate >= 0) {
      // Call the onSave prop function and close the modal
      onSave(newDueDate);
      onClose();
    }
  };

  // Return the JSX elements to be rendered
  return (
    <ModalBackgroundDiv>
      <ModalContentDiv>
        <h2>Change Due Date</h2>
        {/* Display the error message if there is one */}
        {error && <div style={{ color: "red" }}>{error}</div>}
        <FieldDiv>
          <label>Date:</label>
          <StyledInput type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} />
        </FieldDiv>
        <FieldDiv>
          <label>Time:</label>
          <StyledInput type="time" value={taskTime} onChange={(e) => setTaskTime(e.target.value)} />
        </FieldDiv>
        <button onClick={handleSubmit}>Save</button>
        <button onClick={onClose}>Cancel</button>
      </ModalContentDiv>
    </ModalBackgroundDiv>
  );
};

export default ChangeDueDateModal;
