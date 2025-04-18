# jazzrockers Project Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn package manager

## Database Setup

1. Install PostgreSQL on your system if not already installed
2. Create a new database:
```sql
CREATE DATABASE dubai_jazz_db;
```
3. Update the `.env` file with your database credentials

## Project Setup

1. Navigate to the project root directory

2. Install project dependencies
```bash
npm install
```

3. Set up environment variables:
   - Configure your environment variables:
     ```
     DATABASE_URL=postgresql://postgres:{your-password}@localhost:5432/dubai_jazz_db
     ```

4. Run database migrations
```bash
npm run db:push
```

5. Start the application
```bash
npm run dev
```

The application should now be running with:
- Backend server on http://localhost:5000
- Frontend accessible through the same port

6. Build the frontend
```bash
npm run build
```

7. Start the frontend
```bash
npm run start
```


## Additional Notes

- Make sure PostgreSQL service is running before starting the application
- The application runs both frontend and backend from the root directory
- Check the console for any error messages during setup
