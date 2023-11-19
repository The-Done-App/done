/** =========================================================================================
 * Filename: AddNotificationModal.tsx
 *
 * Description: This component provides a modal for adding a notification.
 *
 * Contains:
 * - Field for reminder time
 * - Add button
 * - Cancel button
========================================================================================= */

import React, { useState } from "react";
import styled from "styled-components";
import AddItemButton from "./AddItemButton";

// Styled component for the modal background with a semi-transparent overlay
const ModalBackground = styled.div`
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

// Styled component for the modal content box
const ModalContent = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 300px;
`;

// Styled component for the individual fields within the modal/form
const Field = styled.div`
  margin-bottom: 16px;
`;

// Styled component for the select dropdown field
const StyledSelect = styled.select`
  width: 100%;
  padding: 8px;
  margin-top: 4px;
`;

// Properties type definition for the AddNotificationModal component.
// These are passed in by the parent component.
interface AddNotificationModalProps {
  onClose: () => void;
  onAddNotification: (taskId: string, reminderTime: number, existingReminders: number[]) => void;
  taskId: string;
  existingReminders: number[];
}

// Functional component definition for AddNotificationModal with destructured props
const AddNotificationModal: React.FC<AddNotificationModalProps> = ({
  onClose,
  onAddNotification,
  taskId,
  existingReminders,
}) => {
  // State variables for the reminder time
  const [reminderTime, setReminderTime] = useState<string>("");

  // Array of allowed reminder times
  const allowedReminders = [5, 15, 30, 45, 60];

  // Filter the allowed reminder times to only include those that are not already set
  const availableReminders = allowedReminders.filter((time) => !existingReminders.includes(time));

  // Handler for the Add button, which invokes the onAddNotification prop function
  const handleAddNotification = () => {
    // If the reminder time is not set, return
    if (!reminderTime) return;
    // Convert the reminder time to an integer
    const reminderTimeInMinutes = parseInt(reminderTime, 10);
    // If the reminder time is not a number or is less than or equal to 0, return
    if (isNaN(reminderTimeInMinutes) || reminderTimeInMinutes <= 0) return;
    // Invoke the onAddNotification prop function
    onAddNotification(taskId, reminderTimeInMinutes, existingReminders);
    // Close the modal
    onClose();
  };

  // Return the JSX elements to be rendered
  return (
    <ModalBackground>
      <ModalContent>
        <h2>Add Notification</h2>
        <Field>
          <label>Reminder Time (minutes before due)</label>
          {/* Select dropdown for the reminder time */}
          <StyledSelect onChange={(e) => setReminderTime(e.target.value)}>
            <option value="">Select Time</option>
            {/* Only display the available reminder times */}
            {availableReminders.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </StyledSelect>
        </Field>
        <div style={{ display: "flex" }}>
          <AddItemButton label="Add" onClick={handleAddNotification} />
          <AddItemButton label="Cancel" onClick={onClose} />
        </div>
      </ModalContent>
    </ModalBackground>
  );
};

export default AddNotificationModal;
