/** =========================================================================================
 * Filename: CheckMarkBox.tsx
 *
 * Description: This component displays a checkbox with a checkmark
 * for marking a task as complete.
 *
 * Contains:
 * - Checkmark box
 ========================================================================================= */

import styled from "styled-components";

// Styled component for the checkbox
const iconHeight = "2rem";
const CheckSquare = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${iconHeight};
  height: ${iconHeight};
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 1rem;
  border: 2px solid #00b3ff;
  background: linear-gradient(135deg, #dbfbff, #e2e2e2);
  box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 3px 3px 3px rgba(0, 0, 0, 0.4);
  }
`;

// The CheckMark component is a styled SVG element. The polyline
// element for the checkmark is defined below when the component is used.
const CheckMark = styled.svg.attrs({
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
})`
  width: 2rem;
  height: 2rem;
  stroke: #00b3ff;
  stroke-width: 6;
`;

// Type definition for the props that the CheckMarkBox component will accept
interface CheckBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  isComplete: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

// Functional component for the CheckMarkBox with destructured props
const CheckBox: React.FC<CheckBoxProps> = ({ isComplete, onClick, ...props }) => {
  return (
    <CheckSquare onClick={onClick} {...props}>
      {/* Conditional rendering for the checkmark */}
      {isComplete && (
        <CheckMark>
          <polyline points="22 2 9 19 2 10" />
        </CheckMark>
      )}
    </CheckSquare>
  );
};

export default CheckBox;
