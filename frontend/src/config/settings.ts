export const PROJECT_SETTINGS = {
  name: "Client Management System",
  version: "1.0.0",
  url: "http://localhost:5173",
  apiUrl: "http://localhost:5000/api",
  admin: {
    username: "admin",
    email: "admin@clientmanager.com",
    password: "Admin@123", // In production, this should be stored securely
    role: "administrator"
  },
  features: {
    enableAuthentication: true,
    enableEmailNotifications: true,
    enableFileUploads: true
  }
}; 