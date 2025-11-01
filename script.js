// Task Management Application with Multi-Page Views

class TaskManager {
    constructor() {
        this.tasks = [];
        this.totalPoints = 0;
        this.currentPage = 'all';
        this.audioContext = null;
        this.user = null;
        this.googleClientId = '919121855133-ut8k73gu14j7rd6u967bavtr0jlc7rl1.apps.googleusercontent.com'; // Replace with your actual Google OAuth Client ID
        this.searchQueries = {
            all: '',
            active: '',
            completed: ''
        };
        this.sortOptions = {
            all: 'newest',
            active: 'newest',
            completed: 'newest'
        };
        this.pointsValues = {
            easy: 10,
            medium: 25,
            hard: 50,
            expert: 100
        };
        // Load user first, then load their tasks
        this.loadUser();
        // Load tasks after user is loaded (so we know which user's tasks to load)
        this.loadTasks();
        this.loadPoints();
        this.initializeGoogleSignIn();
        this.initializeEventListeners();
        
        // Always render pages - login is optional
        this.renderAllPages();
        this.updateAllStats();
        this.updatePointsDisplay();
        
        // Update user display (will show login button if not logged in)
        this.updateUserDisplay();
        this.hideLoginModal(); // Hide modal by default
    }

    initializeGoogleSignIn() {
        // Check if running from file:// protocol
        if (window.location.protocol === 'file:') {
            this.showServerRequiredMessage();
            return;
        }

        // Wait for Google Identity Services to load
        if (typeof google !== 'undefined' && google.accounts) {
            try {
                google.accounts.id.initialize({
                    client_id: this.googleClientId,
                    callback: (response) => this.handleCredentialResponse(response),
                    error_callback: (error) => this.handleError(error),
                });

                google.accounts.id.renderButton(
                    document.getElementById('googleSignInButton'),
                    {
                        theme: 'outline',
                        size: 'large',
                        width: 300,
                        text: 'signin_with',
                        locale: 'en'
                    }
                );
            } catch (error) {
                console.error('Google Sign-In initialization error:', error);
                this.showOAuthError();
            }
        } else {
            // Retry after a short delay if Google script hasn't loaded
            setTimeout(() => this.initializeGoogleSignIn(), 100);
        }
    }

    handleError(error) {
        console.error('Google Sign-In error:', error);
        if (error.type === 'popup_closed_by_user') {
            // User closed popup - not an error
            return;
        }
        
        // Show more specific error messages
        if (error.type === 'access_denied') {
            alert('Access denied. Make sure you added yourself as a test user in Google Console.');
        } else if (error.type === 'popup_blocked') {
            alert('Popup was blocked. Please allow popups for this site and try again.');
        } else {
            // Check for "no registered origin" or "invalid_client" errors
            this.showOAuthError();
        }
    }

    showServerRequiredMessage() {
        const loginContent = document.querySelector('.login-content');
        loginContent.innerHTML = `
            <button class="close-modal" id="closeModalBtn" onclick="taskManager.hideLoginModal()" title="Close">×</button>
            <div class="login-header">
                <h2>⚠️ Server Required</h2>
                <p>Google Sign-In requires a web server. You cannot use file:// protocol.</p>
            </div>
            <div style="text-align: left; background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Quick Setup:</h3>
                <p><strong>Option 1: Python</strong></p>
                <code style="display: block; background: #333; color: #0f0; padding: 10px; border-radius: 5px; margin: 10px 0;">
                    cd "C:\\Users\\Mounir\\OneDrive\\Bureau\\my apps\\daily rush"<br>
                    python -m http.server 8000
                </code>
                <p>Then open: <strong>http://localhost:8000</strong></p>
                
                <p><strong>Option 2: Node.js</strong></p>
                <code style="display: block; background: #333; color: #0f0; padding: 10px; border-radius: 5px; margin: 10px 0;">
                    cd "C:\\Users\\Mounir\\OneDrive\\Bureau\\my apps\\daily rush"<br>
                    npx serve
                </code>
                
                <p><strong>Option 3: PHP</strong></p>
                <code style="display: block; background: #333; color: #0f0; padding: 10px; border-radius: 5px; margin: 10px 0;">
                    cd "C:\\Users\\Mounir\\OneDrive\\Bureau\\my apps\\daily rush"<br>
                    php -S localhost:8000
                </code>
            </div>
            <p style="color: #666; font-size: 0.9em;">
                <strong>Important:</strong> After starting a server, add <code>http://localhost:8000</code> to your Google Console redirect URIs.
            </p>
            <p style="margin-top: 20px; color: #666; font-size: 0.9em;">
                <strong>Note:</strong> You can continue using the app without signing in.
            </p>
        `;
    }

    showOAuthError() {
        const currentOrigin = window.location.origin;
        const loginContent = document.querySelector('.login-content');
        loginContent.innerHTML = `
            <button class="close-modal" id="closeModalBtn" onclick="taskManager.hideLoginModal()" title="Close">×</button>
            <div class="login-header">
                <h2 style="color: #ff6b6b;">⚠️ Google Sign-In Configuration Needed</h2>
                <p>Your app needs to be configured in Google Cloud Console.</p>
            </div>
            <div style="text-align: left; background: #fff5f5; padding: 20px; border-radius: 10px; margin: 20px 0; border: 2px solid #ff6b6b;">
                <div style="background: #ffebee; padding: 15px; border-radius: 5px; border-left: 4px solid #f44336; margin-bottom: 20px;">
                    <strong>⚠️ Error 401: invalid_client</strong><br>
                    This means Google cannot validate your OAuth client. The most common cause is missing <strong>Authorized JavaScript origins</strong>.
                </div>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
                    <strong>🔍 First, verify your OAuth Client type:</strong><br>
                    1. In Google Console, click your OAuth Client ID<br>
                    2. Check "Application type" - it MUST be <strong>"Web application"</strong><br>
                    3. If it's not, you need to create a new OAuth client with type "Web application"
                </div>
                
                <p><strong>1. Configure OAuth Consent Screen (if not done):</strong></p>
                <ol style="line-height: 1.8; margin-left: 20px;">
                    <li>Go to <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank">OAuth Consent Screen</a></li>
                    <li>Choose <strong>External</strong> user type</li>
                    <li>App name: <strong>Daily Rush</strong></li>
                    <li>Add your email as support email</li>
                    <li>Click <strong>Save and Continue</strong></li>
                    <li>Go to <strong>Test users</strong> tab</li>
                    <li>Click <strong>+ ADD USERS</strong></li>
                    <li>Add: <strong>m.mounirarfaoui@gmail.com</strong></li>
                    <li>Click <strong>ADD</strong></li>
                </ol>

                <p style="margin-top: 20px;"><strong>2. ⚠️ CRITICAL: Add Authorized JavaScript Origins:</strong></p>
                <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 10px 0;">
                    <strong>This is the most important step! The error "no registered origin" means this is missing!</strong>
                </div>
                <ol style="line-height: 1.8; margin-left: 20px;">
                    <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank">Credentials</a></li>
                    <li>Click on your OAuth 2.0 Client ID (the one with Client ID ending in: <code>...unv7.apps.googleusercontent.com</code>)</li>
                    <li>Scroll to <strong>"Authorized JavaScript origins"</strong></li>
                    <li>Click <strong>+ ADD URI</strong></li>
                    <li>Add these EXACT URLs (one at a time, click ADD after each):</li>
                    <ul style="margin-left: 20px; background: #f0f0f0; padding: 10px; border-radius: 5px; margin: 10px 0;">
                        <li><code style="background: #333; color: #0f0; padding: 5px 10px; border-radius: 3px; font-weight: bold;">${currentOrigin}</code></li>
                        <li><code style="background: #333; color: #0f0; padding: 5px 10px; border-radius: 3px; font-weight: bold;">http://127.0.0.1:8000</code></li>
                    </ul>
                    <li><strong>Make sure both are added!</strong></li>
                </ol>

                <p style="margin-top: 20px;"><strong>3. Add Authorized Redirect URIs:</strong></p>
                <ol style="line-height: 1.8; margin-left: 20px;">
                    <li>In the same page, scroll to <strong>"Authorized redirect URIs"</strong></li>
                    <li>Click <strong>+ ADD URI</strong></li>
                    <li>Add these (one at a time):</li>
                    <ul style="margin-left: 20px; background: #f0f0f0; padding: 10px; border-radius: 5px; margin: 10px 0;">
                        <li><code style="background: #333; color: #0f0; padding: 5px 10px; border-radius: 3px;">${currentOrigin}</code></li>
                        <li><code style="background: #333; color: #0f0; padding: 5px 10px; border-radius: 3px;">${currentOrigin}/</code></li>
                    </ul>
                    <li>Click <strong>SAVE</strong> at the bottom of the page</li>
                </ol>

                <p style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 5px; border-left: 4px solid #2196f3;">
                    <strong>💡 Important:</strong> Wait 1-2 minutes after saving, then refresh this page and try again.
                </p>
            </div>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <button onclick="window.open('https://console.cloud.google.com/apis/credentials/consent', '_blank')" style="padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    Open Google Console
                </button>
                <button onclick="location.reload()" style="padding: 12px 24px; background: #4caf50; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    Retry After Config
                </button>
                <button onclick="taskManager.hideLoginModal()" style="padding: 12px 24px; background: #999; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    Continue Without Login
                </button>
            </div>
            <p style="margin-top: 20px; color: #666; font-size: 0.9em;">
                📖 Detailed instructions in <code>FIX_GOOGLE_LOGIN.md</code>
            </p>
        `;
    }

    handleCredentialResponse(response) {
        try {
            // Decode the JWT token to get user info
            const payload = JSON.parse(atob(response.credential.split('.')[1]));
            
            const previousUserId = this.user ? this.user.sub : null;
            const newUserId = payload.sub;
            
            this.user = {
                name: payload.name,
                email: payload.email,
                picture: payload.picture,
                sub: payload.sub,
                customName: null,
                customPicture: null
            };

            this.saveUser();
            
            // If switching users, load the new user's tasks
            if (previousUserId !== newUserId) {
                this.loadTasks();
                this.loadPoints();
                this.renderAllPages();
                this.updateAllStats();
                this.updatePointsDisplay();
            }
            
            this.updateUserDisplay();
            this.hideLoginModal();
            
            // Show welcome message
            this.showWelcomeNotification();
        } catch (error) {
            console.error('Error processing credential response:', error);
            alert('There was an error processing your sign-in. Please try again.');
        }
    }

    showWelcomeNotification() {
        const displayName = this.user.customName || this.user.name;
        const notification = document.createElement('div');
        notification.className = 'points-notification';
        notification.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>Welcome, ${displayName}! 🎉</span>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    updateUserDisplay() {
        const userProfile = document.getElementById('userProfile');
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        const logoutBtn = document.getElementById('logoutBtn');
        const loginBtn = document.getElementById('loginBtn');

        if (this.user) {
            // Use custom values if available, otherwise use Google values
            const displayName = this.user.customName || this.user.name;
            const displayPicture = this.user.customPicture || this.user.picture;
            
            userAvatar.src = displayPicture || this.user.picture;
            userName.textContent = displayName || this.user.name;
            userProfile.style.display = 'flex';
            logoutBtn.style.display = 'block';
            if (loginBtn) loginBtn.style.display = 'none';
        } else {
            userProfile.style.display = 'none';
            logoutBtn.style.display = 'none';
            if (loginBtn) loginBtn.style.display = 'block';
        }
    }

    showLoginModal() {
        const loginModal = document.getElementById('loginModal');
        loginModal.classList.remove('hidden');
    }

    hideLoginModal() {
        const loginModal = document.getElementById('loginModal');
        loginModal.classList.add('hidden');
    }

    logout() {
        // Save current user's data before logging out
        this.saveTasks();
        this.savePoints();
        
        this.user = null;
        this.saveUser();
        
        // Load guest tasks (or empty if no guest tasks exist)
        this.loadTasks();
        this.loadPoints();
        
        this.updateUserDisplay();
        this.renderAllPages();
        this.updateAllStats();
        this.updatePointsDisplay();
        this.showLoginModal();
    }

    saveUser() {
        if (this.user) {
            localStorage.setItem('dailyRushUser', JSON.stringify(this.user));
        } else {
            localStorage.removeItem('dailyRushUser');
        }
    }

    loadUser() {
        const saved = localStorage.getItem('dailyRushUser');
        if (saved) {
            try {
                this.user = JSON.parse(saved);
                // Ensure custom fields exist (for old users)
                if (!this.user.hasOwnProperty('customName')) {
                    this.user.customName = null;
                }
                if (!this.user.hasOwnProperty('customPicture')) {
                    this.user.customPicture = null;
                }
            } catch (e) {
                console.error('Error loading user:', e);
                this.user = null;
            }
        }
    }

    showEditProfileModal() {
        if (!this.user) return;
        
        const editModal = document.getElementById('editProfileModal');
        const editUserName = document.getElementById('editUserName');
        const editUserPhoto = document.getElementById('editUserPhoto');
        
        // Populate form with current values (custom or Google)
        editUserName.value = this.user.customName || '';
        editUserPhoto.value = this.user.customPicture || '';
        
        this.updateProfilePreview();
        editModal.classList.remove('hidden');
    }

    hideEditProfileModal() {
        const editModal = document.getElementById('editProfileModal');
        editModal.classList.add('hidden');
    }

    updateProfilePreview() {
        const editUserName = document.getElementById('editUserName');
        const editUserPhoto = document.getElementById('editUserPhoto');
        const namePreview = document.getElementById('namePreview');
        const profilePreview = document.getElementById('profilePreview');
        
        if (!editUserName || !editUserPhoto || !namePreview || !profilePreview) return;
        
        const nameValue = editUserName.value.trim();
        const photoValue = editUserPhoto.value.trim();
        
        // Update preview
        namePreview.textContent = nameValue || this.user.name || 'Your Name';
        
        if (photoValue) {
            profilePreview.src = photoValue;
            profilePreview.onerror = () => {
                profilePreview.src = this.user.picture || '';
            };
        } else {
            profilePreview.src = this.user.picture || '';
        }
    }

    saveProfileChanges() {
        if (!this.user) return;
        
        const editUserName = document.getElementById('editUserName');
        const editUserPhoto = document.getElementById('editUserPhoto');
        
        const nameValue = editUserName.value.trim();
        const photoValue = editUserPhoto.value.trim();
        
        // Validate photo URL if provided
        if (photoValue && !this.isValidUrl(photoValue)) {
            alert('Please enter a valid image URL (starting with http:// or https://)');
            return;
        }
        
        // Save custom values (empty string means use Google default)
        this.user.customName = nameValue || null;
        this.user.customPicture = photoValue || null;
        
        this.saveUser();
        this.updateUserDisplay();
        this.hideEditProfileModal();
        
        // Show success notification
        this.showProfileUpdateNotification();
    }

    resetProfileToGoogle() {
        if (!this.user) return;
        
        if (confirm('Reset your profile to use your Google account name and photo?')) {
            this.user.customName = null;
            this.user.customPicture = null;
            
            this.saveUser();
            this.updateUserDisplay();
            this.hideEditProfileModal();
            
            // Show success notification
            this.showProfileUpdateNotification();
        }
    }

    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    showProfileUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'points-notification';
        notification.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>Profile updated! ✨</span>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    initializeEventListeners() {
        const addTaskBtn = document.getElementById('addTaskBtn');
        const taskInput = document.getElementById('taskInput');
        const navButtons = document.querySelectorAll('.nav-btn');
        const clearAllBtn = document.getElementById('clearAllBtn');
        const exportBtn = document.getElementById('exportBtn');
        const clearCompletedBtn = document.getElementById('clearCompletedBtn');
        const logoutBtn = document.getElementById('logoutBtn');

        // Navigation buttons
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.target.closest('.nav-btn').dataset.page;
                this.navigateToPage(page);
            });
        });

        // Add task
        addTaskBtn.addEventListener('click', () => this.addTask());
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });

        // Search inputs
        document.getElementById('searchAll').addEventListener('input', (e) => {
            this.searchQueries.all = e.target.value;
            this.renderPage('all');
        });

        document.getElementById('searchActive').addEventListener('input', (e) => {
            this.searchQueries.active = e.target.value;
            this.renderPage('active');
        });

        document.getElementById('searchCompleted').addEventListener('input', (e) => {
            this.searchQueries.completed = e.target.value;
            this.renderPage('completed');
        });

        // Sort selects
        document.getElementById('sortAll').addEventListener('change', (e) => {
            this.sortOptions.all = e.target.value;
            this.renderPage('all');
        });

        document.getElementById('sortActive').addEventListener('change', (e) => {
            this.sortOptions.active = e.target.value;
            this.renderPage('active');
        });

        document.getElementById('sortCompleted').addEventListener('change', (e) => {
            this.sortOptions.completed = e.target.value;
            this.renderPage('completed');
        });

        // Clear all tasks
        clearAllBtn.addEventListener('click', () => this.clearAllTasks());

        // Export tasks
        exportBtn.addEventListener('click', () => this.exportTasks());

        // Clear completed tasks
        clearCompletedBtn.addEventListener('click', () => this.clearCompletedTasks());

        // Logout
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                this.logout();
            }
        });

        // Login button (show modal)
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                this.showLoginModal();
            });
        }

        // Close modal button
        const closeModalBtn = document.getElementById('closeModalBtn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                this.hideLoginModal();
            });
        }

        // Close modal when clicking outside
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.addEventListener('click', (e) => {
                if (e.target === loginModal) {
                    this.hideLoginModal();
                }
            });
        }

        // Edit profile button
        const editProfileBtn = document.getElementById('editProfileBtn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showEditProfileModal();
            });
        }

        // Also allow clicking on the user profile itself
        const userProfile = document.getElementById('userProfile');
        if (userProfile) {
            userProfile.addEventListener('click', () => {
                if (this.user) {
                    this.showEditProfileModal();
                }
            });
        }

        // Edit profile modal buttons
        const closeEditModalBtn = document.getElementById('closeEditModalBtn');
        if (closeEditModalBtn) {
            closeEditModalBtn.addEventListener('click', () => {
                this.hideEditProfileModal();
            });
        }

        const cancelProfileBtn = document.getElementById('cancelProfileBtn');
        if (cancelProfileBtn) {
            cancelProfileBtn.addEventListener('click', () => {
                this.hideEditProfileModal();
            });
        }

        const saveProfileBtn = document.getElementById('saveProfileBtn');
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', () => {
                this.saveProfileChanges();
            });
        }

        const resetProfileBtn = document.getElementById('resetProfileBtn');
        if (resetProfileBtn) {
            resetProfileBtn.addEventListener('click', () => {
                this.resetProfileToGoogle();
            });
        }

        // Close edit modal when clicking outside
        const editProfileModal = document.getElementById('editProfileModal');
        if (editProfileModal) {
            editProfileModal.addEventListener('click', (e) => {
                if (e.target === editProfileModal) {
                    this.hideEditProfileModal();
                }
            });
        }

        // Update preview as user types
        const editUserName = document.getElementById('editUserName');
        const editUserPhoto = document.getElementById('editUserPhoto');
        if (editUserName) {
            editUserName.addEventListener('input', () => {
                this.updateProfilePreview();
            });
        }
        if (editUserPhoto) {
            editUserPhoto.addEventListener('input', () => {
                this.updateProfilePreview();
            });
        }
    }

    navigateToPage(page) {
        this.currentPage = page;

        // Update navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`nav${page.charAt(0).toUpperCase() + page.slice(1)}`).classList.add('active');

        // Update page views
        document.querySelectorAll('.page-view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`page${page.charAt(0).toUpperCase() + page.slice(1)}`).classList.add('active');
    }

    addTask() {
        const taskInput = document.getElementById('taskInput');
        const difficultySelect = document.getElementById('taskDifficulty');
        const taskText = taskInput.value.trim();
        const difficulty = difficultySelect.value;

        if (taskText === '') {
            taskInput.focus();
            return;
        }

        const task = {
            id: Date.now(),
            text: taskText,
            difficulty: difficulty,
            completed: false,
            pointsEarned: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        taskInput.value = '';
        taskInput.focus();
        this.saveTasks();
        this.renderAllPages();
        this.updateAllStats();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            const wasCompleted = task.completed;
            task.completed = !task.completed;
            
            if (task.completed && !wasCompleted) {
                // Task just got completed - award points
                task.completedAt = new Date().toISOString();
                if (!task.pointsEarned) {
                    const points = this.pointsValues[task.difficulty] || 10;
                    this.totalPoints += points;
                    task.pointsEarned = true;
                    this.savePoints();
                    this.showPointsNotification(points, task.difficulty);
                }
            } else if (!task.completed && wasCompleted) {
                // Task was uncompleted - remove points if they were earned
                if (task.pointsEarned) {
                    const points = this.pointsValues[task.difficulty] || 10;
                    this.totalPoints = Math.max(0, this.totalPoints - points);
                    task.pointsEarned = false;
                    this.savePoints();
                }
                delete task.completedAt;
            }
            
            this.saveTasks();
            this.renderAllPages();
            this.updateAllStats();
            this.updateMotivationMessages();
            this.updatePointsDisplay();
        }
    }

    deleteTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task && task.completed && task.pointsEarned) {
            // Remove points if task was completed
            const points = this.pointsValues[task.difficulty || 'medium'] || 10;
            this.totalPoints = Math.max(0, this.totalPoints - points);
            this.savePoints();
        }
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.renderAllPages();
        this.updateAllStats();
        this.updatePointsDisplay();
    }

    getFilteredTasks(page) {
        let filtered = [];

        switch (page) {
            case 'active':
                filtered = this.tasks.filter(t => !t.completed);
                break;
            case 'completed':
                filtered = this.tasks.filter(t => t.completed);
                break;
            default:
                filtered = [...this.tasks];
        }

        // Apply search
        const searchQuery = this.searchQueries[page].toLowerCase();
        if (searchQuery) {
            filtered = filtered.filter(t => 
                t.text.toLowerCase().includes(searchQuery)
            );
        }

        // Apply sorting
        const sortOption = this.sortOptions[page];
        filtered.sort((a, b) => {
            switch (sortOption) {
                case 'newest':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'oldest':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case 'alphabetical':
                    return a.text.localeCompare(b.text);
                case 'reverse':
                    return b.text.localeCompare(a.text);
                default:
                    return 0;
            }
        });

        // For completed tasks, sort by completion date if available
        if (page === 'completed' && sortOption === 'newest') {
            filtered.sort((a, b) => {
                const aDate = a.completedAt ? new Date(a.completedAt) : new Date(a.createdAt);
                const bDate = b.completedAt ? new Date(b.completedAt) : new Date(b.createdAt);
                return bDate - aDate;
            });
        }

        return filtered;
    }

    getDifficultyLabel(difficulty) {
        const labels = {
            easy: 'Easy',
            medium: 'Medium',
            hard: 'Hard',
            expert: 'Expert'
        };
        return labels[difficulty] || 'Medium';
    }

    renderTask(task, listId) {
        const difficulty = task.difficulty || 'medium';
        const difficultyLabel = this.getDifficultyLabel(difficulty);
        const points = task.completed && task.pointsEarned ? ` (+${this.pointsValues[difficulty]} pts)` : '';
        
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <input 
                type="checkbox" 
                class="task-checkbox" 
                ${task.completed ? 'checked' : ''}
                onchange="taskManager.toggleTask(${task.id})"
            >
            <span class="task-text">
                ${this.escapeHtml(task.text)}
                <span class="task-difficulty ${difficulty}">${difficultyLabel}</span>
                ${points ? `<span style="color: #667eea; font-weight: 600;">${points}</span>` : ''}
            </span>
            <button class="task-delete" onclick="taskManager.deleteTask(${task.id})" title="Delete task">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
                Delete
            </button>
        `;
        return li;
    }

    renderPage(page) {
        const taskList = document.getElementById(`taskList${page.charAt(0).toUpperCase() + page.slice(1)}`);
        const emptyState = document.getElementById(`emptyState${page.charAt(0).toUpperCase() + page.slice(1)}`);
        const filteredTasks = this.getFilteredTasks(page);

        taskList.innerHTML = '';

        if (filteredTasks.length === 0) {
            emptyState.classList.add('show');
            taskList.style.display = 'none';
        } else {
            emptyState.classList.remove('show');
            taskList.style.display = 'block';

            filteredTasks.forEach(task => {
                const li = this.renderTask(task, taskList.id);
                taskList.appendChild(li);
            });
        }
    }

    renderAllPages() {
        this.renderPage('all');
        this.renderPage('active');
        this.renderPage('completed');
    }

    updateAllStats() {
        const allTasks = this.tasks.length;
        const activeTasks = this.tasks.filter(t => !t.completed).length;
        const completedTasks = this.tasks.filter(t => t.completed).length;

        // All page stats
        document.getElementById('allTasksCount').textContent = allTasks;
        document.getElementById('allActiveCount').textContent = activeTasks;
        document.getElementById('allCompletedCount').textContent = completedTasks;
        document.getElementById('pagePointsDisplay').textContent = this.totalPoints;

        // Active page stats
        document.getElementById('activeTasksCount').textContent = activeTasks;

        // Completed page stats
        document.getElementById('completedTasksCount').textContent = completedTasks;

        this.updateMotivationMessages();
    }

    updatePointsDisplay() {
        document.getElementById('totalPoints').textContent = this.totalPoints;
    }

    playCongratSound() {
        try {
            // Resume audio context if suspended (required by some browsers)
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            let audioContext = this.audioContext;
            
            if (!audioContext) {
                audioContext = new AudioContextClass();
                this.audioContext = audioContext;
            }
            
            // Resume if suspended
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            // Create a pleasant congratulatory chime - C major chord
            const frequencies = [
                523.25, // C5
                659.25, // E5
                783.99  // G5
            ];
            
            frequencies.forEach((freq, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = freq;
                oscillator.type = 'sine';
                
                // Create envelope for smooth, pleasant sound
                const now = audioContext.currentTime;
                const delay = index * 0.03; // Slight stagger for chord effect
                const duration = 0.4;
                
                gainNode.gain.setValueAtTime(0, now + delay);
                gainNode.gain.linearRampToValueAtTime(0.2, now + delay + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
                
                oscillator.start(now + delay);
                oscillator.stop(now + delay + duration);
            });
            
            // Add a higher celebratory note after the chord
            setTimeout(() => {
                const highOsc = audioContext.createOscillator();
                const highGain = audioContext.createGain();
                
                highOsc.connect(highGain);
                highGain.connect(audioContext.destination);
                
                highOsc.frequency.value = 1046.50; // C6 - higher octave
                highOsc.type = 'sine';
                
                const now = audioContext.currentTime;
                highGain.gain.setValueAtTime(0, now);
                highGain.gain.linearRampToValueAtTime(0.2, now + 0.01);
                highGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                
                highOsc.start(now);
                highOsc.stop(now + 0.25);
            }, 120);
            
        } catch (error) {
            // Silently fail if audio can't be played
            console.log('Audio playback unavailable');
        }
    }

    showPointsNotification(points, difficulty) {
        // Play congratulatory sound
        this.playCongratSound();
        
        const notification = document.createElement('div');
        notification.className = 'points-notification';
        notification.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            <span>+${points} Points!</span>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    updateMotivationMessages() {
        const activeCount = this.tasks.filter(t => !t.completed).length;
        const completedCount = this.tasks.filter(t => t.completed).length;

        // Motivation messages
        const motivationMessages = [
            "You're doing great! Keep going!",
            "Stay focused and you'll finish them all!",
            "Every step counts! Keep pushing forward!",
            "You've got this! One task at a time!",
            "Keep the momentum going!"
        ];

        const achievementMessages = [
            "Great job completing tasks!",
            "You're on fire! Keep it up!",
            "Amazing progress!",
            "Celebrate your wins!",
            "You're crushing it!"
        ];

        if (activeCount > 0) {
            const msg = motivationMessages[Math.floor(Math.random() * motivationMessages.length)];
            document.getElementById('motivationText').textContent = msg;
        }

        if (completedCount > 0) {
            const msg = achievementMessages[Math.floor(Math.random() * achievementMessages.length)];
            document.getElementById('achievementText').textContent = msg;
        }
    }

    saveTasks() {
        // Store tasks per user if logged in, or use default key if not logged in
        const storageKey = this.user ? `dailyRushTasks_${this.user.sub}` : 'dailyRushTasks_guest';
        localStorage.setItem(storageKey, JSON.stringify(this.tasks));
    }

    loadTasks() {
        // Load tasks for current user, or guest tasks if not logged in
        const storageKey = this.user ? `dailyRushTasks_${this.user.sub}` : 'dailyRushTasks_guest';
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                this.tasks = JSON.parse(saved);
            } catch (e) {
                console.error('Error loading tasks:', e);
                this.tasks = [];
            }
        } else {
            this.tasks = [];
        }
    }

    savePoints() {
        // Store points per user if logged in, or use default key if not logged in
        const storageKey = this.user ? `dailyRushPoints_${this.user.sub}` : 'dailyRushPoints_guest';
        localStorage.setItem(storageKey, this.totalPoints.toString());
    }

    loadPoints() {
        // Load points for current user, or guest points if not logged in
        const storageKey = this.user ? `dailyRushPoints_${this.user.sub}` : 'dailyRushPoints_guest';
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            this.totalPoints = parseInt(saved, 10) || 0;
        } else {
            // Calculate points from existing completed tasks if points weren't saved
            this.totalPoints = this.tasks
                .filter(t => t.completed && (t.pointsEarned !== false))
                .reduce((sum, t) => {
                    // For old tasks without pointsEarned flag, assume they earned points
                    if (t.pointsEarned !== false) {
                        return sum + (this.pointsValues[t.difficulty || 'medium'] || 10);
                    }
                    return sum;
                }, 0);
            // Mark old completed tasks as having earned points
            this.tasks.forEach(t => {
                if (t.completed && t.pointsEarned === undefined) {
                    t.pointsEarned = true;
                }
            });
            this.saveTasks();
            this.savePoints();
        }
    }

    clearAllTasks() {
        if (this.tasks.length === 0) {
            return;
        }

        const confirmed = confirm(`Are you sure you want to delete all ${this.tasks.length} task(s)? This will reset your points!`);
        if (confirmed) {
            this.tasks = [];
            this.totalPoints = 0;
            this.saveTasks();
            this.savePoints();
            this.renderAllPages();
            this.updateAllStats();
            this.updatePointsDisplay();
        }
    }

    clearCompletedTasks() {
        const completedTasks = this.tasks.filter(t => t.completed);
        const completedCount = completedTasks.length;
        if (completedCount === 0) {
            alert('No completed tasks to clear!');
            return;
        }

        const confirmed = confirm(`Are you sure you want to delete all ${completedCount} completed task(s)? This will remove the points earned from these tasks!`);
        if (confirmed) {
            // Remove points for deleted completed tasks
            completedTasks.forEach(task => {
                if (task.pointsEarned) {
                    const points = this.pointsValues[task.difficulty || 'medium'] || 10;
                    this.totalPoints = Math.max(0, this.totalPoints - points);
                }
            });
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveTasks();
            this.savePoints();
            this.renderAllPages();
            this.updateAllStats();
            this.updatePointsDisplay();
        }
    }

    exportTasks() {
        if (this.tasks.length === 0) {
            alert('No tasks to export!');
            return;
        }

        const exportData = {
            exportDate: new Date().toISOString(),
            totalTasks: this.tasks.length,
            activeTasks: this.tasks.filter(t => !t.completed).length,
            completedTasks: this.tasks.filter(t => t.completed).length,
            tasks: this.tasks
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `daily-rush-tasks-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the task manager when the page loads
let taskManager;
document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
});
