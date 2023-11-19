/** =========================================================================================
 * Filename: lambdaAuthorizer.ts
 * 
 * Description: Lambda code for the function to authorize API requests using JWT tokens from
 * the Google Identity Platform. Also verifies the user ID from the token matches the request
 * header "X-User-Id" to ensure data security/privacy.
========================================================================================= */

import { APIGatewayAuthorizerResult, APIGatewayRequestAuthorizerEvent } from "aws-lambda";
import * as jwt from "jsonwebtoken";
import * as jwksClient from "jwks-rsa";

// Default deny all policy
const defaultDenyAllPolicy: APIGatewayAuthorizerResult = {
  principalId: "user",
  policyDocument: {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "execute-api:Invoke",
        Effect: "Deny",
        Resource: "*",
      },
    ],
  },
};

// Define the interface for the IAM Policy Statement
interface PolicyStatement {
  Action: string;
  Effect: string;
  Resource: string;
}

// Generate the IAM Policy Statement which will allow the user to invoke the API Gateway
const generatePolicyStatement = (apiArn: string, action: string): PolicyStatement => {
  const statement: PolicyStatement = {
    Action: "execute-api:Invoke",
    Effect: action,
    Resource: `${apiArn}`,
  };
  return statement;
};

// Generate the IAM Policy to be returned to the API Gateway for authorization
const generatePolicy = (principalId: string, policyStatement: PolicyStatement): APIGatewayAuthorizerResult => {
  const authResponse: APIGatewayAuthorizerResult = {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [policyStatement],
    },
  };
  return authResponse;
};

const verifyAccessToken = async (accessToken: string): Promise<jwt.JwtPayload> => {
  // Fetch the KID attribute from your JWKS Endpoint to verify its integrity
  const client = jwksClient({ jwksUri: process.env.JWKS_ENDPOINT! });
  const key = await client.getSigningKeys();
  const signingKey = key[0].getPublicKey();
  const decoded: jwt.JwtPayload = jwt.verify(accessToken, signingKey) as jwt.JwtPayload;
  return decoded;
};

// Generate the IAM Policy to be returned to the API Gateway for authorization
const generateIAMPolicy = (): APIGatewayAuthorizerResult => {
  const policyStatement: PolicyStatement = generatePolicyStatement(
    `arn:aws:execute-api:${process.env.AWS_REGION}:${process.env.ACCOUNT_ID}:${process.env.API_ID}/*`,
    "Allow",
  );

  // Check if no policy statements are generated, if so, create default deny all policy statement
  if (!policyStatement) {
    return defaultDenyAllPolicy;
  } else {
    return generatePolicy("user", policyStatement);
  }
};

/** =========================================================================================
 * The Lambda handler is the entry point into the lambda function. The function takes an event
 * sent by the API Gateway and returns an IAM Policy to the API Gateway for authorization.
========================================================================================= */
export const handler = async (event: APIGatewayRequestAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  console.log(`Processing ${event.httpMethod} request for ${event.path}`);
  // Declare Policy
  let authResponse: APIGatewayAuthorizerResult | null = null;
  // Check if Authorization header is present
  if (!event.headers?.Authorization || !(event.headers["X-User-Id"] || event.headers["x-user-id"])) {
    throw new Error("Unauthorized");
  }
  const userId = event.headers["X-User-Id"] || event.headers["x-user-id"];
  // Capture raw token and trim 'Bearer ' string, if present
  const token = event.headers.Authorization.split(" ")[1];
  // Validate token
  try {
    const decoded = await verifyAccessToken(token);
    // Retrieve token scopes
    // Retrieve user ID from decoded token
    const sub = decoded.sub;
    // Verify that the user ID matches the request header "X-User-Id"
    if (userId !== sub) {
      throw new Error("Unauthorized");
    }
    console.log(`User authorization decision: authorized`);
    // Generate IAM Policy
    authResponse = generateIAMPolicy();
  } catch (err) {
    console.error(`User authorization decision: denied. Error: ${err}`);
    // If token is invalid, return default deny all policy
    authResponse = defaultDenyAllPolicy;
  }
  // Check if authResponse is null, if so, throw error
  if (!authResponse) {
    throw new Error("Unauthorized");
  }
  // Return the IAM Policy to the API Gateway for authorization
  return authResponse;
};
