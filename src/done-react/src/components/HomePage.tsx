/** =========================================================================================
 * Filename: HomePage.tsx
 *
 * Description: This page component is the main page of the application.
 *
 * Contains:
 * - Sort bar
 * - Task list
 * - Add task button
 * - Add category button
 * - Settings button
 ========================================================================================= */

import { useState } from "react";
import styled from "styled-components";
import apiFetch from "../apiFetch";
import { DeleteResponse, UserCategoryResponse, UserTaskResponse } from "../responseTypes";
import useUser from "../useUser";
import { UserSettings } from "../userType";
import AddCategoryModal from "./AddCategoryModal";
import AddItemButton from "./AddItemButton";
import AddTaskModal from "./AddTaskModal";
import ConfirmationModal from "./ConfirmationModal";
import Spinner from "./LoadingSpinner";
import SettingsButton from "./SettingsButton";
import SortBar from "./SortBar";
import UserTaskCardList from "./UserTaskCardList";

// Styled component for the bottom menu bar
const BottomMenuDiv = styled.div`
  position: absolute;
  bottom: 10px;
  left: 10px;
  display: flex;
  justify-content: flex-start;
  width: 100%;
  margin-left: 10px;
`;

// Functional component for the HomePage
const HomePage: React.FC = () => {
  // Custom hook to access and manage the user state which holds all user data
  const { user, setUser } = useUser();
  // State variables for the task and category modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  // State variables for the confirmation modal
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  // State variables for the task to delete
  const [taskIdToDelete, setTaskIdToDelete] = useState<string | null>(null);
  const [taskTitleToDelete, setTaskTitleToDelete] = useState<string | null>(null);
  // State variables for loading spinners
  const [isLoadingAddTask, setIsLoadingAddTask] = useState(false);
  const [isLoadingAddCategory, setIsLoadingAddCategory] = useState(false);
  const [isLoadingDeleteTask, setIsLoadingDeleteTask] = useState(false);

  // Function to handle adding a new task
  const handleAddTask = async (
    taskTitle: string,
    taskNotes: string,
    taskDueDate: number,
    categoryId: string,
    defaultNotifications: UserSettings["defaultNotifications"],
  ) => {
    // Show the loading spinner and hide the add task button
    setIsLoadingAddTask(true);
    try {
      // If the user is not defined, throw an error
      const userId = user?.userId;
      if (!userId) {
        throw new Error("User ID is not defined");
      }

      // Create the new task data object
      const newTaskData = {
        taskTitle,
        taskNotes,
        taskDueDate,
        categoryId,
        defaultNotifications,
      };

      // Add the task to the database
      const response = await apiFetch<UserTaskResponse>("userTask", "POST", userId, JSON.stringify(newTaskData));

      // Retrieve the task and its notifications from the response using destructuring
      const { task: newTask, notifications: newNotifications } = response.body.data;

      // Update the user state with the new task and its notifications
      setUser((prevUser) => {
        // If the user is defined, update the user state based on the previous state
        if (prevUser) {
          const updatedTaskData = {
            ...newTask,
            taskNotifications: newNotifications,
          };

          return {
            // Use the spread operator to include all previous user data other than the user tasks
            ...prevUser,
            // Use the spread operator to include all previous tasks and add the new task data to the end of the array
            userTasks: [...prevUser.userTasks, updatedTaskData],
          };
        }
        // If the user is not defined, return the previous state
        return prevUser;
      });
    } catch (error) {
      console.error("Error adding task:", error);
    }
    // Hide the loading spinner and show the add task button
    setIsLoadingAddTask(false);
  };

  // Function to handle adding a new category
  const handleAddCategory = async (categoryName: string) => {
    // Show the loading spinner and hide the add category button
    setIsLoadingAddCategory(true);
    try {
      // If the user is not defined, throw an error
      const userId = user?.userId;
      if (!userId) {
        throw new Error("User ID is not defined");
      }

      // Create the new category data object
      const newCategoryData = {
        categoryName,
      };

      // Add the category to the database
      const newCategory = await apiFetch<UserCategoryResponse>(
        "userCategory",
        "POST",
        userId,
        JSON.stringify(newCategoryData),
      );

      // Retrieve the categoryId from the response
      const categoryId = newCategory.body.data.categoryId;

      // Update the user state with the new category
      setUser((prevUser) => {
        // If the user is defined, update the user state based on the previous state
        return {
          // Use the spread operator to include all previous user data other than the user categories
          ...prevUser,
          userCategories: [
            // Use the spread operator to include all previous categories
            ...prevUser.userCategories,
            // Add the new category data to the end of the array
            {
              ...newCategoryData,
              categoryId,
              createdAt: newCategory.body.data.createdAt,
              updatedAt: newCategory.body.data.updatedAt,
            },
          ],
        };
      });
    } catch (error) {
      console.error("Error adding category:", error);
    }
    // Hide the loading spinner and show the add category button
    setIsLoadingAddCategory(false);
  };

  // Retrieve the existing category names from the user state
  const existingCategoryNames = user?.userCategories.map((cat) => cat.categoryName) || [];

  // Function to handle clicking the delete button on a task
  const handleDeleteClick = (taskId: string, taskTitle: string) => {
    // Set the task ID and title to delete
    setTaskIdToDelete(taskId);
    setTaskTitleToDelete(taskTitle);
    // Show the confirmation modal
    setShowConfirmationModal(true);
  };

  // Function to handle confirming the deletion of a task
  const handleConfirm = async () => {
    // Show the loading spinner and hide the delete task button
    setIsLoadingDeleteTask(true);
    if (taskIdToDelete && user?.userId) {
      // Delete the task from the database
      // The body is null because the DELETE response doesn't return any data
      await apiFetch<DeleteResponse>("userTask", "DELETE", user.userId, null, [
        { key: "taskId", value: taskIdToDelete },
      ]);

      // Remove the task from the React state
      setUser((prevUser) => {
        return {
          // Use the spread operator to include all previous user data other than the user tasks
          ...prevUser,
          // Use the filter method to remove the task with the matching task ID
          userTasks: prevUser.userTasks.filter((task) => task.taskId !== taskIdToDelete),
        };
      });
    }

    // Hide the confirmation modal
    setShowConfirmationModal(false);
    // Reset the task ID and title to delete
    setTaskIdToDelete(null);
    setTaskTitleToDelete(null);
    // Hide the loading spinner and show the delete task button
    setIsLoadingDeleteTask(false);
  };

  // Function to handle canceling the deletion of a task
  const handleCancel = () => {
    // Hide the confirmation modal
    setShowConfirmationModal(false);
    // Reset the task ID and title to delete
    setTaskIdToDelete(null);
    setTaskTitleToDelete(null);
  };

  return (
    <>
      <SortBar />
      {/* Conditional rendering for the loading spinner or the task list */}
      {isLoadingDeleteTask ? <Spinner /> : <UserTaskCardList onDeleteClick={handleDeleteClick} />}
      <BottomMenuDiv>
        {/* Conditional rendering for the loading spinner or the add task button */}
        {isLoadingAddTask ? <Spinner /> : <AddItemButton label="Add Task" onClick={() => setShowTaskModal(true)} />}
        {/* Conditional rendering for the loading spinner or the add category button */}
        {isLoadingAddCategory ? (
          <Spinner />
        ) : (
          <AddItemButton label="Add Category" onClick={() => setShowCategoryModal(true)} />
        )}
        <SettingsButton />
      </BottomMenuDiv>
      {/* Conditional rendering for the task modal */}
      {showTaskModal && <AddTaskModal onClose={() => setShowTaskModal(false)} onAddTask={handleAddTask} />}
      {/* Conditional rendering for the category modal */}
      {showCategoryModal && (
        <AddCategoryModal
          onClose={() => setShowCategoryModal(false)}
          onAddCategory={handleAddCategory}
          existingCategories={existingCategoryNames}
        />
      )}
      {/* Conditional rendering for the confirmation modal */}
      {showConfirmationModal && (
        <ConfirmationModal
          title="Delete Task"
          message={`Are you sure you want to delete the task: "${taskTitleToDelete}"?`}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          onClick={(e) => e.stopPropagation()}
          style={{ color: "purple" }}
        />
      )}
    </>
  );
};

export default HomePage;
