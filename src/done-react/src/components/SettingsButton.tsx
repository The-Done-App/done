/** =========================================================================================
 * Filename: SettingsButton.tsx
 *
 * Description: This component displays a button that links to the user settings page.
 *
 * Contains:
 * - Settings button
 ========================================================================================= */

import { CSSProperties } from "react";
import { MdSettings } from "react-icons/md";
import { Link } from "react-router-dom";
import styled from "styled-components";

// Styled component for the settings button container
const SettingsContainer = styled.div`
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: right;
`;

// Styled component for the settings button box
const SettingsBox = styled.div`
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

// Functional component for the SettingsButton used to navigate to the user settings page
const SettingsButton: React.FC<{ style?: CSSProperties }> = ({ style, ...props }) => {
  return (
    <SettingsContainer style={style} {...props}>
      {/* Navigate to the user settings page when the SettingsButton is clicked */}
      <Link to={"/userSettings"}>
        <SettingsBox>
          <MdSettings size="3rem" />
        </SettingsBox>
      </Link>
    </SettingsContainer>
  );
};

export default SettingsButton;
