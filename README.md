# Done - _Modern DevOps with Cloud Native Tools_

## Project Overview

This project aims to provide a detailed example of modern DevOps tools and software architecture. We will explore the following topics:

- Infrastructure as Code (IaC)
- Continuous Integration / Continuous Delivery (CI/CD)
- Serverless Architecture in AWS

### Infrastructure as Code (IaC) and CI/CD

The project holds an AWS CDK (Cloud Development Kit) application that demonstrates how to deploy an AWS native CI/CD pipeline to AWS using infrastructure as code (IaC). This uses the [CDK Pipelines](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.pipelines-readme.html) module to define the pipeline as code while also allowing the pipeline to deploy itself (self-mutating).

The pipeline includes two nearly identical environment stages: PreProd and Prod. The Prod stage is used for the production application. Before any changes reach the Prod environment, integration testing against the PreProd environment is performed. If these tests fail, the pipeline will stop and the changes will not be deployed to the Prod environment.

Using this architecture, we can rapidly deploy changes with confidence.

All of the infrastructure is serverless and the application is highly available and scalable.

### Backend Architecture

The pipeline deploys the necessary infrastructure for a simple React application that uses Google Sign-In with Cognito to authenticate users. The application uses API Gateway, AWS Lambda, and DynamoDB for the backend architecture to store and retrieve application data.

### Frontend Architecture

The React application is a simple to-do list application that is hosted in an S3 bucket and served through CloudFront.

## Tools and Account Setup

_Note: These instructions include macOSX and Windows instructions. If you are using Linux, you should be able to follow the macOSX instructions. Windows users should use PowerShell (or Windows Terminal with PowerShell)_

### Installing Pre-requisites

These tools are required to run the project. If you already have them installed, you can skip to the next section.
Install the following tools and verify using the Terminal (or PowerShell for Windows).

#### AWS CLI (Required)

Download and install the appropriate version for your operating system from the following site: https://aws.amazon.com/cli/. Verify the installation by running `aws --version` in the Terminal.

```sh
aws --version
```

#### Node.js (Required)

Node.js is a JavaScript runtime that is used by the AWS CDK. Download and install the latest LTS version from their website: https://nodejs.org/en/download/. Verify the installation by running `node -v` and `npm -v` (npm is the Node Package Manager).

```sh
node -v
npm -v
```

#### AWS CDK (Required)

_Note: If you run into permission issues using `npm`, there should be on screen instructions to fix the issue (using sudo is not recommended)._

Use the Node Package Manager to install the AWS CDK globally:

```sh
npm install -g aws-cdk
```

Verify the installation by running:

```sh
cdk --version
```

#### Git (Required)

Git is a version control system for tracking changes in source code. This is required for cloning the repository and pushing changes to the CodeCommit repository. Download and install the latest version from their website: https://git-scm.com/downloads. Verify the installation by running:

```sh
git --version
```

#### Python (Required)

Python comes with the `pip` package manager. This will be used for installing the git-remote-codecommit package. Download and install the latest version from their website: https://www.python.org/downloads/. **For Windows, be sure to select the checkbox for `Add to PATH` so that pip is available in the command line.** Verify the installation by running `pip --version` or `pip3 --version`.

```sh
pip --version
```

#### Visual Studio Code (Optional IDE)

Visual studio code is a free IDE that is great for beginner or seasoned developers. If you would like to use VSCode, go to the following site to download the latest version: https://code.visualstudio.com/download

### Set up AWS Account (Cost Details Below)

Create an AWS Account if you don't already have one: https://aws.amazon.com/premiumsupport/knowledge-center/create-and-activate-aws-account/. You will need to provide a credit card to create an account, but there will be no charges until you create resources and exceed any free tier limits. Unless there is a large amount of traffic to the application, the biggest costs will be AWS Secrets Manager and AWS CodeBuild:

- Secrets Manager comes with a 30 day free trial and will cost $0.40 per secret per month after that (we use 1 secret).
- CodeBuild is free for the first 100 build minutes per month and then $0.005 per minute after that (deployments take 15-25 minutes, so after about 4-5 deployments they will start to be charged).

The application resources (API Gateway, Lambda, DynamoDB, Cognito, S3, CloudFront) are all serverless and the cost is negligible unless there is a high volume of traffic (For pricing details, visit the respective pricing pages. e.g. https://aws.amazon.com/lambda/pricing/#AWS_Lambda_Pricing).

### Create an IAM User for CDK Deployment

1. Go to https://console.aws.amazon.com/iam/home#/users and click **Create user**.
2. Add a User name and select **Next**.
3. Click **Attach policies directly**
4. Search for **AdministratorAccess** and select the policy and click **Next** at the bottom right.
5. Click **Create user**.

**Create the User Access Key**

1. Click the link for the newly created user.
2. Under the **Summary** section, select the **Security credentials** tab.
3. Scroll down to the **Access keys** section and click **Create access key** on the right.
4. Under Use case select **Command Line Interface (CLI)**.
5. Scroll down and select the confirmation box at the bottom before clicking **Next**.
6. Click **Create access key**.
7. Use the **Download .csv file** button to save the Access key ID and Secret access key to a file (these will be used below) and click **Done**.

### Configure AWS CLI

Run the following to configure the AWS CLI:

```sh
aws configure
```

1. Enter the Access key ID and Secret access key from the previous step.
2. Set the default region to your preferred region (us-west-2 or us-east-1 are recommended since they have the most services available).
3. Set the default output format to json.

## Application Setup and Deployment

### Clone the Repository

Navigate to the directory where you want to store the project (e.g. `cd ~/projects`) and run the following commands.

```sh
git clone https://github.com/The-Done-App/done.git
cd done
```

### Install Dependencies

_Note: If you run into permission issues using `npm`, there should be on screen instructions to fix the issue (using sudo is not recommended)._

Install all project dependencies:

```sh
npm install
```

### Set Domain Prefixes

To provide unique identifiers for the Cognito authentication URLs, I've provided a script to generate random strings and store them as environment variables which will be deployed with the CDK application.

1. Within the project folder in the terminal, navigate to the `scripts` directory:

```sh
cd scripts
```

#### MacOS/Linux:

2. Always review third-party scripts before running them:

```sh
cat set-domain-prefixes.sh | less
```

3. Run the script to set the PROD_DOMAIN_PREFIX and PREPROD_DOMAIN_PREFIX environment variables (source is used so the environment variables are set in the current session).

```sh
source ./set-domain-prefixes.sh
```

4. Note these values for use in the next step. We need to set these as Authorized redirect URIs in the Google API Console.

#### Windows:

2. Always review third-party scripts before running them:

```sh
Get-Content Set-Domain-Prefixes.ps1
```

3. Run the script to set the PROD_DOMAIN_PREFIX and PREPROD_DOMAIN_PREFIX environment variables.

```sh
.\Set-Domain-Prefixes.ps1
```

4. Note these values for use in the next step. We need to set these as Authorized redirect URIs in the Google API Console.

### Create a Google API Console Project

Since we want to allow Google Sign-in with the application, we need a Google Console Project to create the OAuth 2.0 Client ID. This is used by the Cognito User Pool to allow users to sign in with their Google account.

Reference: https://support.google.com/cloud/answer/6158849?hl=en

1. Go to https://console.cloud.google.com/ and Sign In if needed (The signed in account will host the project).
2. Click **Select a Project** at the top and choose **New Project** in the top right corner.
3. Add a Project Name and click **Create**.
4. Wait for the project to be created and click **Select a Project** at the top and choose the newly created project.
5. Click the Navigation Menu at the top left corner and click **More Products** > **APIs & Services** > **OAuth consent screen**.
6. Under User Type select **External** and click **Create**.
7. Add an **App Name**.
8. Add your email for **User Support Email**.
9. Scroll to the bottom and add your email under **Developer Contact Information**.
10. Click **Save and Continue** and click **Save and Continue** again on the next two screens.
11. Click **Back to Dashboard** at the bottom.
12. On the left sidebar, click **Credentials**.
13. Click **Create Credentials** at the top > **OAuth client ID** > **Web Application**.
14. Add an app client name.
15. Under Authorized redirect URIs click **Add URI** twice and add the preprod and prod URIs using the following steps:

(Optional) To retrieve the previously set domain prefixes, run

**MacOS/Linux:**

```sh
printenv | grep DOMAIN_PREFIX
```

**Windows:**

```sh
$env:*DOMAIN_PREFIX*
```

(Optional) To retrieve the previously set region, run:

```sh
aws configure get region
```

The URIs should be in the following format:

- `https://<preprod-domain-prefix>.auth.<region>.amazoncognito.com/oauth2/idpresponse`
- `https://<prod-domain-prefix>.auth.<region>.amazoncognito.com/oauth2/idpresponse`

16. Click **Create**
17. A pop up should appear with the Client ID and Client Secret. Use the copy button next to each to save these as environment variables in your current terminal session. These will be used in the next step to upload the secrets to AWS Secrets Manager:

**MacOS/Linux:**

```sh
export GOOGLE_CLIENT_ID=<client-id>
export GOOGLE_CLIENT_SECRET=<client-secret>
```

**Windows:**

```sh
$env:GOOGLE_CLIENT_ID="<client-id>"
$env:GOOGLE_CLIENT_SECRET="<client-secret>"
```

### Set Google IDP secrets

To provide the Google Client ID and Client Secret to the CDK application, we will use AWS Secrets Manager. This allows us to store the secrets securely and retrieve them in the application code.

Within the `done` project folder, navigate to the `scripts` directory (if you are not already there).

**MacOS/Linux:**

1. Always review third-party scripts before running them:

```sh
cat deploy-idp-secrets.sh | less
```

2. Upload the secrets to AWS Secrets Manager and set the IDP_SECRETS_ARN environment variable (the ARN is retrieved from the `aws secretsmanager create-secret` AWS API call).

```sh
source ./deploy-idp-secrets.sh
```

3. Return to the `done` project folder:

```sh
cd ..
```

**Windows:**

1. Always review third-party scripts before running them:

```sh
Get-Content Deploy-IDP-Secrets.ps1
```

2. Upload the secrets to AWS Secrets Manager and set the IDP_SECRETS_ARN environment variable (the ARN is retrieved from the `aws secretsmanager create-secret` AWS API call).

```sh
.\Deploy-IDP-Secrets.ps1
```

3. Return to the `done` project folder:

```sh
cd ..
```

### Deploy the CDK Pipeline Stack

The CDK CLI will use the previously configured AWS CLI credentials to determine the account and region used by the commands.

1. If you have never deployed a CDK application before, you will need to bootstrap your account. This creates an S3 bucket and an IAM role that the CDK CLI will use to deploy the application.

```sh
cdk bootstrap
```

1. Run the command below to deploy the Pipeline stack. This creates the empty CodeCommit repository and the CodePipeline. The initial pipeline run will fail because the CodeCommit repository is empty: [AWS CodePipeline console](https://console.aws.amazon.com/codesuite/codepipeline/pipelines)

```sh
cdk deploy
```

### Configure git-remote-codecommit and push the code

To sync with the newly created CodeCommit repo, we need to set up git-remote-codecommit to allow git to push changes to the repository.

1. To install the package run:

```sh
pip install git-remote-codecommit
```

2. (Optional) Verify your region:

```sh
aws configure get region
```

3. Replace '\<region\>' with your region and set the remote:

```sh
git remote set-url origin codecommit::<region>://done-cdk
```

4. Push the code to the repository:

```sh
git push -u origin main
```

When the repository is updated, the pipeline run will start and should succeed in deploying all stages. You can track the progress in the [AWS CodePipeline console](https://console.aws.amazon.com/codesuite/codepipeline/pipelines). This will take about 20-30 minutes to complete.

Once the pipeline run is complete, you can view the application in the browser by navigating to the URL of the CloudFront distribution. This can be found in the [AWS CloudFront console](https://console.aws.amazon.com/cloudfront/home), or you can retrieve them using the CLI:

```sh
aws cloudfront list-distributions --query 'DistributionList.Items[].[DomainName,Origins.Items[].DomainName]'
```

The application is now live and ready to use!
