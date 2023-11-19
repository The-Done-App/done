/** =========================================================================================
 * Filename: BackButton.tsx
 *
 * Description: This component provides a back button for navigation.
 *
 * Contains:
 * - Back button
 ========================================================================================= */

import { MdArrowBack } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

// Styled component for the back button container
const BackButtonContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: right;
`;

// Styled component for the back button box
const BackButtonBox = styled.div`
  background-color: #dadada;
  color: #515151;
  border: none;
  padding-top: 4px;
  padding-left: 4px;
  padding-right: 4px;
  font-size: 16px;
  border: 2px solid #000000;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease-in-out;
  margin-right: 50px;
  &:hover {
    color: #69c1ff;
  }
`;

// Functional component for the BackButton
const BackButton: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => {
  // Use the navigate hook from react-router-dom
  const navigate = useNavigate();
  // Return the JSX for the BackButton
  return (
    <BackButtonContainer {...props}>
      {/* Navigate back to the previous page when the BackButton is clicked */}
      <BackButtonBox onClick={() => navigate(-1)}>
        <MdArrowBack size="3rem" />
      </BackButtonBox>
    </BackButtonContainer>
  );
};

export default BackButton;
