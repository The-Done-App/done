/** =========================================================================================
 * Filename: LoadingSpinner.tsx
 *
 * Description: This component displays a loading spinner.
 * It is used when making API calls to indicate that results are loading.
 *
 * Contains:
 * - Loading spinner
 ========================================================================================= */

import styled, { keyframes } from "styled-components";

// Keyframes for the loading spinner animation
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Styled component for the loading spinner. This uses the keyframes defined above to animate the spinner.
const Spinner = styled.div`
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-top-color: #636363;
  animation: ${spin} 1s ease-in-out infinite;
`;

export default Spinner;
