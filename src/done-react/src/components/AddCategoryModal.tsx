/** =========================================================================================
 * Filename: AddCategoryModal.tsx
 *
 * Description: This component provides a modal for adding a new category.
 *
 * Contains:
 * - Field for category name
 * - Add button
 * - Cancel button
========================================================================================= */

import React, { useState } from "react";
import styled from "styled-components";
import validator from "validator";
import AddItemButton from "./AddItemButton";

// Styled-component for the modal's background overlay
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

// Styled-component for the modal's content area
const ModalContentDiv = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 300px;
`;

// Styled-component for the individual input fields within the modal
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

// TypeScript interface to define props for the AddCategoryModal component
interface AddCategoryModalProps {
  onClose: () => void;
  onAddCategory: (categoryName: string) => void;
  existingCategories: string[];
}

// Functional component for the AddCategoryModal
const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ onClose, onAddCategory, existingCategories }) => {
  // State variables for the category name and error message
  const [categoryName, setCategoryName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Function to handle the submission of the new category
  const handleSubmit = () => {
    // Validation checks for the category name
    if (categoryName.length < 3) {
      setError("Category name should be at least 3 characters long.");
      return;
    }
    if (categoryName.length > 20) {
      setError("Category name should be at most 20 characters long.");
      return;
    }
    // Uses validator library to check if the category name is alphanumeric
    if (!validator.isAlphanumeric(categoryName)) {
      setError("Category name should only contain letters and numbers.");
      return;
    }
    // Checks if category name is already in use or reserved
    if (existingCategories.includes(categoryName) || categoryName === "Uncategorized") {
      setError("Category name already exists or is reserved.");
      return;
    }
    // If all checks pass, calls the onAddCategory function that is passed in as a prop
    onAddCategory(categoryName);
    // Calls the onClose function prop to close the modal
    onClose();
  };

  // Returns the JSX elements to be rendered
  return (
    <ModalBackgroundDiv>
      <ModalContentDiv>
        <h2>Add New Category</h2>
        {error && <div style={{ color: "red" }}>{error}</div>}
        <FieldDiv>
          <label>
            Category Name{" "}
            <span style={{ color: "red" }} title="This field is required.">
              *
            </span>
          </label>
          <StyledInput type="text" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
        </FieldDiv>
        <div style={{ display: "flex" }}>
          <AddItemButton label="Add" onClick={handleSubmit} />
          <AddItemButton label="Cancel" onClick={onClose} />
        </div>
      </ModalContentDiv>
    </ModalBackgroundDiv>
  );
};

export default AddCategoryModal;
