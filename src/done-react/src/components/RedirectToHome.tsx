/** =========================================================================================
 * Filename: RedirectToHome.tsx
 *
 * Description: This is an invisible component that
 * redirects the user to the home page.
 *
 * Contains:
 * - useEffect hook to redirect to home page
 ========================================================================================= */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Functional component for the RedirectToHome component
const RedirectToHome: React.FC = () => {
  // Use the navigate hook from react-router-dom
  const navigate = useNavigate();

  // Redirect to the home page when the component mounts
  useEffect(() => {
    navigate("/");
  }, [navigate]);

  // Return null since this component is invisible
  return null;
};

export default RedirectToHome;
