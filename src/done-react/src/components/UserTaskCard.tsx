/** =========================================================================================
 * Filename: UserTaskCard.tsx
 *
 * Description: This component displays a single task in a card format with interactive
 * elements to manage the task. Clicking on the card will navigate to the UserTaskPage.
 *
 * Contains:
 * - Checkbox for task completion
 * - Task title
 * - Task due date and time
 * - Buttons for editing, deleting, and setting notifications for the task
  ========================================================================================= */

import React, { useState } from "react";
import { MdDelete, MdEdit, MdNotifications } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import apiFetch from "../apiFetch";
import { UserTaskResponse } from "../responseTypes";
import useUser from "../useUser";
import CheckBox from "./CheckMarkBox";
import Spinner from "./LoadingSpinner";

// Styled component for the task card
const Card = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 2px solid #9d9d9d;
  margin: 1rem;
  background-color: white;
  background: linear-gradient(135deg, #f9f9f9, #e9e9e9);
  box-shadow:
    0 3px 3px rgba(0, 0, 0, 0.16),
    0 3px 3px rgba(0, 0, 0, 0.23);
  transition: all 0.2s;
  cursor: pointer;
  z-index: -1;

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 4px 8px rgba(0, 0, 0, 0.16),
      0 6px 10px rgba(0, 0, 0, 0.23);
  }
`;

// Styled component for the task due date
const DueDate = styled.h3`
  font-size: 0.9rem;
  color: #999;
  white-space: pre-wrap;
  margin-right: 10px;
  text-align: center;
`;

// Styled component for the task title
const Title = styled.h2`
  flex: 1;
  margin: 0 0rem;
`;

// Styled component for the task title input
const InputTitle = styled.input`
  flex: 1;
  margin: 0 1rem;
  font-size: 1.5rem;
  border: none;
  outline: none;
  background-color: transparent;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  font-weight: bold;
  color: #00b3ff;
`;

// Styled component for the button group (edit, delete, notifications)
const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

// Styled component for the notification button
const NotificationButton = styled.button`
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 2px;
  color: white;
  background-color: #ffb700;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #e09c00;
  }
`;

// Styled component for the edit button
const EditButton = styled.button`
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 2px;
  color: white;
  background-color: #00b3ff;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #008ac9;
  }
`;

// Styled component for the delete button
const DeleteButton = styled.button`
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 2px;
  color: white;
  background-color: #ff4f4f;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #e04040;
  }
`;

// Interface for the props that the UserTaskCard component will accept
interface UserTaskCardProps {
  taskId: string;
  taskDueDate: number;
  taskTitle: string;
  taskCompleted: boolean;
  twelveHour: boolean;
  onDeleteClick: (taskId: string, taskTitle: string) => void;
}

// Functional component for the UserTaskCard with destructured props
const UserTaskCard: React.FC<UserTaskCardProps> = ({
  onDeleteClick,
  taskDueDate,
  taskTitle,
  taskCompleted,
  taskId,
  twelveHour,
}) => {
  // Use the useUser hook to access the user data
  const { user, setUser } = useUser();
  // Use the useNavigate hook to navigate to other pages
  const navigate = useNavigate();
  // State variables for editing the task title
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(taskTitle);
  // State variables for loading spinners
  const [isLoadingTitleUpdate, setIsLoadingTitleUpdate] = useState(false);
  const [isLoadingTaskCompletedUpdate, setIsLoadingTaskCompletedUpdate] = useState(false);

  // Function to format the date and time
  const formatDate = (date: number, twelveHour: boolean): string => {
    const optionsDate: Intl.DateTimeFormatOptions = {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      weekday: "long",
    };

    // Set the time options based on the twelveHour user setting
    const optionsTime: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: twelveHour,
    };

    // Format the date and time using the options
    const formattedDate = new Intl.DateTimeFormat("default", optionsDate).format(new Date(date));
    let formattedTime = new Intl.DateTimeFormat("default", optionsTime).format(new Date(date));

    // If the user setting is twelveHour and the time starts with "24:", change it to "00:"
    if (!twelveHour && formattedTime.startsWith("24:")) {
      formattedTime = "00:" + formattedTime.slice(3);
    }
    return `${formattedDate}, ${formattedTime}`;
  };

  // Function to toggle the task completion status
  const toggleTaskCompleted = async (e: React.MouseEvent, isComplete: boolean) => {
    // Prevent the card from navigating to the UserTaskPage when clicking the checkbox
    // (This is necessary because the checkbox is contained within the card)
    e.stopPropagation();
    // Show the loading spinner and hide the checkbox
    setIsLoadingTaskCompletedUpdate(true);
    try {
      // Make a PATCH request to the API to update the task completion status
      const response = await apiFetch<UserTaskResponse>(
        "userTask",
        "PATCH",
        user.userId,
        JSON.stringify({
          taskCompleted: isComplete,
        }),
        [{ key: "taskId", value: taskId }],
      );
      // Log the response message to the browser console
      console.log(response.body.message);
      // Update the user state with the updated task data
      setUser((prevUser) => {
        // Map through the user tasks and update the task with the matching task ID
        const updatedTasks = prevUser.userTasks.map((task) => {
          if (task.taskId === taskId) {
            // Use the spread operator to include all previous task properties and update the taskCompleted property
            return { ...task, taskCompleted: isComplete };
          }
          return task;
        });

        return {
          // Use the spread operator to include all previous user data other than the user tasks
          ...prevUser,
          // Update the user tasks with the updated tasks
          userTasks: updatedTasks,
        };
      });
    } catch (e) {
      console.error(e);
    }
    // Hide the loading spinner and show the checkbox
    setIsLoadingTaskCompletedUpdate(false);
  };

  // Function to handle changing the task title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Update the new title state variable to display the new title as it is being typed
    setNewTitle(e.target.value);
  };

  // Function to handle updating the task title
  const handleTitleUpdate = async (e?: React.KeyboardEvent<HTMLInputElement>) => {
    // When the user presses the Enter key or clicks outside the input, update the task title
    if (e && e.key !== "Enter") return;
    // Show the loading spinner and hide the input field
    setIsEditing(false);
    setIsLoadingTitleUpdate(true);
    try {
      // Make a PATCH request to the API to update the task title
      await apiFetch<UserTaskResponse>(
        "userTask",
        "PATCH",
        user.userId,
        JSON.stringify({
          taskTitle: newTitle,
        }),
        [{ key: "taskId", value: taskId }],
      );
      // Update the user state with the updated task data
      setUser((prevUser) => {
        const updatedTasks = prevUser.userTasks.map((task) => {
          if (task.taskId === taskId) {
            // Use the spread operator to include all previous task properties and update the taskTitle property
            return { ...task, taskTitle: newTitle };
          }
          return task;
        });

        return {
          // Use the spread operator to include all previous user data other than the user tasks
          ...prevUser,
          // Update the user tasks with the updated tasks array
          userTasks: updatedTasks,
        };
      });
    } catch (e) {
      console.error(e);
    }
    // Hide the loading spinner and show the input/title field
    setIsLoadingTitleUpdate(false);
  };

  // Return the JSX elements for rendering the component
  return (
    // When the card is clicked, navigate to the UserTaskPage if the card is not in edit mode
    <Card onClick={isEditing ? undefined : () => navigate(`/userTask/${taskId}`)}>
      {/* Conditional rendering for the loading spinner or checkbox based on the loading state */}
      {isLoadingTaskCompletedUpdate ? (
        <Spinner />
      ) : (
        <CheckBox isComplete={taskCompleted} onClick={(e) => toggleTaskCompleted(e, !taskCompleted)} />
      )}
      {/* Conditional rendering for the loading spinner or task title based on the loading state */}
      {isLoadingTitleUpdate ? (
        <Spinner />
      ) : isEditing ? (
        <InputTitle
          type="text"
          value={newTitle}
          onChange={handleTitleChange}
          onBlur={() => handleTitleUpdate()}
          onKeyDown={handleTitleUpdate}
          autoFocus
          onFocus={(e) => e.target.select()}
        />
      ) : (
        <Title>{taskTitle}</Title>
      )}
      {/* Conditional rendering for the task due date based on whether it is defined */}
      {taskDueDate !== 0 ? <DueDate>Due {formatDate(taskDueDate, twelveHour)}</DueDate> : null}
      {/* Stop the click event from propagating to the card when clicking the buttons */}
      <ButtonGroup onClick={(e) => e.stopPropagation()}>
        {/* Conditional rendering for the notification button based on the user settings */}
        {user.userSettings.enableNotifications && (
          <Link to={`/taskNotifications/${taskId}`}>
            <NotificationButton>
              <MdNotifications />
            </NotificationButton>
          </Link>
        )}
        <EditButton onClick={() => setIsEditing(!isEditing)}>
          <MdEdit />
        </EditButton>

        <DeleteButton onClick={() => onDeleteClick(taskId, taskTitle)}>
          <MdDelete />
        </DeleteButton>
      </ButtonGroup>
    </Card>
  );
};

export default UserTaskCard;
