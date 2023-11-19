# Done React Application

## Overview

This application is a simple todo list application built with React and deployed by the parent CDK application.
During deployment, the CDK application will build the React application and deploy it to an S3 bucket.

Authentication is provided by Cognito which is connected to using the Amplify library. Environment variables for
the Amplify configuration are provided by the CDK application.

While the application is specifically built as a todo list, the intent is to provide a simple example of a React
application that can be deployed by the CDK application. The authentication features and API calls could easily be
tailored to fit other applications.

## Running the application locally

`vite --port 8000`
