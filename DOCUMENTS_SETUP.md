# FYP Documents Feature Setup Instructions

## 🚀 Quick Start Guide

The Documents page is now fully implemented and ready to use! Here's how to get it working:

## ⚠️ Important: Start the Backend Server First

The Documents page needs the backend server to be running. Follow these steps:

### 1. Start Backend Server
```bash
# Open a terminal in VS Code
# Navigate to the backend folder
cd backend

# Install dependencies (if not already done)
npm install

# Start the server
npm start
```

**You should see:**
```
connected to db & listening on port 4000
```

### 2. Start Frontend (if not already running)
```bash
# Open another terminal
# Navigate to the frontend folder
cd frontend

# Install dependencies (if not already done)
npm install

# Start the frontend
npm start
```

## 📋 How to Use the Documents Feature

1. **Generate Documents**: Go to the Reports page and generate any report (Inventory, Sales, etc.)
2. **Automatic Saving**: Reports are automatically saved to the Documents collection
3. **View Documents**: Go to the Documents page to see all saved documents
4. **Filter & Search**: Use the search and filter options to find specific documents
5. **Download**: Click the download button to get a copy of any document

## 🔍 Troubleshooting

### "Failed to fetch documents" Error
- ✅ Make sure backend server is running on port 4000
- ✅ Check that you're logged in
- ✅ Try refreshing the page
- ✅ Check browser console for detailed error messages

### Backend Server Issues
- ✅ Ensure MongoDB connection is working
- ✅ Check the `.env` file in the backend folder
- ✅ Make sure port 4000 is not being used by another application

### Frontend Issues
- ✅ Clear browser cache
- ✅ Make sure frontend is running on port 3000
- ✅ Check that proxy is configured correctly in package.json

## 🎯 Features Implemented

✅ **Document Storage**: Automatically saves all generated reports  
✅ **Rich Metadata**: Tracks creation date, file size, user, and report type  
✅ **Search & Filter**: Find documents by name, type, or date range  
✅ **Statistics Dashboard**: Shows total documents, file sizes, and recent activity  
✅ **Download Functionality**: Download documents as PDF files  
✅ **Role-based Access**: Users only see their own documents (staff see all)  
✅ **Responsive Design**: Works on all device sizes  
✅ **Error Handling**: Clear error messages and troubleshooting guidance  

## 🔧 Technical Details

- **Backend**: Express.js with MongoDB for document storage
- **Frontend**: React with custom hooks and context
- **Authentication**: JWT tokens for security
- **File Format**: PDF documents stored as base64 in MongoDB
- **API Endpoints**: RESTful API with pagination and filtering

Enjoy using your new Documents management system! 🎉
