// Database Service - Firebase Firestore Integration

class DatabaseService {
    constructor() {
        this.db = null;
        this.isInitialized = false;
        this.migrationComplete = {};
    }

    async initialize() {
        try {
            // Check if Firebase is loaded
            if (typeof firebase === 'undefined') {
                console.error('❌ Firebase SDK not loaded. Make sure firebase scripts are included in index.html');
                return false;
            }

            // Validate Firebase config
            if (!firebaseConfig || !firebaseConfig.apiKey) {
                console.error('❌ Firebase configuration is missing or invalid!');
                console.error('Please update firebase-config.js with your Firebase project credentials.');
                return false;
            }

            // Initialize Firebase if not already initialized
            if (!firebase.apps.length) {
                try {
                    firebase.initializeApp(firebaseConfig);
                    console.log('✅ Firebase initialized successfully');
                } catch (initError) {
                    console.error('❌ Firebase initialization error:', initError);
                    if (initError.code === 'auth/api-key-not-valid') {
                        console.error('⚠️ Invalid API Key. Please check your Firebase configuration.');
                        console.error('Steps to fix:');
                        console.error('1. Go to https://console.firebase.google.com/');
                        console.error('2. Select your project');
                        console.error('3. Go to Project Settings > General');
                        console.error('4. Copy the config from "Your apps" section');
                        console.error('5. Update firebase-config.js with the correct values');
                    }
                    return false;
                }
            }

            this.db = firebase.firestore();
            this.isInitialized = true;
            console.log('✅ Database initialized');
            return true;
        } catch (error) {
            console.error('❌ Error initializing database:', error);
            if (error.code) {
                console.error('Error code:', error.code);
            }
            return false;
        }
    }

    // Get user document reference
    getUserRef(userId) {
        if (!this.isInitialized || !this.db) return null;
        return this.db.collection('users').doc(userId);
    }

    // Get tasks subcollection reference
    getTasksRef(userId) {
        if (!this.isInitialized || !this.db) return null;
        return this.db.collection('users').doc(userId).collection('tasks');
    }

    // Save user data
    async saveUser(userId, userData) {
        if (!this.isInitialized) {
            console.warn('Database not initialized, using localStorage fallback');
            return this.saveUserLocalStorage(userId, userData);
        }

        try {
            const userRef = this.getUserRef(userId);
            if (!userRef) return false;

            await userRef.set({
                ...userData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            return true;
        } catch (error) {
            console.error('Error saving user:', error);
            return false;
        }
    }

    // Load user data
    async loadUser(userId) {
        if (!this.isInitialized) {
            return this.loadUserLocalStorage(userId);
        }

        try {
            const userRef = this.getUserRef(userId);
            if (!userRef) return null;

            const doc = await userRef.get();
            if (doc.exists) {
                return doc.data();
            }
            return null;
        } catch (error) {
            console.error('Error loading user:', error);
            return null;
        }
    }

    // Save tasks
    async saveTasks(userId, tasks) {
        if (!this.isInitialized) {
            return this.saveTasksLocalStorage(userId, tasks);
        }

        try {
            const tasksRef = this.getTasksRef(userId);
            if (!tasksRef) return false;

            // Batch write for better performance
            const batch = this.db.batch();
            
            // Get existing tasks to compare
            const snapshot = await tasksRef.get();
            const existingTaskIds = new Set(snapshot.docs.map(doc => doc.id));

            // Add or update tasks
            tasks.forEach(task => {
                const taskRef = tasksRef.doc(task.id.toString());
                batch.set(taskRef, {
                    text: task.text,
                    difficulty: task.difficulty,
                    completed: task.completed,
                    pointsEarned: task.pointsEarned,
                    createdAt: task.createdAt ? new Date(task.createdAt) : firebase.firestore.FieldValue.serverTimestamp(),
                    completedAt: task.completedAt ? new Date(task.completedAt) : null,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                existingTaskIds.delete(task.id.toString());
            });

            // Delete removed tasks
            existingTaskIds.forEach(taskId => {
                batch.delete(tasksRef.doc(taskId));
            });

            await batch.commit();
            return true;
        } catch (error) {
            console.error('Error saving tasks:', error);
            return false;
        }
    }

    // Load tasks with real-time listener
    async loadTasks(userId, callback) {
        if (!this.isInitialized) {
            const tasks = this.loadTasksLocalStorage(userId);
            if (callback) callback(tasks);
            return tasks;
        }

        try {
            const tasksRef = this.getTasksRef(userId);
            if (!tasksRef) return [];

            if (callback) {
                // Set up real-time listener
                return tasksRef.orderBy('createdAt', 'desc')
                    .onSnapshot((snapshot) => {
                        const tasks = snapshot.docs.map(doc => ({
                            id: parseInt(doc.id),
                            ...doc.data(),
                            createdAt: doc.data().createdAt?.toDate().toISOString(),
                            completedAt: doc.data().completedAt?.toDate()?.toISOString()
                        }));
                        callback(tasks);
                    });
            } else {
                // One-time load
                const snapshot = await tasksRef.orderBy('createdAt', 'desc').get();
                return snapshot.docs.map(doc => ({
                    id: parseInt(doc.id),
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate().toISOString(),
                    completedAt: doc.data().completedAt?.toDate()?.toISOString()
                }));
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            return [];
        }
    }

    // Save points
    async savePoints(userId, points) {
        if (!this.isInitialized) {
            return this.savePointsLocalStorage(userId, points);
        }

        try {
            const userRef = this.getUserRef(userId);
            if (!userRef) return false;

            await userRef.update({
                totalPoints: points,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Error saving points:', error);
            return false;
        }
    }

    // Migrate from localStorage to Firebase
    async migrateFromLocalStorage(userId) {
        if (this.migrationComplete[userId]) {
            return; // Already migrated
        }

        try {
            // Check if user already exists in Firebase
            const userRef = this.getUserRef(userId);
            const userDoc = await userRef.get();
            
            if (userDoc.exists) {
                this.migrationComplete[userId] = true;
                return; // Already in Firebase
            }

            // Migrate tasks
            const localTasksKey = `dailyRushTasks_${userId}`;
            const localTasks = localStorage.getItem(localTasksKey);
            if (localTasks) {
                try {
                    const tasks = JSON.parse(localTasks);
                    if (tasks.length > 0) {
                        await this.saveTasks(userId, tasks);
                        console.log(`Migrated ${tasks.length} tasks to Firebase`);
                    }
                } catch (e) {
                    console.error('Error parsing local tasks:', e);
                }
            }

            // Migrate points
            const localPointsKey = `dailyRushPoints_${userId}`;
            const localPoints = localStorage.getItem(localPointsKey);
            if (localPoints) {
                await this.savePoints(userId, parseInt(localPoints) || 0);
            }

            this.migrationComplete[userId] = true;
            console.log('Migration complete');
        } catch (error) {
            console.error('Error migrating data:', error);
        }
    }

    // localStorage fallback methods
    saveUserLocalStorage(userId, userData) {
        localStorage.setItem('dailyRushUser', JSON.stringify(userData));
        return true;
    }

    loadUserLocalStorage(userId) {
        const saved = localStorage.getItem('dailyRushUser');
        return saved ? JSON.parse(saved) : null;
    }

    saveTasksLocalStorage(userId, tasks) {
        const storageKey = `dailyRushTasks_${userId}`;
        localStorage.setItem(storageKey, JSON.stringify(tasks));
        return true;
    }

    loadTasksLocalStorage(userId) {
        const storageKey = `dailyRushTasks_${userId}`;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return [];
            }
        }
        return [];
    }

    savePointsLocalStorage(userId, points) {
        const storageKey = `dailyRushPoints_${userId}`;
        localStorage.setItem(storageKey, points.toString());
        return true;
    }
}

// Create singleton instance
const databaseService = new DatabaseService();
