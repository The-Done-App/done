#!/bin/bash

##########################################################################
# This script uploads the Google Identity Provider
# details to AWS Secrets Manager from local environment variables.
#
# Instructions:
# 1. Ensure AWS CLI is installed
# 2. Set the following environment variables using the OAuth client
#    ID and secret from the Google Cloud Console:
#
# export GOOGLE_CLIENT_ID=<client-id>
# export GOOGLE_CLIENT_SECRET=<client-secret>
#
# 4. Run the script using source (i.e. `source ./deploy-idp-secrets.sh`)
##########################################################################

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "This script is being executed directly. Please source it instead:"
    echo "source ./deploy-idp-secrets.sh"
    exit 1
fi

# Function to validate if a variable is set
validate_variable() {
    # $1 and $2 are the first and second arguments passed to the function
    # local is used to define a variable that is only accessible within the function
    local var_value=$1
    local var_name=$2
    # -z checks if the length of the string is zero
    if [ -z "$var_value" ]; then
        echo "Error: $var_name is not set. Please run 'export $var_name=\"<value>\"' and try again."
        return 1
    fi
}

# Function to validate if GOOGLE_CLIENT_ID has the correct format
validate_client_id_format() {
    local client_id=$1
    local required_suffix=".apps.googleusercontent.com"
    if [[ $client_id != *"$required_suffix" ]]; then
        echo "Bad format: GOOGLE_CLIENT_ID does not end with '$required_suffix'."
        return 1
    fi
}

# Function to validate if GOOGLE_CLIENT_SECRET has the correct format
validate_client_secret_format() {
    local client_secret=$1
    local regex='^[A-Za-z0-9_-]+$'
    local min_length=10

    if [ ${#client_secret} -lt $min_length ]; then
        echo "Error: GOOGLE_CLIENT_SECRET seems too short. Please check its value."
        return 1
    fi

    if ! [[ $client_secret =~ $regex ]]; then
        echo "Error: GOOGLE_CLIENT_SECRET is not in the correct format. It should contain only alphanumeric characters, dashes (-), or underscores (_)."
        return 1
    fi
}

# Ensure AWS CLI is installed. Send output to /dev/null to hide it.
if ! command -v aws &> /dev/null
then
    echo "AWS CLI is not installed. Please install it first."
    return 1
fi

# Validate GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
validate_variable "$GOOGLE_CLIENT_ID" "GOOGLE_CLIENT_ID" || return 1
validate_client_id_format "$GOOGLE_CLIENT_ID" || return 1
validate_variable "$GOOGLE_CLIENT_SECRET" "GOOGLE_CLIENT_SECRET" || return 1
validate_client_secret_format "$GOOGLE_CLIENT_SECRET" || return 1

# Define the secret name in AWS Secrets Manager
SECRET_NAME="google-idp"

# Create a JSON payload with the secrets
SECRET_PAYLOAD="{
  \"GOOGLE_CLIENT_SECRET\":\"$GOOGLE_CLIENT_SECRET\",
  \"GOOGLE_CLIENT_ID\":\"$GOOGLE_CLIENT_ID\"
}"

echo "Uploading Identity Provider IDs to AWS Secrets Manager..."
# Upload to AWS Secrets Manager and capture the ARN. Use --query 'ARN' and --output text to return the ARN 
# from the response as a string.
IDP_SECRETS_ARN=$(aws secretsmanager create-secret --name "$SECRET_NAME" --description "My Application Secrets" --secret-string "$SECRET_PAYLOAD" --query 'ARN' --output text)

# -z checks if the length of the string is zero
if [ -z "$IDP_SECRETS_ARN" ]; then
    echo "Secrets upload failed! Please check the AWS CLI output. The ARN was not returned."
    return 1
else
    # Export the ARN as an environment variable
    echo "Running: 'export IDP_SECRETS_ARN=$IDP_SECRETS_ARN'"
    export IDP_SECRETS_ARN=$IDP_SECRETS_ARN
    echo "Identity Provider IDs ARN has been saved as a local environment variable. This will be used on CDK deployment."
    echo "WARNING: This env variable will not persist after the terminal session ends."
fi