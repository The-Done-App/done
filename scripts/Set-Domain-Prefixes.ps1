# Set-Domain-Prefixes.ps1

<#
.SYNOPSIS
Sets the domain prefixes for AWS Cognito Domain URLs as local environment variables for use in CDK deployment.
.NOTES
Cognito user pool domains are used by the app to authenticate users (Users will be redirected
here from the Google Sign-in page to complete the sign-in process).
#>

Write-Host "Setting domain prefixes for the AWS Cognito Domains..."

# Generate a random 10-character alphanumeric string
$AlphanumericCharacters = "abcdefghijklmnopqrstuvwxyz0123456789"
$PreprodDomainPrefix = "done-preprod-" + (-join ($AlphanumericCharacters.ToCharArray() | Get-Random -Count 10))
$ProdDomainPrefix = "done-prod-" + (-join ($AlphanumericCharacters.ToCharArray() | Get-Random -Count 10))

Write-Host "Running: 'Set-Item -Path Env:PREPROD_DOMAIN_PREFIX -Value $PreprodDomainPrefix'"
Set-Item -Path Env:PREPROD_DOMAIN_PREFIX -Value $PreprodDomainPrefix

Write-Host "Running: 'Set-Item -Path Env:PROD_DOMAIN_PREFIX -Value $ProdDomainPrefix'"
Set-Item -Path Env:PROD_DOMAIN_PREFIX -Value $ProdDomainPrefix

Write-Host "Domain prefixes have been saved as local environment variables. These will be used on CDK deployment."
Write-Host "WARNING: These will not persist after the terminal session ends."
