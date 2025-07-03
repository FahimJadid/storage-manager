# Jotter Backend

Jotter is a storage management system application that allows users to manage their files and folders efficiently. This backend API is built using Node.js, Express.js, and MongoDB (Mongoose) and follows a modular design pattern to ensure a clean and maintainable code structure.

## Features

- **User Authentication**
  - Login using email and password.
  - Forgot password feature with a 6-digit verification code sent via email.
  - Signup with username, email, password, confirm password, and acknowledgment of terms and conditions.

- **Home Interface**
  - Users are directed to a home page resembling Google Drive after authentication.
  - Each account has a free storage limit of 15 GB, displaying used and available storage.
  - Users can create folders and store notes, images, and PDFs, tracking the number of items and their storage consumption.

- **File Actions**
  - Actions for each file including:
    - Add to favorites
    - Copy
    - Rename
    - Duplicate
    - Delete (with confirmation)
    - Share
    - Make private (move to a safe folder)

- **Safe Folder**
  - Move files to a PIN-protected safe folder for privacy.
  - Access, move, and manage files in the safe folder with a 4-digit PIN.
  - Change or disable the safe folder PIN.

- **Filtering Options**
  - Filtering options for folders, notes, images, and PDFs.

- **Lock System**
  - A lock system for private files requiring a 4-digit PIN code for access (Safe Folder).

- **Favorites List**
  - Maintain a list of favorite items with options to manage them.

- **Calendar Options**
  - Filtering files and folders based on specific dates, months, and years.

- **Profile Options**
  - Profile section displaying a profile picture and username with options to edit profile and access settings.

- **Settings**
  - Change password and delete account functionalities.

## API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /refresh` - Refresh JWT token
- `POST /logout` - Logout user

### Profile Routes (`/api/profile`)
- `GET /` - Get user profile
- `PUT /` - Edit user profile
- `POST /picture` - Upload profile picture
- `DELETE /picture` - Delete profile picture
- `GET /settings` - Get user settings
- `PUT /settings` - Update user settings

### Settings Routes (`/api/settings`)
- `PUT /change-password` - Change user password
- `DELETE /clear-data` - Clear all user data
- `DELETE /delete-account` - Delete user account
- `POST /logout` - Logout user

### File Routes (`/api/files`)
- `POST /upload` - Upload single file
- `POST /upload-multiple` - Upload multiple files
- `GET /` - Get user's files
- `GET /:id` - Get specific file
- `PUT /:id` - Update file details
- `DELETE /:id` - Delete file
- `GET /:id/download` - Download file
- `PUT /:id/privacy` - Update file privacy
- `POST /:id/share` - Share file
- `GET /stats` - Get file statistics

### Folder Routes (`/api/folders`)
- `POST /` - Create new folder
- `GET /` - Get user's folders
- `GET /:id` - Get specific folder
- `PUT /:id` - Update folder
- `DELETE /:id` - Delete folder
- `GET /:id/contents` - Get folder contents
- `POST /:id/share` - Share folder
- `GET /stats` - Get folder statistics
- `GET /storage` - Get storage information

### Favorite Routes (`/api/favorites`)
- `POST /` - Add item to favorites
- `GET /` - Get user's favorites
- `DELETE /:id` - Remove favorite by ID
- `DELETE /item` - Remove favorite by item
- `GET /check` - Check if item is favorited
- `GET /count` - Get favorites count

### Calendar Routes (`/api/calendar`)
- `GET /` - Get calendar activities
- `GET /daily` - Get daily activities
- `GET /monthly` - Get monthly activities
- `GET /recent` - Get recent activities

### Safe Folder Routes (`/api/safe-folder`)
- `GET /status` - Get safe folder status
- `POST /enable` - Enable safe folder with PIN
- `POST /disable` - Disable safe folder
- `PUT /change-pin` or `POST /change-pin` - Change safe folder PIN
- `POST /verify-pin` - Verify safe folder PIN
- `POST /files` - Get safe files (requires PIN)
- `POST /move-to-safe` - Move file to safe folder
- `POST /move-from-safe` - Move file from safe folder
- `POST /file/:id` - Get specific safe file by ID
- `POST /download/:id` - Download safe file

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/FahimJadid/storage-manager.git
   ```

2. Navigate to the project directory:
   ```bash
   cd jotter-backend
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a `.env` file in the root directory and add your environment variables:
   ```env
   DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/jotter
   JWT_SECRET=your_super_secret_jwt_key
   PORT=5000
   
   # Email Service
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=465
   EMAIL_SECURE=true
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   
   # App Settings
   RESET_PASSWORD_EXPIRY=10m
   STORAGE_LIMIT=15728640  # 15 GB in bytes
   ```

5. Create uploads directory:
   ```bash
   mkdir uploads
   ```

6. Start the server:
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

The server will run on `http://localhost:5000` by default.

## API Testing

### Postman Collections
Ready-to-use Postman collections are available in the `postman_collections/` directory

### Environment Variables for Testing
```json
{
  "baseUrl": "http://localhost:5000",
  "authToken": "your_jwt_token_here"
}
```

## Authentication

All API endpoints (except auth routes) require JWT token authentication:

```http
Authorization: Bearer <your_jwt_token>
```

Get JWT token by logging in via `POST /api/auth/login`.

## File Upload

The API supports file uploads with the following features:
- **Profile Pictures**: Max 5MB, images only
- **General Files**: Max 10MB (configurable)
- **Supported Formats**: All common file types
- **Security**: File type validation, size limits, virus scanning

## Error Handling

All API responses follow this format:
```json
{
  "success": true/false,
  "message": "Response message",
  "data": {}, // Response data (varies by endpoint)
  "error": "Error message" // Only present on errors
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (access denied)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Comprehensive request validation
- **File Security**: Type and size validation
- **CORS Protection**: Configurable cross-origin requests
- **Rate Limiting**: API rate limiting (configurable)
- **Data Ownership**: User-based data isolation

## Development

### Available Scripts
```bash
npm start          # Run production server
npm run dev        # Run development server with nodemon
```

### Database Schema
The application uses MongoDB with Mongoose ODM. Key collections:
- **Users**: User accounts and profiles
- **Files**: File metadata and storage information
- **Folders**: Folder hierarchy and organization
- **Favorites**: User's favorited items

### Adding New Features
1. Create controller in `src/controllers/`
2. Add routes in `src/routes/`
3. Update `src/app.js` to include new routes
4. Add tests and documentation

## Deployment

### Environment Setup
1. Set production environment variables
2. Configure MongoDB connection
3. Set up file storage (local or cloud)
4. Configure email service
5. Set up reverse proxy (nginx recommended)


## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code structure and naming conventions
- Add tests for new features
- Update documentation for API changes
- Ensure all tests pass before submitting PR

## License

This project is licensed under the MIT License.

## Changelog

### v1.0.0
- Initial release with full API functionality
- User authentication and authorization
- File and folder management
- Profile and settings management
- Comprehensive API testing resources