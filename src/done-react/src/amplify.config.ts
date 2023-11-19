/** =========================================================================================
 * Filename: amplify.config.ts
 *
 * Description: Amplify configuration file. The configuration object (amplifyConfig)
 * tells the Amplify library how to connect from the React app to the AWS Cognito
 * Pool deployed by the CDK application for authentication.
 ========================================================================================= */

const amplifyConfig = {
  Auth: {
    // Get the region, user pool ID, and app client ID from the environment variables
    region: import.meta.env.VITE_AWS_REGION,
    userPoolId: import.meta.env.VITE_USER_POOL_ID,
    userPoolWebClientId: import.meta.env.VITE_APP_CLIENT_ID,
    oauth: {
      // Set the domain based on the domain and region environment variables
      domain: `${import.meta.env.VITE_COGNITO_DOMAIN}.auth.${import.meta.env.VITE_AWS_REGION}.amazoncognito.com`,
      scope: ["email", "profile", "openid"],
      // Set the redirectSignIn and redirectSignOut URLs based on the NODE_ENV and FRONTEND_URL environment variable
      redirectSignIn:
        import.meta.env.VITE_NODE_ENV === "development"
          ? "http://localhost:8000"
          : `https://${import.meta.env.VITE_FRONTEND_URL}`,
      redirectSignOut:
        import.meta.env.VITE_NODE_ENV === "development"
          ? "http://localhost:8000"
          : `https://${import.meta.env.VITE_FRONTEND_URL}`,
      responseType: "code",
    },
  },
};

export default amplifyConfig;
