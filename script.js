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
        this.authMode = 'signin'; // 'signin' or 'signup'
        
        // Pomodoro Timer
        this.pomodoro = {
            mode: 'work', // 'work', 'shortBreak', 'longBreak'
            timeLeft: 25 * 60, // in seconds
            totalTime: 25 * 60,
            isRunning: false,
            isPaused: false,
            timerInterval: null,
            workCount: 0, // number of completed work sessions
            totalFocusTime: 0, // total minutes focused today
            completedToday: 0
        };
        // Initialize Google Sign-In first (don't wait for database)
        this.initializeGoogleSignIn();
        
        // Initialize database in parallel (non-blocking)
        this.initializeDatabase().then(() => {
            // Database initialized, continue with user loading
        }).catch(() => {
            // Database failed, continue anyway
        });
        
        // Load user first, then load their tasks
        this.loadUser().then(() => {
            // If no user is logged in, show login modal immediately
            if (!this.user) {
                this.showLoginModal();
                // Disable task functionality until logged in
                this.disableTaskFunctionality();
            } else {
                // Migrate data from localStorage if needed
                this.migrateData();
                // Load tasks after user is loaded (so we know which user's tasks to load)
                this.loadTasks();
                this.loadPoints();
                this.renderAllPages();
                this.updateAllStats();
                this.updatePointsDisplay();
            }
            
            this.initializeEventListeners();
            
            // Update user display (will show login button if not logged in)
            this.updateUserDisplay();
            
            // Initialize date input minimum to today
            this.initializeDateInput();
        });
    }

    initializeDateInput() {
        const taskDateInput = document.getElementById('taskDate');
        if (taskDateInput) {
            // Set minimum date to today
            const today = new Date().toISOString().split('T')[0];
            taskDateInput.min = today;
        }
    }

    async initializeDatabase() {
        try {
            // Initialize database service
            const initialized = await databaseService.initialize();
            if (!initialized) {
                console.warn('Database not available, using localStorage fallback');
            }
            return initialized;
        } catch (error) {
            // Don't let Firebase errors block Google Sign-In
            console.error('Firebase initialization error (non-blocking):', error);
            return false;
        }
    }

    async migrateData() {
        if (!this.user || !this.user.sub) return;
        
        try {
            await databaseService.migrateFromLocalStorage(this.user.sub);
        } catch (error) {
            console.error('Error during migration:', error);
        }
    }

    initializeGoogleSignIn() {
        // Check if running from file:// protocol
        if (window.location.protocol === 'file:') {
            this.showServerRequiredMessage();
            return;
        }

        // Wait for Google Identity Services to load
        if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
            try {
                const buttonElement = document.getElementById('googleSignInButton');
                if (!buttonElement) {
                    console.error('Google Sign-In button element not found');
                    setTimeout(() => this.initializeGoogleSignIn(), 200);
                    return;
                }

                console.log('Initializing Google Sign-In with Client ID:', this.googleClientId);
                
                google.accounts.id.initialize({
                    client_id: this.googleClientId,
                    callback: (response) => {
                        console.log('🎉 Google Sign-In callback received!');
                        console.log('Response:', response);
                        try {
                            if (response && response.credential) {
                                console.log('✅ Valid credential received, processing...');
                                // Use setTimeout to ensure this runs in next tick
                                setTimeout(() => {
                                    this.handleCredentialResponse(response);
                                }, 100);
                            } else {
                                console.error('❌ Invalid response from Google Sign-In:', response);
                                alert('Invalid response from Google. Response: ' + JSON.stringify(response));
                            }
                        } catch (err) {
                            console.error('❌ Error in callback handler:', err);
                            alert('Error handling login: ' + err.message);
                        }
                    },
                    error_callback: (error) => {
                        console.error('❌ Google Sign-In error callback:', error);
                        this.handleError(error);
                    },
                    ux_mode: 'popup',
                    auto_select: false,
                    cancel_on_tap_outside: true,
                    itp_support: true,
                    context: 'signin',
                    login_uri: window.location.origin,
                    native_callback: null
                });

                // Clear any existing content in the button element
                buttonElement.innerHTML = '';
                
                google.accounts.id.renderButton(
                    buttonElement,
                    {
                        theme: 'outline',
                        size: 'large',
                        width: 300,
                        text: 'signin_with',
                        locale: 'en',
                        type: 'standard'
                    }
                );
                
                console.log('Google Sign-In button rendered successfully');
            } catch (error) {
                console.error('Google Sign-In initialization error:', error);
                this.showOAuthError();
            }
        } else {
            // Retry after a short delay if Google script hasn't loaded
            console.log('Google Identity Services not loaded yet, retrying...');
            setTimeout(() => this.initializeGoogleSignIn(), 200);
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

    async handleCredentialResponse(response) {
        try {
            console.log('🔐 Processing Google Sign-In response...');
            console.log('Response object:', response);
            
            if (!response || !response.credential) {
                console.error('❌ Invalid response - no credential:', response);
                alert('Invalid response from Google Sign-In. Please try again.');
                return;
            }
            
            // Decode the JWT token to get user info
            const parts = response.credential.split('.');
            if (parts.length !== 3) {
                console.error('❌ Invalid JWT format');
                alert('Invalid token format. Please try again.');
                return;
            }
            
            const payload = JSON.parse(atob(parts[1]));
            console.log('✅ Decoded user payload:', payload);
            
            if (!payload.sub || !payload.email) {
                console.error('❌ Missing required user data in payload');
                alert('Missing user information. Please try again.');
                return;
            }
            
            const previousUserId = this.user ? this.user.sub : null;
            const newUserId = payload.sub;
            
            this.user = {
                name: payload.name || 'User',
                email: payload.email,
                picture: payload.picture || '',
                sub: payload.sub,
                customName: null,
                customPicture: null
            };

            console.log('👤 User data set:', this.user);
            console.log('💾 Saving user to Firebase...');
            
            // Sign in to Firebase Auth with Google credential
            try {
                if (typeof firebase !== 'undefined' && firebase.auth) {
                    if (!firebase.apps.length) {
                        firebase.initializeApp(firebaseConfig);
                    }
                    const auth = firebase.auth();
                    const GoogleAuthProvider = firebase.auth.GoogleAuthProvider;
                    
                    // Convert Google Identity Services credential to Firebase Auth credential
                    // The credential from Google Identity Services is already a JWT token
                    const credential = GoogleAuthProvider.credential(response.credential);
                    
                    // Sign in to Firebase Auth (this will create or sign in the user)
                    const userCredential = await auth.signInWithCredential(credential);
                    const firebaseUser = userCredential.user;
                    
                    console.log('✅ Signed in to Firebase Auth:', firebaseUser.uid);
                    console.log('✅ User email:', firebaseUser.email);
                    console.log('✅ User display name:', firebaseUser.displayName);
                    
                    // Update user object with Firebase Auth user ID (use Firebase UID as primary identifier)
                    this.user.sub = firebaseUser.uid;
                    this.user.email = firebaseUser.email || this.user.email;
                    this.user.name = firebaseUser.displayName || this.user.name;
                    this.user.picture = firebaseUser.photoURL || this.user.picture;
                    
                    // Ensure user profile is updated in Firebase Auth
                    if (payload.name && !firebaseUser.displayName) {
                        await firebaseUser.updateProfile({
                            displayName: payload.name,
                            photoURL: payload.picture || firebaseUser.photoURL
                        });
                    }
                    
                    console.log('✅ User synced with Firebase Auth and will appear in Firebase Console');
                } else {
                    console.warn('⚠️ Firebase Auth not available, using Google ID only');
                }
            } catch (authError) {
                console.error('⚠️ Firebase Auth sign-in failed:', authError);
                if (authError.code === 'auth/credential-already-in-use') {
                    console.warn('Credential already in use, user might already be signed in');
                } else if (authError.code === 'auth/popup-closed-by-user') {
                    console.warn('Popup was closed by user');
                } else {
                    console.error('Auth error code:', authError.code);
                    console.error('Auth error message:', authError.message);
                }
                // Continue anyway - we still have the Google credential and will save to Firestore
            }
            
            // Save user to Firestore and localStorage
            await this.saveUser().catch(err => {
                console.warn('Warning: Could not save user to database:', err);
            });
            
            // Also save to localStorage immediately
            localStorage.setItem('dailyRushUser', JSON.stringify(this.user));
            console.log('✅ User saved to localStorage');
            
            // Migrate data from localStorage if needed (non-blocking)
            this.migrateData().catch(err => {
                console.warn('Warning: Migration failed:', err);
            });
            
            // Load user's tasks (either new user or switching users)
            console.log('📋 Loading tasks...');
            this.loadTasks();
            this.loadPoints();
            this.renderAllPages();
            this.updateAllStats();
            this.updatePointsDisplay();
            
            // Enable task functionality now that user is logged in
            this.enableTaskFunctionality();
            
            console.log('🔄 Updating user display...');
            this.updateUserDisplay();
            
            console.log('🚪 Hiding login modal...');
            this.hideLoginModal();
            
            // Show welcome message
            console.log('👋 Showing welcome notification...');
            this.showWelcomeNotification();
            
            // Show welcome video for new users
            this.checkAndShowWelcomeVideo();
            
            console.log('✅ Login complete!');
            
        } catch (error) {
            console.error('❌ Error processing credential response:', error);
            console.error('Error stack:', error.stack);
            alert('Error: ' + (error.message || 'Unknown error occurred. Please check console for details.'));
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
        
        // Update close button visibility
        this.updateCloseButtonVisibility();
    }

    updateCloseButtonVisibility() {
        const closeModalBtn = document.getElementById('closeModalBtn');
        if (closeModalBtn) {
            // Hide close button if user is not logged in (login is required)
            if (!this.user) {
                closeModalBtn.style.display = 'none';
            } else {
                closeModalBtn.style.display = 'block';
            }
        }
    }

    showLoginModal() {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.classList.remove('hidden');
            console.log('📱 Login modal shown');
            
            // Reset to sign in mode
            this.switchAuthMode('signin');
            
            // Re-initialize Google Sign-In button when modal is shown
            setTimeout(() => {
                if (!this.user) {
                    this.initializeGoogleSignIn();
                }
            }, 300);
        }
    }

    hideLoginModal() {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.classList.add('hidden');
            console.log('🚪 Login modal hidden');
        }
    }

    switchAuthMode(mode) {
        this.authMode = mode;
        const signInTab = document.getElementById('signInTab');
        const signUpTab = document.getElementById('signUpTab');
        const authUsernameGroup = document.getElementById('authUsernameGroup');
        const authSubmitText = document.getElementById('authSubmitText');
        const authError = document.getElementById('authError');
        
        // Update tabs
        if (signInTab && signUpTab) {
            if (mode === 'signin') {
                signInTab.classList.add('active');
                signUpTab.classList.remove('active');
                if (authUsernameGroup) authUsernameGroup.style.display = 'none';
                if (authSubmitText) authSubmitText.textContent = 'Sign In';
            } else {
                signUpTab.classList.add('active');
                signInTab.classList.remove('active');
                if (authUsernameGroup) authUsernameGroup.style.display = 'block';
                if (authSubmitText) authSubmitText.textContent = 'Sign Up';
            }
        }
        
        // Clear error
        if (authError) {
            authError.style.display = 'none';
            authError.textContent = '';
        }
        
        // Clear form
        const authEmail = document.getElementById('authEmail');
        const authPassword = document.getElementById('authPassword');
        const authUsername = document.getElementById('authUsername');
        if (authEmail) authEmail.value = '';
        if (authPassword) authPassword.value = '';
        if (authUsername) authUsername.value = '';
    }

    async handleEmailAuth() {
        const authEmail = document.getElementById('authEmail');
        const authPassword = document.getElementById('authPassword');
        const authUsername = document.getElementById('authUsername');
        const authError = document.getElementById('authError');
        const authSubmitBtn = document.getElementById('authSubmitBtn');
        const authSubmitText = document.getElementById('authSubmitText');
        
        if (!authEmail || !authPassword) return;
        
        const email = authEmail.value.trim();
        const password = authPassword.value;
        const username = authUsername ? authUsername.value.trim() : '';
        
        // Validate
        if (!email || !password) {
            this.showAuthError('Please fill in all required fields');
            return;
        }
        
        if (password.length < 6) {
            this.showAuthError('Password must be at least 6 characters');
            return;
        }
        
        if (this.authMode === 'signup' && !username) {
            this.showAuthError('Please choose a username');
            return;
        }
        
        // Disable button
        if (authSubmitBtn) {
            authSubmitBtn.disabled = true;
            if (authSubmitText) authSubmitText.textContent = 'Please wait...';
        }
        
        try {
            let firebaseUser;
            
            // Check if Firebase Auth is available
            if (typeof firebase === 'undefined' || !firebase.auth) {
                this.showAuthError('Firebase Auth not available. Please check your connection and ensure Firebase SDK is loaded.');
                if (authSubmitBtn) {
                    authSubmitBtn.disabled = false;
                    if (authSubmitText) authSubmitText.textContent = this.authMode === 'signin' ? 'Sign In' : 'Sign Up';
                }
                return;
            }
            
            // Initialize Firebase Auth if needed
            try {
                if (!firebase.apps.length) {
                    if (!firebaseConfig || !firebaseConfig.apiKey) {
                        throw new Error('Firebase configuration is missing. Please check firebase-config.js');
                    }
                    firebase.initializeApp(firebaseConfig);
                }
            } catch (initError) {
                console.error('Firebase initialization error:', initError);
                if (initError.code === 'auth/api-key-not-valid') {
                    this.showAuthError('Invalid Firebase API key. Please update your Firebase configuration. See console for details.');
                } else {
                    this.showAuthError('Firebase initialization failed: ' + initError.message);
                }
                if (authSubmitBtn) {
                    authSubmitBtn.disabled = false;
                    if (authSubmitText) authSubmitText.textContent = this.authMode === 'signin' ? 'Sign In' : 'Sign Up';
                }
                return;
            }
            
            const auth = firebase.auth();
            
            if (this.authMode === 'signup') {
                // Create new user
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                firebaseUser = userCredential.user;
                
                // Update profile with username
                if (username) {
                    await firebaseUser.updateProfile({
                        displayName: username
                    });
                }
                
                console.log('✅ New user created:', firebaseUser.uid);
            } else {
                // Sign in existing user
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                firebaseUser = userCredential.user;
                console.log('✅ User signed in:', firebaseUser.uid);
            }
            
            // Get user data
            const displayName = firebaseUser.displayName || username || email.split('@')[0];
            const photoURL = firebaseUser.photoURL || '';
            
            // Set user object
            this.user = {
                name: displayName,
                email: firebaseUser.email,
                picture: photoURL,
                sub: firebaseUser.uid,
                customName: null,
                customPicture: null
            };
            
            // Save user
            await this.saveUser();
            
            // Load user data from database
            await this.loadUser();
            
            // Load tasks and points
            this.loadTasks();
            this.loadPoints();
            this.renderAllPages();
            this.updateAllStats();
            this.updatePointsDisplay();
            
            // Enable task functionality
            this.enableTaskFunctionality();
            
            // Update UI
            this.updateUserDisplay();
            this.hideLoginModal();
            
            // Show welcome message
            this.showWelcomeNotification();
            
            // Show welcome video for new users
            this.checkAndShowWelcomeVideo();
            
            console.log('✅ Email authentication successful');
            
        } catch (error) {
            console.error('❌ Authentication error:', error);
            let errorMessage = 'An error occurred. Please try again.';
            
            if (error.code === 'auth/operation-not-allowed') {
                errorMessage = 'Email/Password authentication is not enabled. Please enable it in Firebase Console:\n\n1. Go to Firebase Console > Authentication > Sign-in method\n2. Click on "Email/Password"\n3. Enable it and click Save\n\nThen refresh this page.';
            } else if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered. Please sign in instead.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak. Please use a stronger password.';
            } else if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email. Please sign up first.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password. Please try again.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed attempts. Please try again later.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            this.showAuthError(errorMessage);
        } finally {
            // Re-enable button
            if (authSubmitBtn) {
                authSubmitBtn.disabled = false;
                if (authSubmitText) authSubmitText.textContent = this.authMode === 'signin' ? 'Sign In' : 'Sign Up';
            }
        }
    }

    showAuthError(message) {
        const authError = document.getElementById('authError');
        if (authError) {
            authError.textContent = message;
            authError.style.display = 'block';
            // Scroll to error
            authError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    async logout() {
        console.log('🚪 Starting logout process...');
        
        // Store user ID before clearing
        const previousUserId = this.user ? this.user.sub : null;
        
        // Start async save operations (don't wait for them)
        Promise.all([
            this.saveTasks().catch(err => console.warn('Save tasks error:', err)),
            this.savePoints().catch(err => console.warn('Save points error:', err))
        ]).catch(() => {}); // Ignore errors
        
        // Unsubscribe from database listeners if they exist
        if (this.taskUnsubscribe && typeof this.taskUnsubscribe === 'function') {
            try {
                this.taskUnsubscribe();
                this.taskUnsubscribe = null;
            } catch (error) {
                console.warn('Error unsubscribing from database:', error);
            }
        }
        
        // Clear user data immediately
        this.user = null;
        
        // Clear from localStorage immediately
        localStorage.removeItem('dailyRushUser');
        if (previousUserId) {
            // Clear user-specific data
            localStorage.removeItem(`dailyRushTasks_${previousUserId}`);
            localStorage.removeItem(`dailyRushPoints_${previousUserId}`);
        }
        
        // Clear tasks and points display immediately
        this.tasks = [];
        this.totalPoints = 0;
        
        // Update UI immediately (don't wait for async operations)
        this.disableTaskFunctionality();
        this.updateUserDisplay();
        this.renderAllPages();
        this.updateAllStats();
        this.updatePointsDisplay();
        this.showLoginModal();
        
        console.log('✅ Logout UI updated');
        
        // Continue with background cleanup (non-blocking)
        try {
            // Save null user (clears database user if needed)
            await this.saveUser().catch(err => console.warn('Save user error:', err));
            
            // Sign out from Firebase Auth (non-blocking)
            if (typeof firebase !== 'undefined' && firebase.auth) {
                try {
                    const auth = firebase.auth();
                    await auth.signOut();
                    console.log('✅ Signed out from Firebase Auth');
                } catch (error) {
                    console.warn('Error signing out from Firebase Auth:', error);
                }
            }
            
            // Revoke Google session if available (non-blocking)
            if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
                try {
                    // Disable auto sign-in for future sessions
                    google.accounts.id.disableAutoSelect();
                } catch (error) {
                    console.warn('Error disabling auto-select:', error);
                }
            }
            
            console.log('✅ Logout complete');
        } catch (error) {
            console.error('❌ Error during logout cleanup:', error);
            // Already logged out, so ignore cleanup errors
        }
    }

    disableTaskFunctionality() {
        // Disable task input and buttons
        const taskInput = document.getElementById('taskInput');
        const addTaskBtn = document.getElementById('addTaskBtn');
        const difficultySelect = document.getElementById('taskDifficulty');
        const taskDateInput = document.getElementById('taskDate');
        const clearAllBtn = document.getElementById('clearAllBtn');
        const exportBtn = document.getElementById('exportBtn');
        const clearCompletedBtn = document.getElementById('clearCompletedBtn');
        
        if (taskInput) {
            taskInput.disabled = true;
            taskInput.placeholder = 'Please login to add tasks';
        }
        if (addTaskBtn) {
            addTaskBtn.disabled = true;
            addTaskBtn.style.opacity = '0.5';
            addTaskBtn.style.cursor = 'not-allowed';
        }
        if (difficultySelect) {
            difficultySelect.disabled = true;
        }
        if (taskDateInput) {
            taskDateInput.disabled = true;
        }
        if (clearAllBtn) {
            clearAllBtn.disabled = true;
            clearAllBtn.style.opacity = '0.5';
        }
        if (exportBtn) {
            exportBtn.disabled = true;
            exportBtn.style.opacity = '0.5';
        }
        if (clearCompletedBtn) {
            clearCompletedBtn.disabled = true;
            clearCompletedBtn.style.opacity = '0.5';
        }
        
        // Show login required message
        this.showLoginRequiredMessage();
    }

    enableTaskFunctionality() {
        // Enable task input and buttons
        const taskInput = document.getElementById('taskInput');
        const addTaskBtn = document.getElementById('addTaskBtn');
        const difficultySelect = document.getElementById('taskDifficulty');
        const taskDateInput = document.getElementById('taskDate');
        const clearAllBtn = document.getElementById('clearAllBtn');
        const exportBtn = document.getElementById('exportBtn');
        const clearCompletedBtn = document.getElementById('clearCompletedBtn');
        
        if (taskInput) {
            taskInput.disabled = false;
            taskInput.placeholder = 'Add a new task...';
        }
        if (addTaskBtn) {
            addTaskBtn.disabled = false;
            addTaskBtn.style.opacity = '1';
            addTaskBtn.style.cursor = 'pointer';
        }
        if (difficultySelect) {
            difficultySelect.disabled = false;
        }
        if (taskDateInput) {
            taskDateInput.disabled = false;
        }
        if (clearAllBtn) {
            clearAllBtn.disabled = false;
            clearAllBtn.style.opacity = '1';
        }
        if (exportBtn) {
            exportBtn.disabled = false;
            exportBtn.style.opacity = '1';
        }
        if (clearCompletedBtn) {
            clearCompletedBtn.disabled = false;
            clearCompletedBtn.style.opacity = '1';
        }
        
        // Hide login required message
        this.hideLoginRequiredMessage();
    }

    showLoginRequiredMessage() {
        // Check if message already exists
        let message = document.getElementById('loginRequiredMessage');
        if (!message) {
            message = document.createElement('div');
            message.id = 'loginRequiredMessage';
            message.className = 'login-required-message';
            message.innerHTML = `
                <div class="login-required-content">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <h3>Login Required</h3>
                    <p>Please sign in with Google to start managing your tasks.</p>
                    <button class="btn-login-required" onclick="taskManager.showLoginModal()">Sign In with Google</button>
                </div>
            `;
            
            // Insert after the task input section
            const container = document.querySelector('.container');
            const taskInputSection = document.querySelector('.task-input-section');
            if (container && taskInputSection) {
                container.insertBefore(message, taskInputSection.nextSibling);
            }
        }
        message.style.display = 'block';
    }

    hideLoginRequiredMessage() {
        const message = document.getElementById('loginRequiredMessage');
        if (message) {
            message.style.display = 'none';
        }
    }

    async saveUser() {
        try {
            if (this.user && this.user.sub) {
                // Always save to localStorage first (immediate)
                localStorage.setItem('dailyRushUser', JSON.stringify(this.user));
                console.log('✅ User saved to localStorage');
                
                // Then try to save to database (non-blocking)
                if (databaseService && databaseService.isInitialized) {
                    try {
                        await databaseService.saveUser(this.user.sub, {
                            email: this.user.email,
                            name: this.user.name,
                            picture: this.user.picture,
                            customName: this.user.customName,
                            customPicture: this.user.customPicture,
                            totalPoints: this.totalPoints
                        });
                        console.log('✅ User saved to database');
                    } catch (dbError) {
                        console.warn('⚠️ Database save failed (using localStorage only):', dbError);
                        // Continue - localStorage is already saved
                    }
                }
            } else {
                localStorage.removeItem('dailyRushUser');
            }
        } catch (error) {
            console.error('❌ Error in saveUser:', error);
            // Still save to localStorage as fallback
            if (this.user) {
                try {
                    localStorage.setItem('dailyRushUser', JSON.stringify(this.user));
                } catch (e) {
                    console.error('❌ Could not save to localStorage:', e);
                }
            }
        }
    }

    async loadUser() {
        // Check Firebase Auth state first (for email/password and Google users)
        if (typeof firebase !== 'undefined' && firebase.auth) {
            try {
                if (!firebase.apps.length) {
                    firebase.initializeApp(firebaseConfig);
                }
                const auth = firebase.auth();
                
                // Wait for auth state to be ready (handles async initialization)
                let firebaseUser = auth.currentUser;
                if (!firebaseUser) {
                    // Wait a bit for auth state to initialize
                    await new Promise(resolve => setTimeout(resolve, 100));
                    firebaseUser = auth.currentUser;
                }
                
                // Also set up auth state listener to catch changes
                auth.onAuthStateChanged((user) => {
                    if (user && !this.user) {
                        // User signed in via Firebase Auth
                        const displayName = user.displayName || user.email.split('@')[0];
                        this.user = {
                            name: displayName,
                            email: user.email,
                            picture: user.photoURL || '',
                            sub: user.uid,
                            customName: null,
                            customPicture: null
                        };
                        localStorage.setItem('dailyRushUser', JSON.stringify(this.user));
                        // Reload tasks and update UI
                        this.loadTasks();
                        this.loadPoints();
                        this.renderAllPages();
                        this.updateAllStats();
                        this.updatePointsDisplay();
                        this.enableTaskFunctionality();
                        this.updateUserDisplay();
                        // Show welcome video for new users
                        this.checkAndShowWelcomeVideo();
                    }
                });
                
                if (firebaseUser) {
                    // User is logged in via Firebase Auth
                    const displayName = firebaseUser.displayName || firebaseUser.email.split('@')[0];
                    this.user = {
                        name: displayName,
                        email: firebaseUser.email,
                        picture: firebaseUser.photoURL || '',
                        sub: firebaseUser.uid,
                        customName: null,
                        customPicture: null
                    };
                    // Save to localStorage
                    localStorage.setItem('dailyRushUser', JSON.stringify(this.user));
                }
            } catch (e) {
                console.warn('Firebase Auth check failed:', e);
            }
        }
        
        // Try localStorage for Google Sign-In users or fallback
        if (!this.user) {
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
                    console.error('Error loading user from localStorage:', e);
                    this.user = null;
                }
            }
        }
        
        // Load from database if available (will sync)
        if (this.user && this.user.sub && databaseService.isInitialized) {
            try {
                const dbUser = await databaseService.loadUser(this.user.sub);
                if (dbUser) {
                    // Merge database data (overwrites localStorage)
                    this.user = { ...this.user, ...dbUser };
                    if (dbUser.totalPoints !== undefined) {
                        this.totalPoints = dbUser.totalPoints;
                    }
                }
            } catch (e) {
                console.warn('Error loading user from database:', e);
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

        // Auth tabs
        const signInTab = document.getElementById('signInTab');
        const signUpTab = document.getElementById('signUpTab');
        if (signInTab) {
            signInTab.addEventListener('click', () => this.switchAuthMode('signin'));
        }
        if (signUpTab) {
            signUpTab.addEventListener('click', () => this.switchAuthMode('signup'));
        }

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
            if (e.key === 'Enter' && !taskInput.disabled) {
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
        clearAllBtn.addEventListener('click', () => {
            if (this.user) {
                this.clearAllTasks();
            } else {
                this.showLoginModal();
            }
        });

        // Export tasks
        exportBtn.addEventListener('click', () => {
            if (this.user) {
                this.exportTasks();
            } else {
                this.showLoginModal();
            }
        });

        // Clear completed tasks
        clearCompletedBtn.addEventListener('click', () => {
            if (this.user) {
                this.clearCompletedTasks();
            } else {
                this.showLoginModal();
            }
        });

        // Logout - use event delegation for reliability
        const iconBarRight = document.querySelector('.icon-bar-right');
        if (iconBarRight) {
            iconBarRight.addEventListener('click', (e) => {
                const logoutBtn = e.target.closest('#logoutBtn');
                if (logoutBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔄 Logout button clicked');
                    if (confirm('Are you sure you want to logout?')) {
                        console.log('✅ User confirmed logout, executing...');
                        this.logout().catch(error => {
                            console.error('❌ Logout failed:', error);
                            alert('Logout failed. Please try again or refresh the page.');
                        });
                    } else {
                        console.log('❌ User cancelled logout');
                    }
                }
            });
        }
        
        // Also attach directly to the button as backup
        if (logoutBtn) {
            const handleLogout = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔄 Logout button clicked (direct)');
                if (confirm('Are you sure you want to logout?')) {
                    console.log('✅ User confirmed logout, executing...');
                    this.logout().catch(error => {
                        console.error('❌ Logout failed:', error);
                        alert('Logout failed. Please try again or refresh the page.');
                    });
                } else {
                    console.log('❌ User cancelled logout');
                }
            };
            logoutBtn.addEventListener('click', handleLogout);
            // Also add mousedown as backup
            logoutBtn.addEventListener('mousedown', handleLogout);
        } else {
            console.error('Logout button not found');
        }

        // Login button (show modal)
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                this.showLoginModal();
            });
        }

        // Close modal button (only allow if user is logged in)
        const closeModalBtn = document.getElementById('closeModalBtn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                // Only allow closing if user is logged in
                if (this.user) {
                    this.hideLoginModal();
                }
            });
            
            // Hide close button if login is required
            this.updateCloseButtonVisibility();
        }

        // Close modal when clicking outside (only if user is logged in)
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.addEventListener('click', (e) => {
                // Only allow closing if user is logged in
                if (e.target === loginModal && this.user) {
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

        // Initialize welcome video listeners (if modal exists)
        this.initializeWelcomeVideoListeners();
        
        // For testing: Add a keyboard shortcut to manually show the video (Ctrl+Shift+V)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'V') {
                e.preventDefault();
                console.log('🔧 Manual trigger: Showing welcome video');
                this.showWelcomeVideo();
            }
        });
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
        
        // Initialize Pomodoro if navigating to pomodoro page
        if (page === 'pomodoro') {
            this.initializePomodoro();
        }
    }

    addTask() {
        // Check if user is logged in
        if (!this.user) {
            this.showLoginModal();
            return;
        }
        
        const taskInput = document.getElementById('taskInput');
        const difficultySelect = document.getElementById('taskDifficulty');
        const taskDateInput = document.getElementById('taskDate');
        const taskText = taskInput.value.trim();
        const difficulty = difficultySelect.value;
        const taskDate = taskDateInput ? taskDateInput.value : '';

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
            createdAt: new Date().toISOString(),
            dueDate: taskDate || null
        };

            this.tasks.unshift(task);
            taskInput.value = '';
            if (taskDateInput) taskDateInput.value = '';
            taskInput.focus();
            this.saveTasks().then(() => {
                this.renderAllPages();
                this.updateAllStats();
                // Update Pomodoro task selector if on Pomodoro page
                if (this.currentPage === 'pomodoro') {
                    this.populateTaskSelector();
                }
            });
        }

    toggleTask(id) {
        // Check if user is logged in
        if (!this.user) {
            this.showLoginModal();
            return;
        }
        
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
            
            this.saveTasks().then(() => {
                this.renderAllPages();
                this.updateAllStats();
                // Update Pomodoro task selector if on Pomodoro page
                if (this.currentPage === 'pomodoro') {
                    this.populateTaskSelector();
                }
            });
            this.updateMotivationMessages();
            this.updatePointsDisplay();
        }
    }

    deleteTask(id) {
        // Check if user is logged in
        if (!this.user) {
            this.showLoginModal();
            return;
        }
        
        const task = this.tasks.find(t => t.id === id);
        if (task && task.completed && task.pointsEarned) {
            // Remove points if task was completed
            const points = this.pointsValues[task.difficulty || 'medium'] || 10;
            this.totalPoints = Math.max(0, this.totalPoints - points);
            this.savePoints();
        }
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks().then(() => {
            this.renderAllPages();
            this.updateAllStats();
            this.updatePointsDisplay();
            // Update Pomodoro task selector if on Pomodoro page
            if (this.currentPage === 'pomodoro') {
                this.populateTaskSelector();
            }
        });
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

    formatDate(dateString) {
        if (!dateString) return null;
        const date = new Date(dateString + 'T00:00:00');
        if (isNaN(date.getTime())) return null; // Invalid date
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const taskDate = new Date(date);
        taskDate.setHours(0, 0, 0, 0);
        
        const diffTime = taskDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const month = date.toLocaleString('en-US', { month: 'short' });
        const day = date.getDate();
        const year = date.getFullYear();
        
        if (diffDays < 0) {
            return { text: `${month} ${day}, ${year}`, class: 'overdue', days: diffDays };
        } else if (diffDays === 0) {
            return { text: 'Today', class: 'today', days: 0 };
        } else if (diffDays === 1) {
            return { text: 'Tomorrow', class: 'upcoming', days: 1 };
        } else if (diffDays <= 7) {
            return { text: `${month} ${day} (in ${diffDays} days)`, class: 'upcoming', days: diffDays };
        } else {
            return { text: `${month} ${day}, ${year}`, class: 'future', days: diffDays };
        }
    }

    renderTask(task, listId) {
        const difficulty = task.difficulty || 'medium';
        const difficultyLabel = this.getDifficultyLabel(difficulty);
        const points = task.completed && task.pointsEarned ? ` (+${this.pointsValues[difficulty]} pts)` : '';
        
        // Format date if available
        let dateBadge = '';
        if (task.dueDate) {
            const dateInfo = this.formatDate(task.dueDate);
            if (dateInfo) {
                dateBadge = `<span class="task-date ${dateInfo.class}" title="${task.dueDate}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    ${dateInfo.text}
                </span>`;
            }
        }
        
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <input 
                type="checkbox" 
                class="task-checkbox" 
                ${task.completed ? 'checked' : ''}
                ${this.user ? '' : 'disabled'}
                onchange="taskManager.toggleTask(${task.id})"
            >
            <span class="task-text">
                ${this.escapeHtml(task.text)}
                <span class="task-difficulty ${difficulty}">${difficultyLabel}</span>
                ${dateBadge}
                ${points ? `<span style="color: #667eea; font-weight: 600;">${points}</span>` : ''}
            </span>
            <button class="task-delete" ${this.user ? '' : 'disabled'} onclick="taskManager.deleteTask(${task.id})" title="Delete task">
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

    async saveTasks() {
        if (!this.user || !this.user.sub) {
            // Guest mode - use localStorage
            const storageKey = 'dailyRushTasks_guest';
            localStorage.setItem(storageKey, JSON.stringify(this.tasks));
            return;
        }

        // Save to database
        if (databaseService.isInitialized) {
            await databaseService.saveTasks(this.user.sub, this.tasks);
        }
        
        // Also save to localStorage as backup
        const storageKey = `dailyRushTasks_${this.user.sub}`;
        localStorage.setItem(storageKey, JSON.stringify(this.tasks));
    }

    loadTasks() {
        if (!this.user || !this.user.sub) {
            // Guest mode - use localStorage
            const storageKey = 'dailyRushTasks_guest';
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                try {
                    this.tasks = JSON.parse(saved);
                } catch (e) {
                    this.tasks = [];
                }
            } else {
                this.tasks = [];
            }
            return;
        }

        // Load from database with real-time sync
        if (databaseService.isInitialized) {
            // Set up real-time listener
            const unsubscribe = databaseService.loadTasks(this.user.sub, (tasks) => {
                this.tasks = tasks || [];
                this.renderAllPages();
                this.updateAllStats();
            });
            
            // Store unsubscribe function for cleanup
            if (unsubscribe) {
                this.taskUnsubscribe = unsubscribe;
            }
        } else {
            // Fallback to localStorage
            const storageKey = `dailyRushTasks_${this.user.sub}`;
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
    }

    async savePoints() {
        if (!this.user || !this.user.sub) {
            // Guest mode - use localStorage
            const storageKey = 'dailyRushPoints_guest';
            localStorage.setItem(storageKey, this.totalPoints.toString());
            return;
        }

        // Save to database
        if (databaseService.isInitialized) {
            await databaseService.savePoints(this.user.sub, this.totalPoints);
        }
        
        // Also save to localStorage as backup
        const storageKey = `dailyRushPoints_${this.user.sub}`;
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
            this.saveTasks().then(() => {
                this.savePoints().then(() => {
                    this.renderAllPages();
                    this.updateAllStats();
                    this.updatePointsDisplay();
                });
            });
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
            this.saveTasks().then(() => {
                this.savePoints().then(() => {
                    this.renderAllPages();
                    this.updateAllStats();
                    this.updatePointsDisplay();
                });
            });
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

    // Pomodoro Timer Functions
    initializePomodoro() {
        this.loadPomodoroStats();
        this.updatePomodoroDisplay();
        this.populateTaskSelector();
        
        // Add event listeners
        const pomodoroStart = document.getElementById('pomodoroStart');
        const pomodoroPause = document.getElementById('pomodoroPause');
        const pomodoroReset = document.getElementById('pomodoroReset');
        const pomodoroWork = document.getElementById('pomodoroWork');
        const pomodoroShortBreak = document.getElementById('pomodoroShortBreak');
        const pomodoroLongBreak = document.getElementById('pomodoroLongBreak');
        const pomodoroTaskSelect = document.getElementById('pomodoroTaskSelect');
        
        if (pomodoroStart) {
            pomodoroStart.addEventListener('click', () => this.startPomodoro());
        }
        if (pomodoroPause) {
            pomodoroPause.addEventListener('click', () => this.pausePomodoro());
        }
        if (pomodoroReset) {
            pomodoroReset.addEventListener('click', () => this.resetPomodoro());
        }
        if (pomodoroWork) {
            pomodoroWork.addEventListener('click', () => this.setPomodoroMode('work'));
        }
        if (pomodoroShortBreak) {
            pomodoroShortBreak.addEventListener('click', () => this.setPomodoroMode('shortBreak'));
        }
        if (pomodoroLongBreak) {
            pomodoroLongBreak.addEventListener('click', () => this.setPomodoroMode('longBreak'));
        }
        if (pomodoroTaskSelect) {
            pomodoroTaskSelect.addEventListener('change', (e) => this.selectPomodoroTask(e.target.value));
        }
    }

    setPomodoroMode(mode) {
        if (this.pomodoro.isRunning) {
            if (!confirm('Timer is running. Do you want to switch mode and reset the timer?')) {
                return;
            }
            this.resetPomodoro();
        }
        
        this.pomodoro.mode = mode;
        
        // Update mode button states
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        const modeIdMap = {
            'work': 'pomodoroWork',
            'shortBreak': 'pomodoroShortBreak',
            'longBreak': 'pomodoroLongBreak'
        };
        const btnId = modeIdMap[mode];
        if (btnId) {
            const btn = document.getElementById(btnId);
            if (btn) btn.classList.add('active');
        }
        
        // Set time based on mode
        const times = {
            work: 25 * 60,
            shortBreak: 5 * 60,
            longBreak: 15 * 60
        };
        
        this.pomodoro.timeLeft = times[mode];
        this.pomodoro.totalTime = times[mode];
        
        // Update circle data attribute for color
        const circle = document.querySelector('.pomodoro-circle');
        if (circle) {
            circle.setAttribute('data-mode', mode);
        }
        
        this.updatePomodoroDisplay();
    }

    startPomodoro() {
        if (this.pomodoro.isRunning) return;
        
        if (this.pomodoro.isPaused) {
            // Resume from pause
            this.pomodoro.isPaused = false;
        } else {
            // Start new session
            this.pomodoro.isRunning = true;
        }
        
        // Update button visibility
        document.getElementById('pomodoroStart').style.display = 'none';
        document.getElementById('pomodoroPause').style.display = 'flex';
        
        // Start countdown
        this.pomodoro.timerInterval = setInterval(() => {
            this.pomodoro.timeLeft--;
            this.updatePomodoroDisplay();
            
            if (this.pomodoro.timeLeft <= 0) {
                this.completePomodoro();
            }
        }, 1000);
        
        this.updatePomodoroStatus('Focus Time!');
    }

    pausePomodoro() {
        if (!this.pomodoro.isRunning) return;
        
        clearInterval(this.pomodoro.timerInterval);
        this.pomodoro.isRunning = false;
        this.pomodoro.isPaused = true;
        
        // Update button visibility
        document.getElementById('pomodoroStart').style.display = 'flex';
        document.getElementById('pomodoroPause').style.display = 'none';
        
        this.updatePomodoroStatus('Paused');
    }

    resetPomodoro() {
        clearInterval(this.pomodoro.timerInterval);
        this.pomodoro.isRunning = false;
        this.pomodoro.isPaused = false;
        
        // Reset to initial time for current mode
        const times = {
            work: 25 * 60,
            shortBreak: 5 * 60,
            longBreak: 15 * 60
        };
        this.pomodoro.timeLeft = times[this.pomodoro.mode];
        this.pomodoro.totalTime = times[this.pomodoro.mode];
        
        // Update button visibility
        document.getElementById('pomodoroStart').style.display = 'flex';
        document.getElementById('pomodoroPause').style.display = 'none';
        
        this.updatePomodoroDisplay();
        this.updatePomodoroStatus('Ready to Focus');
    }

    completePomodoro() {
        clearInterval(this.pomodoro.timerInterval);
        this.pomodoro.isRunning = false;
        this.pomodoro.isPaused = false;
        
        // Play completion sound
        this.playPomodoroCompleteSound();
        
        // Update stats if it was a work session
        if (this.pomodoro.mode === 'work') {
            this.pomodoro.workCount++;
            this.pomodoro.completedToday++;
            const minutes = this.pomodoro.totalTime / 60;
            this.pomodoro.totalFocusTime += minutes;
            this.savePomodoroStats();
            this.updatePomodoroStats();
            
            // Award bonus points for completing a full focus session
            const bonusPoints = 10;
            this.totalPoints += bonusPoints;
            this.savePoints();
            this.updatePointsDisplay();
            
            // Show bonus points notification
            this.showBonusPointsNotification(bonusPoints);
            
            // Show notification
            this.showPomodoroNotification();
        }
        
        // Auto-advance to next mode
        if (this.pomodoro.mode === 'work') {
            // After work, take break
            if (this.pomodoro.workCount % 4 === 0) {
                this.setPomodoroMode('longBreak');
            } else {
                this.setPomodoroMode('shortBreak');
            }
        } else {
            // After break, go back to work
            this.setPomodoroMode('work');
        }
        
        // Update button visibility
        document.getElementById('pomodoroStart').style.display = 'flex';
        document.getElementById('pomodoroPause').style.display = 'none';
        
        this.updatePomodoroStatus('Session Complete!');
        
        // Show alert
        setTimeout(() => {
            alert(this.pomodoro.mode === 'work' 
                ? '🎉 Pomodoro Complete! Take a break!' 
                : 'Break Complete! Ready for another focus session?');
        }, 100);
    }

    updatePomodoroDisplay() {
        const minutes = Math.floor(this.pomodoro.timeLeft / 60);
        const seconds = this.pomodoro.timeLeft % 60;
        
        const minutesEl = document.getElementById('pomodoroMinutes');
        const secondsEl = document.getElementById('pomodoroSeconds');
        const progressCircle = document.querySelector('.pomodoro-progress');
        
        if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
        if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
        
        // Update progress circle
        if (progressCircle) {
            const circumference = 2 * Math.PI * 54; // radius = 54
            const progress = (this.pomodoro.totalTime - this.pomodoro.timeLeft) / this.pomodoro.totalTime;
            const offset = circumference - (progress * circumference);
            progressCircle.style.strokeDashoffset = offset;
        }
    }

    updatePomodoroStatus(text) {
        const statusEl = document.getElementById('pomodoroStatus');
        if (statusEl) {
            statusEl.textContent = text;
        }
    }

    selectPomodoroTask(taskId) {
        if (!taskId) {
            document.getElementById('pomodoroCurrentTask').style.display = 'none';
            return;
        }
        
        const task = this.tasks.find(t => t.id === parseInt(taskId));
        if (task) {
            document.getElementById('pomodoroTaskName').textContent = task.text;
            document.getElementById('pomodoroCurrentTask').style.display = 'block';
        }
    }

    populateTaskSelector() {
        const selector = document.getElementById('pomodoroTaskSelect');
        if (!selector) return;
        
        // Clear existing options except the first one
        selector.innerHTML = '<option value="">No task selected</option>';
        
        // Add active tasks
        const activeTasks = this.tasks.filter(t => !t.completed);
        activeTasks.forEach(task => {
            const option = document.createElement('option');
            option.value = task.id;
            option.textContent = task.text.length > 50 ? task.text.substring(0, 50) + '...' : task.text;
            selector.appendChild(option);
        });
    }

    playPomodoroCompleteSound() {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            let audioContext = this.audioContext;
            
            if (!audioContext) {
                audioContext = new AudioContextClass();
                this.audioContext = audioContext;
            }
            
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            // Play a pleasant completion chime
            const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C-E-G-C chord
            
            frequencies.forEach((freq, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = freq;
                oscillator.type = 'sine';
                
                const now = audioContext.currentTime;
                const delay = index * 0.05;
                const duration = 0.3;
                
                gainNode.gain.setValueAtTime(0, now + delay);
                gainNode.gain.linearRampToValueAtTime(0.3, now + delay + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
                
                oscillator.start(now + delay);
                oscillator.stop(now + delay + duration);
            });
        } catch (error) {
            console.log('Audio playback unavailable');
        }
    }

    showPomodoroNotification() {
        const notification = document.createElement('div');
        notification.className = 'points-notification';
        notification.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Pomodoro Complete! 🍅</span>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showBonusPointsNotification(points) {
        // Play congratulatory sound
        this.playCongratSound();
        
        const notification = document.createElement('div');
        notification.className = 'points-notification bonus';
        notification.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Focus Bonus! +${points} Points! 🎯</span>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3500);
    }

    updatePomodoroStats() {
        const completedEl = document.getElementById('pomodoroCompleted');
        const totalEl = document.getElementById('pomodoroTotal');
        
        if (completedEl) completedEl.textContent = this.pomodoro.completedToday;
        if (totalEl) totalEl.textContent = Math.floor(this.pomodoro.totalFocusTime);
    }

    loadPomodoroStats() {
        const today = new Date().toDateString();
        const storageKey = `pomodoroStats_${today}`;
        const saved = localStorage.getItem(storageKey);
        
        if (saved) {
            try {
                const stats = JSON.parse(saved);
                this.pomodoro.completedToday = stats.completedToday || 0;
                this.pomodoro.totalFocusTime = stats.totalFocusTime || 0;
            } catch (e) {
                console.error('Error loading Pomodoro stats:', e);
            }
        } else {
            // Check if it's a new day, reset if needed
            const lastDate = localStorage.getItem('pomodoroLastDate');
            if (lastDate !== today) {
                this.pomodoro.completedToday = 0;
                this.pomodoro.totalFocusTime = 0;
                localStorage.setItem('pomodoroLastDate', today);
            }
        }
        
        this.updatePomodoroStats();
    }

    savePomodoroStats() {
        const today = new Date().toDateString();
        const storageKey = `pomodoroStats_${today}`;
        const stats = {
            completedToday: this.pomodoro.completedToday,
            totalFocusTime: this.pomodoro.totalFocusTime,
            date: today
        };
        localStorage.setItem(storageKey, JSON.stringify(stats));
        localStorage.setItem('pomodoroLastDate', today);
    }

    // Welcome Video Functions
    checkAndShowWelcomeVideo() {
        // Only show if user is logged in
        if (!this.user) {
            console.log('🚫 No user logged in, skipping welcome video');
            return;
        }
        
        // Check if user has opted to not show the video again
        const dontShowVideo = localStorage.getItem('dailyRushDontShowVideo');
        if (dontShowVideo === 'true') {
            console.log('🚫 User opted to not show video again');
            return;
        }
        
        // Check if user has already seen the video
        const hasSeenVideo = localStorage.getItem('dailyRushHasSeenVideo');
        if (hasSeenVideo === 'true') {
            console.log('🚫 User has already seen the video');
            return;
        }
        
        console.log('✅ Showing welcome video for new user');
        // Show the video modal after a short delay to ensure UI is ready
        setTimeout(() => {
            this.showWelcomeVideo();
        }, 1500);
    }

    showWelcomeVideo() {
        console.log('🎬 Attempting to show welcome video...');
        const videoModal = document.getElementById('welcomeVideoModal');
        if (!videoModal) {
            console.error('❌ Welcome video modal not found in DOM');
            return;
        }
        
        console.log('✅ Modal found, loading video...');
        
        // Load video src only when modal is shown
        const videoIframe = document.getElementById('welcomeVideo');
        if (videoIframe) {
            const videoSrc = videoIframe.getAttribute('data-src');
            if (videoSrc) {
                console.log('📹 Setting video src:', videoSrc);
                videoIframe.src = videoSrc;
            } else {
                console.warn('⚠️ No data-src attribute found on video iframe');
            }
        } else {
            console.warn('⚠️ Video iframe not found');
        }
        
        videoModal.classList.remove('hidden');
        console.log('✅ Modal should now be visible');
        // Add event listeners if not already added
        this.initializeWelcomeVideoListeners();
    }

    hideWelcomeVideo() {
        const videoModal = document.getElementById('welcomeVideoModal');
        if (videoModal) {
            videoModal.classList.add('hidden');
            // Stop the YouTube video by clearing the src
            const videoIframe = document.getElementById('welcomeVideo');
            if (videoIframe) {
                // Clear src immediately to stop playback and sound
                videoIframe.src = '';
            }
        }
    }

    initializeWelcomeVideoListeners() {
        const closeBtn = document.getElementById('closeVideoModalBtn');
        const skipBtn = document.getElementById('skipVideoBtn');
        const dontShowCheckbox = document.getElementById('dontShowAgain');
        
        if (closeBtn && !closeBtn.hasAttribute('data-listener-added')) {
            closeBtn.setAttribute('data-listener-added', 'true');
            closeBtn.addEventListener('click', () => {
                const dontShow = dontShowCheckbox && dontShowCheckbox.checked;
                if (dontShow) {
                    localStorage.setItem('dailyRushDontShowVideo', 'true');
                } else {
                    localStorage.setItem('dailyRushHasSeenVideo', 'true');
                }
                this.hideWelcomeVideo();
            });
        }
        
        if (skipBtn && !skipBtn.hasAttribute('data-listener-added')) {
            skipBtn.setAttribute('data-listener-added', 'true');
            skipBtn.addEventListener('click', () => {
                const dontShow = dontShowCheckbox && dontShowCheckbox.checked;
                if (dontShow) {
                    localStorage.setItem('dailyRushDontShowVideo', 'true');
                } else {
                    localStorage.setItem('dailyRushHasSeenVideo', 'true');
                }
                this.hideWelcomeVideo();
            });
        }
        
        // Close on background click
        const videoModal = document.getElementById('welcomeVideoModal');
        if (videoModal && !videoModal.hasAttribute('data-listener-added')) {
            videoModal.setAttribute('data-listener-added', 'true');
            videoModal.addEventListener('click', (e) => {
                if (e.target === videoModal) {
                    const dontShow = dontShowCheckbox && dontShowCheckbox.checked;
                    if (dontShow) {
                        localStorage.setItem('dailyRushDontShowVideo', 'true');
                    } else {
                        localStorage.setItem('dailyRushHasSeenVideo', 'true');
                    }
                    this.hideWelcomeVideo();
                }
            });
        }
    }
}

// Initialize the task manager when the page loads
let taskManager;
document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
    // Make it available globally for onclick handlers
    window.taskManager = taskManager;
});
