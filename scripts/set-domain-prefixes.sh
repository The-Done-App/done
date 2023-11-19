#!/bin/bash

####################################################################################################
# https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-assign-domain.html
#
# Cognito user pool domains are used by the app to authenticate users (Users will be redirected
# here from the Google Sign-in page to complete the sign in process).
# 
# This script sets the domain prefixes for the AWS Cognito Domain URLs as local environment variables.
# These will be used on CDK deployment.
####################################################################################################

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "This script is being executed directly. Please source it instead:"
    echo "source ./set-domain-prefixes.sh"
    exit 1
fi

echo "Setting domain prefixes for the AWS Cognito Domains..."

# Generate a random 10-character alphanumeric string
# https://unix.stackexchange.com/questions/230673/how-to-generate-a-random-string
#
# LC_ALL=C is used to set the locale to the default locale. This is done to avoid errors when
# using tr to remove special characters from the random string.
#
# The tr command removes special characters from the random string.
#
# </dev/urandom is used to read from /dev/urandom as the source of random data.
#
# The head command limits the output to 10 characters.
PREPROD_DOMAIN_PREFIX="done-preprod-$(LC_ALL=C tr -dc 'a-z0-9' </dev/urandom | head -c 10)"
PROD_DOMAIN_PREFIX="done-prod-$(LC_ALL=C tr -dc 'a-z0-9' </dev/urandom | head -c 10)"

echo "Running: 'export PREPROD_DOMAIN_PREFIX=$PREPROD_DOMAIN_PREFIX'"
export PREPROD_DOMAIN_PREFIX=$PREPROD_DOMAIN_PREFIX

echo "Running: 'export PROD_DOMAIN_PREFIX=$PROD_DOMAIN_PREFIX'"
export PROD_DOMAIN_PREFIX=$PROD_DOMAIN_PREFIX

echo "Domain prefixes have been saved as local environment variables. These will be used on CDK deployment."
echo "WARNING: These will not persist after the terminal session ends."