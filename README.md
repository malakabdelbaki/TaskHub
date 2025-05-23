# Task Management System on AWS

A scalable and secure Task Management System built on AWS, supporting task tracking, group collaboration, and file sharing with real-time notifications.

---

## Features

1. **User Authentication and Management**
   - Secure sign-up and login using AWS Cognito.

2. **Task Management**
   - Create, update, delete, and view tasks.
   - Set priority, due date, and status.

3. **User Groups**
   - Create user groups and invite others to collaborate.
   - Share tasks within the same group for team productivity.

4. **Task Groups**
   - Organize tasks into logical task groups for better project management.

5. **File Attachments**
   - Upload and attach files to tasks.
   - Files are securely stored in Amazon S3.

6. **Notifications**
   - Email notifications for task updates via Amazon SQS and SES.

7. **Monitoring and Logging**
   - Real-time monitoring with CloudWatch.
   - Alerts for high error rates, API latency, and queue delays.

---

## Architecture Overview

The system integrates the following AWS services:

- **Cognito**: User authentication
- **RDS**: Relational database for task data
- **DynamoDB**: Metadata storage
- **S3**: File attachment storage
- **Lambda**: Backend logic
- **API Gateway**: API endpoint management
- **SQS & SES**: Notification queue and email service
- **CloudWatch**: Monitoring and logs
- **EC2**: Hosting the React frontend

Below is a visual representations of the AWS services used in the Task Management System and their interactions:

![architecture diagram](https://github.com/user-attachments/assets/ad979339-571d-4288-9ae6-72af55936e6e)

---

## Setup Guide

### 1. VPC Setup
Create a VPC with public/private subnets to isolate resources securely.

### 2. Cognito
- Go to AWS Cognito → Manage User Pools → Create a User Pool.
- Set up:
 - Pool name: UserPool
 - Attributes: Enable Email for sign-in.
 - Password Policy
   - Password minimum length: 8 character(s)
   - Temporary passwords set by administrators expire in 7 day(s)
   - Allow reuse of previous passwords
   - Password requirements:
     - Contains at least 1 number
     - Contains at least 1 special character
     - Contains at least 1 uppercase letter
     - Contains at least 1 lowercase letter
   - App Client: Create a new app client (TaskManagementApp). 

### 3. Databases
- **RDS**: MySQL/PostgreSQL with secure credentials.
- **DynamoDB**: Table `TaskMetadata` with `taskId` and `userId`.

### 4. S3 Bucket
- Name: `task-management-bucket5228`
- Enable block public access.
- Create read/write IAM policy.

### 5. Lambda Functions
Deploy Lambda functions:
- `createTaskFn`, `updateTaskFn`, `deleteTaskFn`, `listTasksFn`
- `TaskGroupManager`, `UserGroupManagement`
- `Send-task-email-notification`

### 6. API Gateway
- Create HTTP API with defined endpoints.
- Deploy to `prod` stage.

### 7. Notifications
- SQS Queue: `task-updates-queue`
- Integrate with update Lambda to trigger email Lambda.

### 8. Monitoring
- CloudWatch Logs and Alarms for:
  - Lambda errors
  - API latency
  - SQS delay

### 9. Frontend Deployment
- Deploy React app to EC2 (Apache).
- Setup HTTPS, reverse proxy for APIs, SSL certs.

### 10. IAM Roles
Assign correct policies to:
- EC2 (S3, DynamoDB, Cognito)
- Lambda (RDS, SQS, DynamoDB)

### 11. SES (Email)
- Verify sender and recipient emails in sandbox mode.

---

## 👤 User Guide

### 1. Sign Up / Login
- Securely register/login using Cognito.
- Managed via web frontend.

### 2. Task Operations
- Add, update, delete, and filter tasks.
- Set status, due date, and priority.

### 3. Group Collaboration
- Invite users to join groups.
- Share and assign tasks within groups.

### 4. File Upload
- Attach documents/images to tasks securely.

### 5. Email Notifications
- Automatic email alerts for task updates.

More details can be found in the Project documentation pdf
---
