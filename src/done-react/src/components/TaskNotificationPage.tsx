/** =========================================================================================
 * Filename: TaskNotificationPage.tsx
 *
 * Description: This component is responsible for managing task notifications for a specific task.
 * It enables users to view, add, or delete notifications, and toggle their enabled state.
 *
 * Contains:
 * - Task Title
 * - List of notifications as cards
 * - Toggle for notification enabled state
 * - Button for adding a new notification
 * - Button for deleting a notification
 * - Back Button
 * - Settings Button
 ========================================================================================= */

import React, { useState } from "react";
import { MdDelete, MdThumbDown, MdThumbUp } from "react-icons/md";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import apiFetch from "../apiFetch";
import { DeleteResponse, TaskNotificationResponse } from "../responseTypes";
import useUser from "../useUser";
import { UserTask } from "../userType";
import AddItemButton from "./AddItemButton";
import AddNotificationModal from "./AddNotificationModal";
import BackButton from "./BackButton";
import ConfirmationModal from "./ConfirmationModal";
import Spinner from "./LoadingSpinner";
import SettingsButton from "./SettingsButton";

// Styled component for the page container
const PageContainer = styled.div`
  width: 100%;
  overflow-y: auto;
`;

// Styled component for the task notification title
const TaskNotificationTitle = styled.h1`
  color: #232323;
  font-size: 2rem;
  margin-top: 1rem;
  text-align: center;
  display: flex;
  justify-content: center;
`;

// Styled component for the task title
const TaskTitleDisplay = styled.h2`
  color: #284d6e;
  font-size: 1.25rem;
  margin-top: 1rem;
  text-align: center;
  display: flex;
  justify-content: center;
`;

// Styled component for the thumbs up/down icon container
const ThumbsIconContainer = styled.div`
  display: flex;
  align-items: center;
`;

// Styled component for the thumbs up icon
const ThumbsUpIcon = styled.div`
  background-color: #dadada;
  color: #008f4c;
  border: none;
  padding-top: 4px;
  padding-left: 4px;
  padding-right: 4px;
  font-size: 16px;
  border: 2px solid #000000;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease-in-out;
  margin-right: 50px;
  &:hover {
    color: #a0a000;
  }
`;

// Styled component for the thumbs down icon
const ThumbsDownIcon = styled.div`
  background-color: #dadada;
  color: #b22929;
  border: none;
  padding-top: 4px;
  padding-left: 4px;
  padding-right: 4px;
  font-size: 16px;
  border: 2px solid #000000;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease-in-out;
  margin-right: 50px;
  &:hover {
    color: #a0a000;
  }
`;

// Styled component for the notification card
const NotificationCard = styled.div`
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
  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 4px 8px rgba(0, 0, 0, 0.16),
      0 6px 10px rgba(0, 0, 0, 0.23);
  }
`;

// Styled component for the reminder time display
const ReminderTimeDisplay = styled.h2`
  color: #284d6e;
  font-size: 1.25rem;
  margin-top: 1rem;
  text-align: center;
  display: flex;
  justify-content: center;
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

// Styled component for the bottom menu container
const BottomMenuContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
`;

// Functional component for the TaskNotificationPage
const TaskNotificationPage: React.FC = () => {
  // Get the task ID from the query string parameters in the URL
  const { taskId } = useParams<{ taskId: string }>();
  // Get the user and setUser from the useUser hook
  const { user, setUser } = useUser();
  // State for showing the add/delete notification modals
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // State for the notification to delete
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
  // State for showing the loading spinner for each component
  const [isLoadingAddNotification, setIsLoadingAddNotification] = useState(false);
  const [isLoadingDeleteNotificationId, setIsLoadingDeleteNotificationId] = useState<string | null>(null);
  const [isLoadingToggleNotificationId, setIsLoadingToggleNotificationId] = useState<string | null>(null);

  // Function for deleting a notification
  const handleDeleteNotification = async (notificationId: string) => {
    // Set the loading spinner for the delete button
    setIsLoadingDeleteNotificationId(notificationId);
    try {
      // Make a DELETE request to the API to delete the notification
      const response = await apiFetch<DeleteResponse>("taskNotification", "DELETE", user.userId, null, [
        { key: "taskId", value: taskId },
        { key: "notificationId", value: notificationId },
      ]);
      // Log the response message in the browser console
      console.log(response.body.message);
    } catch (e) {
      console.log(e);
    }

    // Update the user state to remove the deleted notification
    setUser((prevUser) => {
      // Use the map function to iterate through the user tasks and update the task with the matching task ID
      const updatedTasks = prevUser.userTasks.map((task) => {
        if (task.taskId !== taskId) return task;
        // Use the filter function to remove the notification with the matching notification ID
        const updatedNotifications = task.taskNotifications.filter(
          (notification) => notification.notificationId !== notificationId,
        );
        // Return the updated tasks
        return { ...task, taskNotifications: updatedNotifications };
      });

      // Return the updated user state
      return {
        // Use the spread operator to include all previous user data other than the user tasks
        ...prevUser,
        userTasks: updatedTasks,
      };
    });
    // Hide the loading spinner and show the delete button for the notification
    setIsLoadingDeleteNotificationId(null);

    // Close the delete modal
    setShowDeleteModal(false);
  };

  // Function for adding a notification
  const handleAddNotification = async (taskId: string, reminderTime: number) => {
    // Set the loading spinner and hide the add notification button
    setIsLoadingAddNotification(true);
    try {
      // Make a POST request to the API to add the notification
      const response = await apiFetch<TaskNotificationResponse>(
        "taskNotification",
        "POST",
        user.userId,
        JSON.stringify({
          notificationEnabled: true,
          reminderTimeBeforeDue: reminderTime,
        }),
        [{ key: "taskId", value: taskId }],
      );
      // Log the response message in the browser console
      console.log(response.body.message);
      // Update the user state to add the new notification
      setUser((prevUser) => {
        // Use the map function to iterate through the user tasks and update the task with the matching task ID
        const updatedTasks = prevUser.userTasks.map((task) => {
          if (task.taskId === taskId) {
            // Return the updated task with the new notification
            return {
              // Use the spread operator to include all previous task data other than the task notifications
              ...task,
              taskNotifications: [
                // Use the spread operator to include all previous task notifications
                ...task.taskNotifications,
                // Add the new notification
                {
                  taskId,
                  notificationId: response.body.data.notificationId,
                  notificationEnabled: response.body.data.notificationEnabled,
                  reminderTimeBeforeDue: response.body.data.reminderTimeBeforeDue,
                  createdAt: response.body.data.createdAt,
                  updatedAt: response.body.data.updatedAt,
                },
              ],
            };
          }
          // For tasks that do not match the task ID, return the task without any changes back to the array
          return task;
        });
        // Return the updated user state
        return {
          ...prevUser,
          userTasks: updatedTasks,
        };
      });
    } catch (e) {
      console.log(e);
    }
    // Hide the loading spinner and show the add notification button
    setIsLoadingAddNotification(false);
  };

  // Function for toggling the enabled state of a notification
  const toggleNotificationEnabled = async (notificationId: string) => {
    // Set the loading spinner and hide the thumbs up/down icon
    setIsLoadingToggleNotificationId(notificationId);
    try {
      // Make a PATCH request to the API to toggle the enabled state of the notification
      const response = await apiFetch<TaskNotificationResponse>(
        "taskNotification",
        "PATCH",
        user.userId,
        JSON.stringify({
          notificationEnabled: !user.userTasks
            .find((task) => task.taskId === taskId)
            ?.taskNotifications.find((notification) => notification.notificationId === notificationId)
            ?.notificationEnabled,
        }),
        [
          { key: "taskId", value: taskId },
          { key: "notificationId", value: notificationId },
        ],
      );
      // Log the response message in the browser console
      console.log(response.body.message);
      // Update the user state to toggle the enabled state of the notification
      setUser((prevUser) => {
        // Use the map function to iterate through the user tasks and update the task with the matching task ID
        const updatedTasks = prevUser.userTasks.map((task) => {
          // If the task ID does not match, return the task without any changes back to the array
          if (task.taskId !== taskId) return task;

          // Use the map function to only update the notification with the matching notification ID
          const updatedNotifications = task.taskNotifications.map((notification) => {
            if (notification.notificationId === notificationId) {
              return {
                ...notification,
                notificationEnabled: !notification.notificationEnabled,
              };
            }
            return notification;
          });
          // Return the updated task with the updated notification
          return { ...task, taskNotifications: updatedNotifications };
        });

        // Return the updated user state
        return {
          ...prevUser,
          userTasks: updatedTasks,
        };
      });
    } catch (e) {
      console.log(e);
    }
    // Hide the loading spinner and show the thumbs up/down icon
    setIsLoadingToggleNotificationId(null);
  };

  // Get the task for the current page from the user state
  const task = user.userTasks.find((task: UserTask) => task.taskId === taskId);
  // Get the existing reminder times for each task notification
  const existingReminders = task.taskNotifications.map((n) => n.reminderTimeBeforeDue) || [];

  // If the task does not exist, display an error message (this should never happen)
  if (!task) {
    return (
      <PageContainer>
        <BackButton style={{ position: "relative", right: 700, top: 10 }} />
        <TaskNotificationTitle>Error</TaskNotificationTitle>
        <TaskTitleDisplay>The task with ID {taskId} does not exist.</TaskTitleDisplay>
      </PageContainer>
    );
  }

  // Get the task title and notifications from the task
  const taskTitle = task.taskTitle;
  const notifications = task.taskNotifications;
  // Sort the notifications by reminder time
  const sortedNotifications = [...(notifications || [])].sort(
    (a, b) => a.reminderTimeBeforeDue - b.reminderTimeBeforeDue,
  );

  // Return the JSX elements to be rendered
  return (
    <PageContainer>
      <BackButton style={{ position: "relative", right: 700, top: 10 }} />
      <TaskNotificationTitle>Task Notifications</TaskNotificationTitle>
      <TaskTitleDisplay>Task: {taskTitle}</TaskTitleDisplay>
      {/* Render the notifications as cards by mapping over the notifications array */}
      {sortedNotifications.map((props, idx) => (
        <NotificationCard key={idx}>
          <ThumbsIconContainer>
            {/* Conditionally render the spinner based on the loading state of the enable/disable action */}
            {isLoadingToggleNotificationId === props.notificationId ? (
              <Spinner />
            ) : props.notificationEnabled ? (
              // Conditionally render the thumbs up/down icon based on the enabled state of the notification
              <>
                <ThumbsUpIcon onClick={() => toggleNotificationEnabled(props.notificationId)}>
                  <MdThumbUp size="2rem" />
                </ThumbsUpIcon>
                <span style={{ color: "black" }}>Enabled</span>
              </>
            ) : (
              <>
                <ThumbsDownIcon onClick={() => toggleNotificationEnabled(props.notificationId)}>
                  <MdThumbDown size="2rem" />
                </ThumbsDownIcon>
                <span style={{ color: "black" }}>Disabled</span>
              </>
            )}
          </ThumbsIconContainer>
          <ReminderTimeDisplay>Reminder Time: {props.reminderTimeBeforeDue} minutes prior</ReminderTimeDisplay>
          {/* Conditionally render the spinner based on the loading state of the delete action */}
          {isLoadingDeleteNotificationId === props.notificationId ? (
            <Spinner />
          ) : (
            <DeleteButton
              onClick={() => {
                setShowDeleteModal(true);
                setNotificationToDelete(props.notificationId);
              }}
            >
              <MdDelete />
            </DeleteButton>
          )}
        </NotificationCard>
      ))}
      <SettingsButton />
      <BottomMenuContainer>
        {/* Conditionally render the spinner based on the loading state of the add notification action */}
        {isLoadingAddNotification ? (
          <Spinner />
        ) : (
          <AddItemButton label="Add Notification" onClick={() => setShowNotificationModal(true)} />
        )}
      </BottomMenuContainer>
      {/* Conditionally render the add notification modal based on the state */}
      {showNotificationModal && (
        <AddNotificationModal
          onClose={() => setShowNotificationModal(false)}
          onAddNotification={handleAddNotification}
          taskId={taskId}
          existingReminders={existingReminders}
        />
      )}
      {/* Conditionally render the delete confirmation modal based on the state */}
      {showDeleteModal && (
        <ConfirmationModal
          title="Delete Notification"
          message="Are you sure you want to delete this notification?"
          onConfirm={() => {
            if (notificationToDelete) handleDeleteNotification(notificationToDelete);
          }}
          onCancel={() => setShowDeleteModal(false)}
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </PageContainer>
  );
};

export default TaskNotificationPage;
