/** =========================================================================================
 * Filename: apiFetch.ts
 *
 * Description: This file contains a function that can be used to make authenticated
 * API calls to the backend API. It uses the AWS Amplify library to get the JWT token
 * from the Cognito User Pool and then uses that token to make the API call.
 ========================================================================================= */

import { Auth } from "aws-amplify";
import { httpMethod } from "./types";

// QueryParam is a type that represents a query parameter in a URL
interface QueryParam {
  key: string;
  value: string;
}

// ApiResponse is a type that represents the response from the API
// The type in the body property is generic and can be set to any type
interface ApiResponse<T> {
  status: number;
  body: T;
}

// apiFetch is a function that makes an authenticated API call to the backend API
const apiFetch = async <T>(
  resource: string,
  method: httpMethod,
  userId: string,
  body?: string,
  queryParams?: QueryParam[],
): Promise<ApiResponse<T> | null> => {
  // Create a URLSearchParams object from the query parameters
  const params = new URLSearchParams();
  // Add each query parameter to the URLSearchParams object
  if (queryParams) {
    for (const { key, value } of queryParams) {
      params.append(key, value);
    }
  }

  // Get the JWT token from the Cognito User Pool
  const jwtToken = await Auth.currentSession()
    .then((session) => session.getIdToken().getJwtToken())
    .catch((error) => {
      console.error("Error fetching JWT token:", error);
      throw error;
    });

  // Create the URL for the API call using the environment variable for the API URL and the passed in properties
  const url = `${import.meta.env.VITE_API_URL}/${resource}${queryParams ? `?${params.toString()}` : ""}`;
  try {
    // Make the API call using the fetch API
    const response = await fetch(url, {
      method,
      // Set the headers for the API call
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
        "X-User-Id": userId,
      },
      body,
    });
    // If the response status is 200, return the response body as an ApiResponse object
    if (response.status === 200) {
      return { status: response.status, body: await response.json() } as ApiResponse<T>;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error with ${resource} ${method}:`, error);
    throw error;
  }
};

export default apiFetch;
