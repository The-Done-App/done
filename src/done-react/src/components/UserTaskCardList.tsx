/** =========================================================================================
 * Filename: UserTaskCardList.tsx
 *
 * Description: This component manages the display of user tasks as a list of cards,
 * with support for sorting tasks by date or category. It dynamically groups tasks
 * when the category sort mode is enabled and sorts by date otherwise. Each task is
 * represented by a UserTaskCard component.
 *
 * Contains:
 * - Dynamic category headers for task grouping
 * - UserTaskCard components for individual tasks
 * - Task sorting functionality
  ========================================================================================= */

import React from "react";
import styled from "styled-components";
import useUser from "../useUser";
import { UserTask } from "../userType";
import UserTaskCard from "./UserTaskCard";

// Styled component for the task list container
const TaskListContainer = styled.div`
  width: 100%;
  overflow-y: auto;
`;

// Styled component for the category header
const CategoryHeader = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  margin-top: 1rem;
  margin-left: 2rem;
`;

// Interface for the props that the UserTaskCardList component will accept
interface UserTaskCardListProps {
  onDeleteClick: (taskId: string, taskTitle: string) => void;
}

// Functional component for the UserTaskCardList a destructured prop
const UserTaskCardList: React.FC<UserTaskCardListProps> = ({ onDeleteClick }) => {
  // Use the useUser hook to access the user data
  const { user } = useUser();

  // Get the user's tasks and sort mode
  let userTasks = user?.userTasks || [];
  const sortMode = user?.userSettings?.sortMode;

  // Function to sort tasks by date
  const sortByDate = (tasks: UserTask[]) => {
    // Sort tasks by date, with tasks with no due date at the bottom
    return tasks.sort((a: UserTask, b: UserTask) => {
      // If a task has no due date, sort it to the bottom
      if (a.taskDueDate === 0) return 1;
      if (b.taskDueDate === 0) return -1;
      // Use a simple subtraction operator to sort tasks by date (since they are of type number)
      return a.taskDueDate - b.taskDueDate;
    });
  };

  // Function to sort tasks by category
  const sortByCategory = (tasks: UserTask[]) => {
    // Sort tasks by category
    return tasks.sort((a: UserTask, b: UserTask) => {
      // Use the localeCompare function to sort based on category equivalence to group by category
      return (a.categoryId || "").localeCompare(b.categoryId || "");
    });
  };

  // Sort tasks based on the sort mode
  if (sortMode === "date") {
    // Sort tasks by date
    userTasks = sortByDate([...userTasks]);
  } else if (sortMode === "category") {
    // Sort tasks by category
    userTasks = sortByCategory([...userTasks]);
  }

  // Initialize an object to hold categorized tasks
  const categorizedTasks: { [key: string]: UserTask[] } = {};

  // Iterate through each task and add it to the categorizedTasks object within the array for its category
  userTasks.forEach((task) => {
    // If the array for the task's category does not exist, initialize it
    if (!categorizedTasks[task.categoryId]) {
      categorizedTasks[task.categoryId] = [];
    }
    // Add the task to the array for its category
    categorizedTasks[task.categoryId].push(task);
  });

  // Sort tasks by date within each category
  Object.keys(categorizedTasks).forEach((categoryId) => {
    categorizedTasks[categoryId] = sortByDate(categorizedTasks[categoryId]);
  });

  // Sort category keys by category name
  const sortedCategoryKeys = Object.keys(categorizedTasks).sort((a, b) => {
    // Get the category name for each category ID (or "Uncategorized" if the category is not found)
    const nameA = user?.userCategories.find((cat) => cat.categoryId === a)?.categoryName || "Uncategorized";
    const nameB = user?.userCategories.find((cat) => cat.categoryId === b)?.categoryName || "Uncategorized";

    // Sort Uncategorized to the bottom
    if (nameA === "Uncategorized") return 1;
    if (nameB === "Uncategorized") return -1;
    // Use the localeCompare function to sort the tasks based on category name
    return nameA.localeCompare(nameB);
  });

  // Return the JSX elements for rendering the component
  return (
    <TaskListContainer>
      {/* If the sort mode is category, display category headers */}
      {sortMode === "category"
        ? sortedCategoryKeys.map((categoryId) => {
            const categoryName =
              user?.userCategories.find((cat) => cat.categoryId === categoryId)?.categoryName || "Uncategorized";
            return (
              <div key={categoryId}>
                <CategoryHeader>{categoryName}</CategoryHeader>
                {categorizedTasks[categoryId].map((task) => (
                  <UserTaskCard
                    key={task.taskId}
                    twelveHour={user.userSettings.twelveHour}
                    {...task}
                    onDeleteClick={onDeleteClick}
                  />
                ))}
              </div>
            );
          })
        : // If the sort mode is not category, display tasks without category headers (they are already sorted by date)
          userTasks.map((task) => (
            <UserTaskCard
              key={task.taskId}
              twelveHour={user.userSettings.twelveHour}
              {...task}
              onDeleteClick={onDeleteClick}
            />
          ))}
      <div style={{ height: 60 }} />
    </TaskListContainer>
  );
};

export default UserTaskCardList;
