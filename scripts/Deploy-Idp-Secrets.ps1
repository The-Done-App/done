# deploy-idp-secrets.ps1

<#
.SYNOPSIS
This script uploads the Google Identity Provider details to AWS Secrets Manager from local environment variables.

.DESCRIPTION
This script requires that the AWS CLI is installed and certain environment variables are set before running. 
The following environment variables must be set using the OAuth client ID and secret from the Google Cloud Console:
   $env:GOOGLE_CLIENT_ID = "<client-id>"
   $env:GOOGLE_CLIENT_SECRET = "<client-secret>"
Run the script using PowerShell to upload these details to AWS Secrets Manager and set the ARN of the secret as a
local environment variable.
#>

# Function to validate if a variable is set
function Test-Variable {
  param (
    [string]$VarValue,
    [string]$VarName
  )
  
  if (-not $VarValue) {
    Write-Host "Error: $VarName is not set. Please set $VarName and try again."
    return $false
  }
  
  return $true
}

# Function to validate if GOOGLE_CLIENT_ID has the correct format
function Test-ClientID-Format {
  param (
    [string]$ClientID
  )
  
  $RequiredSuffix = ".apps.googleusercontent.com"
  
  if (-not $ClientID.EndsWith($RequiredSuffix)) {
    Write-Host "Bad format: GOOGLE_CLIENT_ID does not end with '$RequiredSuffix'."
    return $false
  }
  
  return $true
}

# Function to validate if GOOGLE_CLIENT_SECRET has the correct format
function Test-ClientSecret-Format {
  param (
    [string]$ClientSecret
  )
  
  $Regex = '^[A-Za-z0-9_-]+$'
  $MinLength = 10
  
  if ($ClientSecret.Length -lt $MinLength) {
    Write-Host "Error: GOOGLE_CLIENT_SECRET seems too short. Please check its value."
    return $false
  }
  
  if (-not ($ClientSecret -match $Regex)) {
    Write-Host "Error: GOOGLE_CLIENT_SECRET is not in the correct format. It should contain only alphanumeric characters, dashes (-), or underscores (_)."
    return $false
  }
  
  return $true
}

# Ensure AWS CLI is installed.
if (-not (Test-Path -Path "C:\Program Files\Amazon\AWSCLIV2\aws.exe")) {
  Write-Host "AWS CLI is not installed. Please install it first."
  return
}

# Validate GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
if (-not (Validate-Variable $env:GOOGLE_CLIENT_ID "GOOGLE_CLIENT_ID") -or
  -not (Validate-ClientID-Format $env:GOOGLE_CLIENT_ID) -or
  -not (Validate-Variable $env:GOOGLE_CLIENT_SECRET "GOOGLE_CLIENT_SECRET") -or
  -not (Validate-ClientSecret-Format $env:GOOGLE_CLIENT_SECRET)) {
  return
}

# Define the secret name in AWS Secrets Manager
$SecretName = "google-idp"

# Create a JSON payload with the secrets
$SecretPayload = @{
  GOOGLE_CLIENT_SECRET = $env:GOOGLE_CLIENT_SECRET
  GOOGLE_CLIENT_ID     = $env:GOOGLE_CLIENT_ID
} | ConvertTo-Json

Write-Host "Uploading Identity Provider IDs to AWS Secrets Manager..."

# Upload to AWS Secrets Manager and capture the ARN.
$IDPSecretARN = (aws secretsmanager create-secret --name $SecretName --description "My Application Secrets" --secret-string $SecretPayload --query 'ARN' --output text).Trim()

if (-not $IDPSecretARN) {
  Write-Host "Secrets upload failed! Please check the AWS CLI output. The ARN was not returned."
  return
}
else {
  Write-Host "Running: 'Set-Item -Path Env:IDP_SECRETS_ARN -Value $IDPSecretARN'"
  Set-Item -Path Env:IDP_SECRETS_ARN -Value $IDPSecretARN
  Write-Host "Identity Provider IDs ARN has been saved as a local environment variable. This will be used on CDK deployment."
  Write-Host "WARNING: This environment variable will not persist after the terminal session ends."
}
