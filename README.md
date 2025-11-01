# Daily Rush - Task Management App

A beautiful, modern web application for managing your daily tasks with Google OAuth authentication, a points system, and customizable user profiles.

## Features

- ✅ **Task Management**: Add, complete, delete, and organize tasks
- ✅ **Multi-Page Views**: Separate pages for All Tasks, Active Tasks, and Completed Tasks
- ✅ **Search & Sort**: Find and organize tasks easily
- ✅ **Points System**: Earn points based on task difficulty (Easy: 10, Medium: 25, Hard: 50, Expert: 100)
- ✅ **Celebration Sound**: Congratulatory sound when you earn points
- ✅ **Google OAuth**: Optional Google Sign-In with customizable profile
- ✅ **Profile Editing**: Edit your display name and photo
- ✅ **Beautiful UI**: Modern gradient design with smooth animations
- ✅ **Data Persistence**: Tasks and points saved in localStorage
- ✅ **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3.x OR Node.js OR PHP (for local development server)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mounirarfaoui/daily-rush.git
cd daily-rush
```

2. Configure Google OAuth (Optional but recommended):
   - Open `script.js`
   - Replace `YOUR_CLIENT_ID_HERE.apps.googleusercontent.com` on line 10 with your actual Google OAuth Client ID
   - See `GOOGLE_AUTH_SETUP.md` for detailed setup instructions

3. Start a local web server:

**Option 1: Using Python**
```bash
python -m http.server 8000
```

**Option 2: Using Node.js**
```bash
node server.js
```
Or use the provided batch file:
```bash
START_SERVER.bat
```

**Option 3: Using npx serve**
```bash
npx serve -p 8000
```

4. Open your browser and navigate to:
```
http://localhost:8000
```

## Usage

### Adding Tasks
1. Type your task in the input field
2. Select difficulty level (affects points earned)
3. Click "Add Task" or press Enter

### Managing Tasks
- **Complete**: Click the checkbox to mark as complete and earn points
- **Delete**: Click the "Delete" button to remove a task
- **Search**: Use the search box on each page to find specific tasks
- **Sort**: Use the dropdown to sort tasks by date or alphabetically

### Navigation
- **All Tasks**: View all your tasks
- **Active**: View only incomplete tasks
- **Completed**: View only completed tasks with points earned

### Google Sign-In (Optional)
1. Click the login button in the top right
2. Sign in with your Google account
3. Customize your profile by clicking on your profile picture/name
4. Edit your display name and photo URL
5. Click "Save Changes" or "Reset to Google" to revert

### Points System
- **Easy**: 10 points
- **Medium**: 25 points
- **Hard**: 50 points
- **Expert**: 100 points

Points are earned when you complete a task and can be viewed in the top bar.

## Project Structure

```
daily-rush/
├── index.html          # Main HTML file
├── styles.css          # Styles and animations
├── script.js           # Main application logic
├── server.js           # Node.js server (optional)
├── START_SERVER.bat    # Windows batch file to start server
├── README.md           # This file
├── GOOGLE_AUTH_SETUP.md # Google OAuth setup guide
└── .gitignore          # Git ignore file
```

## Technology Stack

- **HTML5**: Semantic markup
- **CSS3**: Modern styling with gradients, animations, and flexbox
- **Vanilla JavaScript (ES6+)**: No frameworks, pure JavaScript
- **Web Audio API**: Sound generation for celebrations
- **Google Identity Services**: OAuth authentication
- **localStorage**: Client-side data persistence

## Browser Compatibility

Works on all modern browsers that support:
- ES6+ JavaScript
- CSS Grid/Flexbox
- localStorage API
- Web Audio API
- Google Identity Services

## Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Identity Services API
4. Create OAuth 2.0 credentials (Web application type)
5. Add authorized JavaScript origins: `http://localhost:8000`
6. Add authorized redirect URIs: `http://localhost:8000`
7. Update `script.js` with your Client ID
8. See `GOOGLE_AUTH_SETUP.md` for detailed instructions

## Notes

- Tasks are saved automatically in your browser's localStorage
- Data persists between browser sessions
- Google Sign-In is optional - you can use the app without it
- The app requires a web server (cannot run from `file://` protocol)
- Client Secret is NOT needed for client-side OAuth (only Client ID)

## Troubleshooting

- **"localhost refused to connect"**: Make sure you've started a web server
- **Google Sign-In errors**: See `GOOGLE_AUTH_SETUP.md` or `FIX_401_INVALID_CLIENT.md`
- **Tasks not saving**: Check browser console for errors
- **No sound when earning points**: Check browser audio settings and permissions

## License

This project is open source and available under the MIT License.

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## Author

**Mounir Arfaoui**
- GitHub: [@mounirarfaoui](https://github.com/mounirarfaoui)

## Acknowledgments

- Background image from [empmonitor.com](https://empmonitor.com)
- Icons from Feather Icons
- Google Identity Services for OAuth
