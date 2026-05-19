# CloudVault: Serverless Personal Cloud Drive on AWS

CloudVault is a serverless personal cloud drive built with AWS and React.

It allows users to register, log in, create folders, upload private files, preview images and PDFs, search files, filter files by folder, download files, and delete files. Each authenticated user has a private storage space.

## Live Demo

https://main.dnpoja0dxgsgu.amplifyapp.com

> Demo note: This project is deployed for portfolio demonstration only.  
> Each user has a 20 MB storage limit and each file upload is limited to 5 MB.  
> Please upload only small test files.

---

## Project Overview

CloudVault was built as a practical cloud portfolio project to demonstrate a real-world serverless architecture on AWS.

The main idea is simple:

- Amazon S3 stores the actual uploaded files.
- Amazon DynamoDB stores file metadata and folder/category data.
- Amazon Cognito handles user authentication.
- AWS Lambda handles backend logic.
- API Gateway exposes secure API routes.
- AWS Amplify hosts the React frontend.

This project is not just a simple upload form. It works like a small personal cloud drive where each authenticated user can manage their own private files.

---

## Main Features

- User registration and login with Amazon Cognito
- Private dashboard for each user
- Create folders/categories
- Delete folders/categories
- Upload files securely to Amazon S3
- Store file metadata in Amazon DynamoDB
- List uploaded files
- Search files by name
- Filter files by folder/category
- Preview image files
- Preview PDF files
- Download files securely
- Delete files from S3 and DynamoDB
- Per-file upload limit: 5 MB
- Per-user storage limit: 20 MB
- Storage usage display with remaining storage
- Public frontend deployment using AWS Amplify Hosting

---

## Demo Access and Usage Notice

This project is publicly deployed as a portfolio demo.

To prevent uncontrolled AWS usage, CloudVault includes:

- 5 MB maximum upload size per file
- 20 MB maximum storage per user
- Private S3 storage
- User-based access control with Amazon Cognito
- Backend validation for upload size and total user storage

Please upload only small test files when trying the demo.

---

## AWS Services Used

| AWS Service | Purpose |
|---|---|
| Amazon S3 | Stores the actual uploaded files |
| Amazon DynamoDB | Stores file metadata and folder/category data |
| AWS Lambda | Handles backend business logic |
| Amazon API Gateway | Exposes HTTP API endpoints |
| Amazon Cognito | Handles user registration, login, and authentication |
| AWS Amplify Hosting | Deploys and hosts the React frontend |
| Amazon CloudWatch | Stores Lambda logs for debugging |
| IAM | Controls permissions between AWS services |

---

## Technology Stack

### Frontend

- React
- Vite
- Tailwind CSS
- Axios
- react-oidc-context

### Backend

- Node.js on AWS Lambda
- Amazon API Gateway HTTP API
- Amazon DynamoDB
- Amazon S3
- Amazon Cognito

---

## Architecture

```text
User
  ↓
React Frontend
  ↓
Amazon Cognito
  ↓
API Gateway
  ↓
AWS Lambda
  ↓
DynamoDB + S3
```

---

## How It Works

### Authentication Flow

1. User opens the CloudVault frontend.
2. User signs in or creates an account through Amazon Cognito.
3. Cognito returns authentication tokens.
4. The frontend sends the token to API Gateway.
5. API Gateway validates the token using the Cognito authorizer.
6. Lambda functions identify the user from the Cognito user ID.
7. Each user can only access their own files and folders.

---

### Upload Flow

1. User selects a file and folder/category.
2. React sends file metadata to `POST /upload-url`.
3. API Gateway checks the Cognito token.
4. Lambda verifies:
   - File size limit
   - User storage limit
   - Authenticated user identity
5. Lambda generates a secure S3 presigned upload URL.
6. Lambda saves file metadata in DynamoDB.
7. React uploads the actual file directly to Amazon S3.
8. The dashboard refreshes and shows the uploaded file.

---

### File Preview Flow

1. React calls `GET /files`.
2. Lambda reads file metadata from DynamoDB.
3. Lambda generates temporary S3 preview URLs.
4. React displays:
   - Image thumbnails for image files
   - Embedded preview for PDF files
   - Document-style cards for other file types

---

### Download Flow

1. User clicks the download button.
2. React calls `GET /download-url/{fileId}`.
3. Lambda checks that the file belongs to the authenticated user.
4. Lambda generates a temporary S3 presigned download URL.
5. The browser downloads or opens the file securely.

---

### Delete Flow

1. User clicks delete.
2. React calls `DELETE /files/{fileId}`.
3. Lambda checks the file owner.
4. Lambda deletes the file from S3.
5. Lambda deletes the metadata from DynamoDB.
6. The file disappears from the dashboard.

---

## Data Storage Design

### S3 File Structure

Actual files are stored in Amazon S3 using this structure:

```text
users/{userId}/{category}/{fileId}-{fileName}
```

Example:

```text
users/abc123/documents/file456-passport.pdf
users/abc123/photos/file789-profile.jpg
```

This structure helps separate files by user and category.

---

### DynamoDB File Metadata Example

```json
{
  "PK": "USER#abc123",
  "sk": "FILE#file456",
  "entityType": "FILE",
  "userId": "abc123",
  "fileId": "file456",
  "fileName": "passport.pdf",
  "fileType": "application/pdf",
  "category": "Documents",
  "s3Key": "users/abc123/documents/file456-passport.pdf",
  "size": 240000,
  "createdAt": "2026-05-15T12:00:00Z"
}
```

---

### DynamoDB Category Example

```json
{
  "PK": "USER#abc123",
  "sk": "CATEGORY#category123",
  "entityType": "CATEGORY",
  "userId": "abc123",
  "categoryId": "category123",
  "categoryName": "Documents",
  "createdAt": "2026-05-15T12:00:00Z"
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/upload-url` | Creates a secure S3 upload URL |
| GET | `/files` | Lists user files |
| GET | `/files?search=value` | Searches files by name |
| GET | `/files?category=value` | Filters files by category |
| GET | `/download-url/{fileId}` | Creates a secure download URL |
| DELETE | `/files/{fileId}` | Deletes a file from S3 and DynamoDB |
| POST | `/categories` | Creates a folder/category |
| GET | `/categories` | Lists user folders/categories |
| DELETE | `/categories/{categoryId}` | Deletes a folder/category record |

---

## Security Design

CloudVault uses several security principles:

- The S3 bucket is private.
- Files are not publicly accessible.
- Uploads and downloads use temporary presigned URLs.
- File previews use temporary S3 URLs.
- API Gateway routes are protected with a Cognito JWT authorizer.
- The backend gets the user ID from the Cognito token, not from the frontend request body.
- Each user can only access their own files.
- Lambda functions use IAM roles with limited permissions.
- File size is checked in both the frontend and backend.
- Each user has a 20 MB storage limit.
- The frontend is deployed through AWS Amplify Hosting.

---

## Storage Limits

CloudVault includes basic storage control to keep the demo safe and cost-controlled.

| Limit Type | Value |
|---|---|
| Maximum file size | 5 MB |
| Maximum storage per user | 20 MB |

The dashboard shows:

- Number of uploaded files
- Number of folders
- Used storage
- Remaining storage
- Storage progress bar

These limits are applied both in the frontend and backend. The backend validation is handled inside the upload Lambda function, so users cannot bypass the limit by editing the frontend.

---

## Screenshots

Add screenshots to your repository in this folder:

```text
docs/screenshots/
```

Recommended screenshots:

```text
docs/screenshots/landing-page.png
docs/screenshots/dashboard.png
docs/screenshots/file-manager.png
docs/screenshots/image-preview.png
docs/screenshots/pdf-preview.png
```

Then use this section after uploading screenshots:

```md
![Landing Page](docs/screenshots/landing-page.png)

![Dashboard](docs/screenshots/dashboard.png)

![File Manager](docs/screenshots/file-manager.png)

![Image Preview](docs/screenshots/image-preview.png)

![PDF Preview](docs/screenshots/pdf-preview.png)
```

---

## Project Structure

```text
cloudvault-serverless-drive/
│
├── public/
│
├── src/
│   ├── App.jsx
│   ├── config.js
│   ├── index.css
│   └── main.jsx
│
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── eslint.config.js
└── README.md
```

---

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/masoudaaam/cloudvault-serverless-drive.git
```

### 2. Enter the project folder

```bash
cd cloudvault-serverless-drive
```

### 3. Install dependencies

```bash
npm install
```

### 4. Run the development server

```bash
npm run dev
```

The app will run locally at:

```text
http://localhost:5173
```

---

## Build

To create a production build:

```bash
npm run build
```

The production files will be generated in:

```text
dist/
```

---

## Deployment

The frontend is deployed using AWS Amplify Hosting.

Deployment flow:

```text
GitHub Repository
  ↓
AWS Amplify Hosting
  ↓
Public Amplify URL
```

Whenever code is updated in the GitHub repository, Amplify can automatically rebuild and redeploy the app.

---

## Important Configuration

The frontend uses a dynamic redirect URL:

```javascript
const appOrigin = window.location.origin;
```

This allows authentication to work both locally and on the deployed Amplify URL.

Example:

```javascript
redirectUri: appOrigin,
logoutUri: appOrigin
```

---

## What I Learned

Through this project, I practiced:

- Designing a serverless AWS architecture
- Building secure authentication with Amazon Cognito
- Protecting API Gateway routes with JWT authorization
- Creating Lambda functions with Node.js
- Generating S3 presigned upload and download URLs
- Generating temporary preview URLs for private files
- Storing metadata in DynamoDB
- Designing DynamoDB access patterns
- Managing IAM permissions for Lambda
- Debugging backend functions with CloudWatch logs
- Deploying a React app with AWS Amplify
- Building a practical cloud project for GitHub and LinkedIn

---

## Challenges Solved

During this project, I solved several real implementation issues:

- Configuring Cognito callback URLs for both local and deployed environments
- Fixing Cognito App Client ID mismatch
- Connecting API Gateway HTTP API JWT authorizer to Lambda
- Handling the correct Cognito user ID from API Gateway JWT claims
- Generating S3 presigned URLs for upload, download, and preview
- Separating actual file storage in S3 from metadata in DynamoDB
- Adding frontend and backend upload limits
- Adding per-user storage quota logic

---

## Future Improvements

Possible future improvements:

- Add Infrastructure as Code using AWS CDK or Terraform
- Add drag-and-drop file upload
- Add invite-code registration
- Add file sharing links
- Add folder-level storage statistics
- Add file rename feature
- Add image compression before upload
- Add PDF thumbnail generation
- Add custom domain
- Add automated tests
- Add admin dashboard
- Add better mobile responsiveness
- Add dark/light theme switch

---

## Author

Built by Masoud Momeni as a cloud portfolio project.

GitHub: https://github.com/masoudaaam

---

## Status

MVP completed and deployed.

Current version includes:

- Authentication
- File upload
- File preview
- File search
- File filtering
- File download
- File delete
- Folder management
- Storage limit
- Public deployment
