/** =========================================================================================
 * Filename: error-page.tsx
 *
 * Description: This component displays the error page when a user tries
 * to access a page that doesn't exist.
 *
 * Contains:
 * - Error title
 * - Error message
 ========================================================================================= */

import { useRouteError } from "react-router-dom";
import styled from "styled-components";

// Styled component for the error page container
const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh - 40vh;
  background: linear-gradient(135deg, #f9f9f9, #e9e9e9);
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
`;

// Styled component for the error title
const ErrorTitle = styled.h1`
  font-size: 2.5rem;
  color: rgb(169, 142, 255);
  margin-bottom: 1rem;
`;

// Styled component for the error message
const ErrorMessage = styled.p`
  font-size: 1.2rem;
  color: #555;
  text-align: center;
`;

// Functional component for the error page
const ErrorPage = () => {
  // Use the useRouteError hook to access the error object
  const error = useRouteError();
  // Log the error to the console
  console.error(error);

  // Return the JSX elements for the error page
  return (
    <ErrorContainer>
      <ErrorTitle>404 Not Found</ErrorTitle>
      <ErrorMessage>Sorry, the page you are looking for doesn't exist or has been moved.</ErrorMessage>
    </ErrorContainer>
  );
};

export default ErrorPage;
