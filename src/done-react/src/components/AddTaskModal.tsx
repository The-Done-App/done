/** =========================================================================================
 * Filename: AddTaskModal.tsx
 *
 * Description: This component displays a modal for adding a new task.
 *
 * Contains:
 * - Field for task title
 * - Field for task notes
 * - Field for task due date
 * - Field for task time
 * - Field for task category
 * - Add button
 * - Cancel button
 ========================================================================================= */

import React, { useState } from "react";
import styled from "styled-components";
import validator from "validator";
import useUser from "../useUser";
import { UserSettings } from "../userType";
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

// Styled select dropdown field with specific styles applied
const StyledSelect = styled.select`
  width: 100%;
  padding: 8px;
  margin-top: 4px;
`;

// TypeScript interface to define props for the AddTaskModal component
interface AddTaskModalProps {
  onClose: () => void;
  onAddTask: (
    taskTitle: string,
    taskNotes: string,
    taskDueDate: number,
    taskCategory: string,
    defaultNotifications: UserSettings["defaultNotifications"],
  ) => void;
}

// Functional component for the AddTaskModal with destructured props
const AddTaskModal: React.FC<AddTaskModalProps> = ({ onClose, onAddTask }) => {
  // Get the available categories and default notifications from the user context
  const { getAvailableCategories, getDefaultNotifications } = useUser();
  const categories = getAvailableCategories();

  // State variables for the task title, notes, due date, time, category, and error message
  const [taskTitle, setTaskTitle] = useState("");
  const [taskNotes, setTaskNotes] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [taskTime, setTaskTime] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Validation and submission of the form
  const handleSubmit = () => {
    setError(null);

    // Validate task title for alphanumeric and length constraints
    if (
      !validator.isAlphanumeric(validator.blacklist(taskTitle, " ")) ||
      taskTitle.length > 100 ||
      taskTitle.length < 3
    ) {
      setError(
        "Invalid task title. Only alphanumeric characters are allowed and the length should be between 3 and 100 characters.",
      );
      return;
    }

    // Validate task notes for alphanumeric and length constraints
    if (
      taskNotes.length > 0 &&
      (!validator.isAlphanumeric(validator.blacklist(taskNotes, " ")) || taskNotes.length > 500)
    ) {
      setError("Invalid task notes. Only alphanumeric characters are allowed and the limit is 500 characters.");
      return;
    }

    // Sanitize the task title and notes to prevent XSS attacks
    const sanitizedTaskTitle = validator.escape(taskTitle);
    const sanitizedTaskNotes = validator.escape(taskNotes);

    // Calculate task due date in milliseconds
    let taskDueDate: number = 0;
    if (taskDate || taskTime) {
      taskDueDate = new Date(`${taskDate || "1970-01-01"}T${taskTime || "00:00:00"}`).getTime();
    }

    // Check for past dates before 1970
    if (taskDueDate < 0) {
      setError("Due dates cannot be set before 1970.");
      return;
    }

    // Retrieve default notifications from user settings
    const defaultNotifications = getDefaultNotifications();

    // Invoke the onAddTask prop function with the sanitized task details
    onAddTask(sanitizedTaskTitle, sanitizedTaskNotes, taskDueDate, categoryId, defaultNotifications);
    // Close the modal
    onClose();
  };

  // Return the JSX elements to be rendered
  return (
    <ModalBackgroundDiv>
      <ModalContentDiv>
        <h2>Add New Task</h2>
        {/* Display error message if there is one */}
        {error && <div style={{ color: "red" }}>{error}</div>}
        <FieldDiv>
          <label>
            Title{" "}
            <span style={{ color: "red" }} title="This field is required.">
              *
            </span>
          </label>
          <StyledInput type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
        </FieldDiv>
        <FieldDiv>
          <label>Notes</label>
          <StyledInput type="text" value={taskNotes} onChange={(e) => setTaskNotes(e.target.value)} />
        </FieldDiv>
        <FieldDiv>
          <label>Due Date</label>
          <StyledInput type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} />
        </FieldDiv>
        <FieldDiv>
          <label>Time</label>
          <StyledInput type="time" value={taskTime} onChange={(e) => setTaskTime(e.target.value)} />
        </FieldDiv>
        {/* Conditional rendering for the category field with the available categories */}
        {categories.length > 0 && (
          <FieldDiv>
            <label>Category</label>
            <StyledSelect value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">--</option>
              {categories.map((category) => (
                <option key={category.categoryId} value={category.categoryId}>
                  {category.categoryName}
                </option>
              ))}
            </StyledSelect>
          </FieldDiv>
        )}
        <div style={{ display: "flex" }}>
          <AddItemButton label="Add" onClick={handleSubmit} />
          <AddItemButton label="Cancel" onClick={onClose} />
        </div>
      </ModalContentDiv>
    </ModalBackgroundDiv>
  );
};

export default AddTaskModal;
