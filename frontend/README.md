# Task Crusher Frontend

A modern, responsive React frontend for the Task Crusher application. Built with React 18, Tailwind CSS, and modern web technologies.

## Features

### 🚀 **Authentication**
- **Sign Up**: Create new accounts with email, password, and optional age
- **Sign In**: Secure login with email and password
- **Protected Routes**: Automatic redirection based on authentication status
- **JWT Cookie Authentication**: Secure token handling via HTTP-only cookies

### 📊 **Dashboard**
- **Welcome Header**: Personalized greeting with quick add task button
- **Statistics Overview**: Total, completed, pending, and overdue task counts
- **Quick Actions**: Easy access to common functions
- **Recent Tasks**: Display of latest 5 tasks with quick actions

### ✅ **Task Management**
- **Create Tasks**: Add new tasks with title, description, due date, priority, category, and repeat options
- **Task Display**: Beautiful task cards with priority indicators and due date formatting
- **Task Actions**: Mark complete/incomplete, edit, and delete tasks
- **Priority System**: High, medium, and low priority with color coding
- **Categories**: Organize tasks by custom categories
- **Repeat Options**: Daily, weekly, monthly, or no repeat

### 🎨 **User Interface**
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Dark Mode Ready**: Built with Tailwind CSS for easy theming
- **Icon Integration**: Lucide React icons for consistent visual language

### 🔧 **Technical Features**
- **React 18**: Latest React features and performance improvements
- **Context API**: Global state management for authentication
- **React Router**: Client-side routing with protected routes
- **Tailwind CSS**: Utility-first CSS framework for rapid development
- **Axios**: HTTP client for API communication
- **Date-fns**: Modern date utility library

## Prerequisites

- Node.js 16+ 
- npm or yarn
- Backend server running (see backend setup)

## Installation

1. **Clone the repository** (if not already done):
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## Configuration

### Backend API
The frontend is configured to connect to your backend at `http://localhost:3001` (configured in `package.json` proxy).

### Environment Variables
Create a `.env` file in the frontend root directory if you need to override any settings:

```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ENV=development
```

## Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── auth/          # Authentication components
│   │   ├── dashboard/     # Dashboard components
│   │   ├── layout/        # Layout and navigation
│   │   └── tasks/         # Task-related components
│   ├── contexts/          # React contexts
│   ├── App.js             # Main app component
│   ├── index.js           # App entry point
│   └── index.css          # Global styles and Tailwind
├── package.json            # Dependencies and scripts
├── tailwind.config.js      # Tailwind CSS configuration
└── README.md              # This file
```

## Available Scripts

- **`npm start`**: Start development server
- **`npm build`**: Build for production
- **`npm test`**: Run test suite
- **`npm eject`**: Eject from Create React App (not recommended)

## API Integration

The frontend integrates with your backend API endpoints:

- **Authentication**: `/api/users/*`
- **Tasks**: `/api/tasks/*`
- **User Profile**: `/api/users/me`

All API calls include `credentials: 'include'` to handle cookie-based authentication.

## Styling

### Tailwind CSS Classes
The app uses custom Tailwind CSS classes defined in `src/index.css`:

- `.btn-primary`: Primary button styling
- `.btn-secondary`: Secondary button styling  
- `.btn-danger`: Danger button styling
- `.input-field`: Form input styling
- `.card`: Card container styling
- `.task-card`: Task-specific card styling

### Color Scheme
- **Primary**: Blue shades for main actions
- **Success**: Green shades for completed items
- **Warning**: Yellow/Orange shades for pending items
- **Danger**: Red shades for overdue/delete actions

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development

### Adding New Components
1. Create component file in appropriate directory
2. Import and use in parent component
3. Add any new Tailwind classes to `index.css` if needed

### State Management
- **Local State**: Use `useState` for component-specific state
- **Global State**: Use `AuthContext` for authentication state
- **API State**: Manage loading, error, and data states locally

### Styling Guidelines
- Use Tailwind utility classes for styling
- Create custom component classes in `index.css` for repeated patterns
- Maintain consistent spacing using Tailwind's spacing scale
- Use semantic color names from the custom color palette

## Troubleshooting

### Common Issues

1. **Backend Connection Error**:
   - Ensure backend is running on port 3001
   - Check proxy configuration in `package.json`

2. **Authentication Issues**:
   - Verify JWT_SECRET is set in backend
   - Check cookie settings in backend

3. **Build Errors**:
   - Clear `node_modules` and reinstall dependencies
   - Check Node.js version compatibility

### Performance Tips

- Use React.memo for expensive components
- Implement proper loading states
- Optimize re-renders with useCallback/useMemo
- Lazy load routes for better initial load time

## Contributing

1. Follow existing code style and patterns
2. Add proper error handling for all API calls
3. Include loading states for better UX
4. Test on multiple screen sizes
5. Update documentation for new features

## License

This project is part of the Task Crusher application. See the main project README for license information.
