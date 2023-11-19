/** =========================================================================================
 * Filename: UserTaskPage.tsx
 *
 * Description: This page component renders a detailed view of a single task.
 * It is accessed by clicking on a task in the task list on the home page or by
 * navigating to the URL (/userTask/:taskId).
 *
 * Contains:
 * - Task Title
 * - Due date and time
 * - Category
 * - Notes
 * - Edit/Delete/Notification buttons
 * - Checkbox to mark task as complete
 * - Back button
 ========================================================================================= */

import React, { useState } from "react";
import { MdDelete, MdEdit, MdNotifications, MdSave } from "react-icons/md";
import { Link, useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import validator from "validator";
import apiFetch from "../apiFetch";
import { DeleteResponse, UserTaskResponse } from "../responseTypes";
import useUser from "../useUser";
import BackButton from "./BackButton";
import ChangeDueDateModal from "./ChangeDueDateModal";
import CheckBox from "./CheckMarkBox";
import ConfirmationModal from "./ConfirmationModal";
import Spinner from "./LoadingSpinner";
import SettingsButton from "./SettingsButton";

// Styled component for the page container
const PageContainer = styled.div`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 900px;
`;

// Styled component for the task header
const Header = styled.div`
  display: flex;
  justify-content: space-around;
  width: 100%;
`;

// Styled component for the category name span container
const CategoryNameSpan = styled.span`
  font-weight: bold;
  color: #00b3ff;
  font-size: 1.2rem;
`;

// Styled component for the category name
const CategoryName = styled.span`
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

// Styled component for the due date
const DueDate = styled.time`
  font-size: 1rem;
  color: #0060c0;
  font-weight: bold;
  cursor: pointer;
  margin-top: 5px;

  &:hover {
    text-decoration: underline;
  }
`;

// Styled component for the task title
const Title = styled.div`
  color: #232323;
  font-size: 2rem;
  margin-top: 1rem;
  text-align: center;
  display: flex;
  justify-content: center;
  font-weight: bold;
`;

// Styled component for the notes header wrapper
const NotesHeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
`;

// Styled component for the notes label
const NotesLabel = styled.label`
  font-size: 1.5rem;
`;

// Styled component for the notes display container
const NotesDisplay = styled.div`
  width: 600px;
  height: 300px;
  padding: 0.5rem;
  margin-top: 0.5rem;
  font-size: 1rem;
  border: 2px solid #9d9d9d;
`;

// Styled component for a button to be used as a base for other buttons
const BaseButton = styled.button`
  padding-top: 0.5rem;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 1rem;
  margin-left: 10px;
`;

// Styled component for the edit button (extends BaseButton)
const EditButton = styled(BaseButton)`
  background-color: #00b3ff;

  &:hover {
    background-color: #008ac9;
  }
`;

// Styled component for the save button (extends BaseButton)
const SaveButton = styled.button`
  background-color: #00b3ff;

  &:hover {
    background-color: #008ac9;
  }
`;

// Styled component for the notification button (extends BaseButton)
const NotificationButton = styled(BaseButton)`
  background-color: #ffb700;
  margin-right: 10px;

  &:hover {
    background-color: #e09c00;
  }
`;

// Styled component for the delete button (extends BaseButton)
const DeleteButton = styled(BaseButton)`
  background-color: #ff4f4f;
  font-size: 3rem;
  margin: 30px;

  &:hover {
    background-color: #e04040;
  }
`;

// Styled component for the title input
const InputTitle = styled.input`
  color: #232323;
  font-size: 2rem;
  border: none;
  outline: none;
  background-color: transparent;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  font-weight: bold;
  margin: 0;
`;

// Styled component for the task title
const TaskTitle = styled.span`
  color: #232323;
  font-size: 2rem;
  &:hover {
    text-decoration: underline;
    cursor: pointer;
  }
`;

// Styled component for the category dropdown selector
const StyledSelect = styled.select`
  width: 100%;
  padding: 8px;
  margin-top: 4px;
`;

// Styled component for the category dropdown wrapper
const DropdownWrapper = styled.div`
  display: flex;

  button {
    background: burlywood;
    color: white;
    border: 2;
    cursor: pointer;
    padding: 0;
    height: 20px;
    width: 20px;
    font-size: 10px;
    align-self: center;
  }

  select {
    margin-left: 10px;
  }
`;

// Styled component for the notes textarea
const StyledTextArea = styled.textarea`
  width: 600px;
  height: 300px;
  padding: 0.5rem;
  margin-top: 0.5rem;
  font-size: 1rem;
  border: 2px solid #9d9d9d;
  resize: none;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  background-color: aliceblue;
`;

// Styled component for the due date container
const DueDateDiv = styled.div`
  display: flex;
  justify-content: right;
`;

// Interface for the props that the UserTaskPage component will accept
const UserTaskPage: React.FC = () => {
  // Get the taskId from the query string parameter in the URL
  const { taskId } = useParams<{ taskId: string }>();
  // Use the useUser hook to access the user data
  const { user, setUser } = useUser();
  // Use the useNavigate hook to navigate to other pages
  const navigate = useNavigate();

  // Get the task requested by the query string parameter from the user's task data
  const task = user?.userTasks.find((task) => task.taskId === taskId);

  // Destructure the task data. If the task is null, set the values to default values
  const { taskDueDate, taskTitle, taskCompleted, taskNotes, categoryId } = task
    ? task
    : { taskDueDate: 0, taskTitle: "", taskCompleted: false, taskNotes: "", categoryId: "" };

  // State variables for the delete confirmation modal
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // State variables for the change due date modal
  const [showChangeDueDateModal, setShowChangeDueDateModal] = useState(false);

  // State variables for the task to delete
  const [taskIdToDelete, setTaskIdToDelete] = useState<string | null>(null);
  const [taskTitleToDelete, setTaskTitleToDelete] = useState<string | null>(null);

  // State variables for editing the task title
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(taskTitle);

  // State variables for editing notes
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [newNotes, setNewNotes] = useState(taskNotes);

  // State variables for the current category ID and whether to show the category dropdown
  const [currentCategoryId, setCurrentCategoryId] = useState(categoryId);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // State variables for loading spinners
  const [isLoadingChangeCategory, setIsLoadingChangeCategory] = useState(false);
  const [isLoadingChangeDueDate, setIsLoadingChangeDueDate] = useState(false);
  const [isLoadingUpdateTaskTitle, setIsLoadingUpdateTaskTitle] = useState(false);
  const [isLoadingUpdateTaskNotes, setIsLoadingUpdateTaskNotes] = useState(false);
  const [isLoadingCompleteTask, setIsLoadingCompleteTask] = useState(false);
  const [isLoadingDeleteTask, setIsLoadingDeleteTask] = useState(false);

  // State variable for the error message
  const [error, setError] = useState<string | null>(null);

  // Create a Date object from the task due date
  const dueDate = new Date(taskDueDate);

  // Get the current category name
  const currentCategory = user?.userCategories.find((category) => category.categoryId === currentCategoryId);
  const currentCategoryName = currentCategory ? currentCategory.categoryName : "N/A";

  // Get the available categories from the user context
  const { getAvailableCategories } = useUser();
  const availableCategories = getAvailableCategories();

  // Create an array of selectable categories to use in the category dropdown
  const selectableCategories = [
    {
      categoryId: "",
      categoryName: "--",
    },
    ...availableCategories,
  ];

  // Function to handle changing the category of the task
  const handleCategoryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Prevent clicking on other elements when selecting a category
    e.stopPropagation();
    // Show the loading spinner and hide the category
    setIsLoadingChangeCategory(true);
    // Get the new category ID from the event target (the dropdown select element)
    const newCategoryId = e.target.value;
    try {
      // Make a PATCH request to the API to update the task's category
      const response = await apiFetch<UserTaskResponse>(
        "userTask",
        "PATCH",
        user.userId,
        JSON.stringify({ categoryId: newCategoryId }),
        [{ key: "taskId", value: taskId }],
      );
      // Log the response message to the browser console
      console.log(response.body.message);
      // Update local state and the user state with the new category ID
      setCurrentCategoryId(newCategoryId);
      setUser((prevUser) => {
        const updatedTasks = prevUser?.userTasks.map((task) => {
          if (task.taskId === taskId) {
            // Use the spread operator to include all previous task data and update the category ID
            return { ...task, categoryId: newCategoryId };
          }
          return task;
        });

        return {
          // Use the spread operator to include all previous user data except the user tasks
          ...prevUser,
          // Return the user tasks with the updated tasks
          userTasks: updatedTasks || [],
        };
      });
    } catch (error) {
      console.log(error);
    }
    // Hide the loading spinner and show the category
    setIsLoadingChangeCategory(false);
    // Hide the category dropdown
    setShowCategoryDropdown(false);
  };

  // Function to handle toggling the task completion status
  const handleCheckboxToggle = async () => {
    // Show the loading spinner and hide the checkbox
    setIsLoadingCompleteTask(true);
    try {
      // Make a PATCH request to the API to update the task's completion status
      await apiFetch<UserTaskResponse>(
        "userTask",
        "PATCH",
        user.userId,
        JSON.stringify({ taskCompleted: !taskCompleted }),
        [{ key: "taskId", value: taskId }],
      );
      setUser((prevUser) => {
        const updatedTasks = prevUser.userTasks.map((t) =>
          t.taskId === taskId ? { ...t, taskCompleted: !t.taskCompleted } : t,
        );
        // Use the spread operator to include all previous user data and add the updated tasks
        return { ...prevUser, userTasks: updatedTasks };
      });
    } catch (error) {
      console.log(error);
    }
    // Hide the loading spinner and show the checkbox
    setIsLoadingCompleteTask(false);
  };

  // Function to handle changing the task due date
  const handleDueDateChange = async (newDueDate: number) => {
    // Show the loading spinner and hide the due date
    setIsLoadingChangeDueDate(true);
    try {
      // Make a PATCH request to the API to update the task's due date
      await apiFetch<UserTaskResponse>("userTask", "PATCH", user.userId, JSON.stringify({ newDueDate }), [
        { key: "taskId", value: taskId },
      ]);
      // Update the user state with the new due date
      setUser((prevUser) => {
        const updatedTasks = prevUser.userTasks.map((task) => {
          if (task.taskId === taskId) {
            // Use the spread operator to include all previous task data and update the due date
            return { ...task, taskDueDate: newDueDate };
          }
          return task;
        });
        return {
          // Use the spread operator to include all previous user data except the user tasks
          ...prevUser,
          // Return the user tasks with the updated tasks
          userTasks: updatedTasks,
        };
      });
    } catch (error) {
      console.log(error);
    }
    // Hide the loading spinner and show the due date
    setIsLoadingChangeDueDate(false);
  };

  // Function to handle clicking the delete button
  const handleDeleteClick = (taskId: string, taskTitle: string) => {
    // Set the task ID and title to delete
    setTaskIdToDelete(taskId);
    setTaskTitleToDelete(taskTitle);
    // Show the deletion confirmation modal
    setShowConfirmationModal(true);
  };

  // Function to handle confirming the deletion of a task
  const handleConfirm = () => {
    // Show the loading spinner and hide the delete task button
    setIsLoadingDeleteTask(true);
    try {
      // Make a DELETE request to the API to delete the task
      apiFetch<DeleteResponse>("userTask", "DELETE", user.userId, null, [{ key: "taskId", value: taskIdToDelete }]);
      // Update the user state by removing the task from the user tasks array
      setUser((prevUser) => {
        return {
          // Use the spread operator to include all previous user data except the user tasks
          ...prevUser,
          // Return the user tasks with the deleted task removed
          userTasks: prevUser.userTasks.filter((task) => task.taskId !== taskIdToDelete),
        };
      });
    } catch (error) {
      console.log(error);
    }

    // Hide the loading spinner and show the delete task button
    setIsLoadingDeleteTask(false);
    // Hide the deletion confirmation modal
    setShowConfirmationModal(false);
    // Reset the task ID and title to delete
    setTaskTitleToDelete(null);
    setTaskIdToDelete(null);
    // Navigate to the home page since the task was deleted
    navigate("/");
  };

  // Function to handle canceling the deletion of a task
  const handleCancel = () => {
    // Hide the deletion confirmation modal
    setShowConfirmationModal(false);
    // Reset the task ID and title to delete
    setTaskTitleToDelete(null);
    setTaskIdToDelete(null);
  };

  // Function to handle changing the task title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Update the new title state variable to display the new title as it is being typed
    setNewTitle(e.target.value);
  };

  // Function to handle clicking the edit button
  const handleTitleClick = () => {
    // Set the isEditing state variable to true to display the input field
    setIsEditing(true);
  };

  // Function to handle updating the task title
  const handleTitleUpdate = async (e?: React.KeyboardEvent<HTMLInputElement>) => {
    // When the user presses the Enter key or clicks outside the input, update the task title
    if (e && e.key !== "Enter") return;
    // Show the loading spinner and hide the task title
    setIsLoadingUpdateTaskTitle(true);
    // Set the isEditing state variable to false remove the ability to edit the title
    setIsEditing(false);

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
    // Update the user state with the new task title
    setUser((prevUser) => {
      // Use the map method to update the task title in the user tasks array
      const updatedTasks = prevUser.userTasks.map((task) => {
        if (task.taskId === taskId) {
          // Use the spread operator to include all previous task data and update the task title
          return { ...task, taskTitle: newTitle };
        }
        return task;
      });

      return {
        // Use the spread operator to include all previous user data except the user tasks
        ...prevUser,
        // Return the user tasks with the updated tasks
        userTasks: updatedTasks,
      };
    });
    // Hide the loading spinner and show the task title
    setIsLoadingUpdateTaskTitle(false);
  };

  // Function to handle updating the task notes
  const handleNotesUpdate = async () => {
    const regex = /^[a-zA-Z0-9 .\n]*$/;
    if (newNotes.length > 0 && (!regex.test(newNotes) || newNotes.length > 500)) {
      setError("Invalid task notes. Only alphanumeric and periods are allowed. Limit 500 characters.");
      return;
    }

    // Sanitize the new notes to prevent XSS attacks
    const sanitizedNewNotes = validator.escape(newNotes);
    // Disable the input field for editing the notes
    setIsEditingNotes(false);
    // Show the loading spinner and hide the notes
    setIsLoadingUpdateTaskNotes(true);
    try {
      // Make a PATCH request to the API to update the task notes
      const response = await apiFetch<UserTaskResponse>(
        "userTask",
        "PATCH",
        user.userId,
        JSON.stringify({
          taskNotes: sanitizedNewNotes,
        }),
        [{ key: "taskId", value: taskId }],
      );
      // Log the response message to the browser console
      console.log(response.body.message);
      // Update the user state with the new task notes
      setUser((prevUser) => {
        const updatedTasks = prevUser.userTasks.map((task) => {
          if (task.taskId === taskId) {
            // Use the spread operator to include all previous task data and update the task notes
            return { ...task, taskNotes: sanitizedNewNotes };
          }
          return task;
        });

        return {
          // Use the spread operator to include all previous user data except the user tasks
          ...prevUser,
          // Return the user tasks with the updated tasks
          userTasks: updatedTasks,
        };
      });
    } catch (e) {
      console.error(e);
    }
    // Hide the loading spinner and show the notes
    setIsLoadingUpdateTaskNotes(false);
  };

  // Return the JSX elements for rendering the page
  return (
    <PageContainer>
      <Header>
        <BackButton />
        <CategoryNameSpan>
          <span style={{ color: "black" }}>Category:</span>
          {/* If the task category is being updated, display the loading spinner */}
          {isLoadingChangeCategory ? (
            <Spinner />
          ) : (
            <CategoryName onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}>
              {" "}
              {currentCategoryName}
            </CategoryName>
          )}
          {/* If showCategoryDropdown is true and the category is not being updated, display the category dropdown */}
          {showCategoryDropdown && !isLoadingChangeCategory && (
            <DropdownWrapper>
              <button onClick={() => setShowCategoryDropdown(false)}>X</button>
              <StyledSelect value={categoryId} onChange={(e) => handleCategoryChange(e)}>
                {selectableCategories.map((category) => (
                  <option key={category.categoryId} value={category.categoryId}>
                    {category.categoryName}
                  </option>
                ))}
              </StyledSelect>
            </DropdownWrapper>
          )}
        </CategoryNameSpan>
        <DueDateDiv>
          {user.userSettings.enableNotifications && (
            <Link to={`/taskNotifications/${taskId}`}>
              <NotificationButton>
                <MdNotifications />
              </NotificationButton>
            </Link>
          )}
          {/* If the task due date is being updated, display the loading spinner */}
          {isLoadingChangeDueDate ? (
            <Spinner />
          ) : (
            <DueDate onClick={() => setShowChangeDueDateModal(true)}>
              Due: {taskDueDate === 0 ? "N/A" : dueDate.toLocaleDateString()}{" "}
              {taskDueDate === 0
                ? ""
                : dueDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
            </DueDate>
          )}
        </DueDateDiv>
      </Header>
      <Title>
        {/* If the task title is being updated, display the loading spinner */}
        {isLoadingUpdateTaskTitle ? (
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
          <TaskTitle onClick={handleTitleClick}>{taskTitle}</TaskTitle>
        )}
        {/* If the task is complete, display the checkmark box */}
        {isLoadingCompleteTask ? (
          <Spinner />
        ) : (
          <CheckBox isComplete={taskCompleted} onClick={handleCheckboxToggle} style={{ marginLeft: "20px" }} />
        )}
      </Title>
      <NotesHeaderWrapper>
        <NotesLabel>Notes</NotesLabel>
        {/* If the task notes are not being edited, display the EditButton icon */}
        {!isEditingNotes ? (
          <EditButton
            onClick={() => {
              setIsEditingNotes(true);
              setError("");
            }}
          >
            <MdEdit />
          </EditButton>
        ) : (
          // If the task notes are being edited, display the SaveButton icon
          <SaveButton
            onClick={() => {
              setIsEditingNotes(false);
              handleNotesUpdate();
            }}
          >
            <MdSave />
          </SaveButton>
        )}
      </NotesHeaderWrapper>
      {/* If the task notes are being edited, display the notes textarea field */}
      {isEditingNotes ? (
        <StyledTextArea
          autoFocus
          onFocus={(e) => {
            e.target.setSelectionRange(e.target.value.length, e.target.value.length);
          }}
          value={isLoadingUpdateTaskNotes ? "loading..." : newNotes}
          onChange={(e) => setNewNotes(e.target.value)}
        />
      ) : (
        // If the task notes are not being edited, display the notes
        <NotesDisplay>
          {/* If the task notes are being updated, display "loading..." */}
          {taskNotes.split("\n").map((note, index) => (
            <div key={index}>{isLoadingUpdateTaskNotes ? "loading..." : note}</div>
          ))}
        </NotesDisplay>
      )}
      {/* If there is an error, display the error message */}
      {error && <div style={{ color: "red" }}>{error}</div>}
      <div style={{ display: "flex" }}>
        {/* If the task is being deleted, display the loading spinner */}
        {isLoadingDeleteTask ? (
          <Spinner />
        ) : (
          <DeleteButton
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(taskId, taskTitle);
            }}
          >
            <MdDelete />
          </DeleteButton>
        )}
        <div style={{ width: "600px" }} />
        <SettingsButton />
      </div>
      {/* Conitionally render the change due date modal */}
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
      {/* Conitionally render the change due date modal */}
      {showChangeDueDateModal && (
        <ChangeDueDateModal
          currentDueDate={taskDueDate}
          onClose={() => setShowChangeDueDateModal(false)}
          onSave={handleDueDateChange}
        />
      )}
      <SettingsButton style={{ marginLeft: "auto", marginTop: "16rem" }} />
    </PageContainer>
  );
};

export default UserTaskPage;
