import AsyncStorage from '@react-native-async-storage/async-storage';

const USERS_KEY = 'users';
const CURRENT_USER_KEY = 'currentUser';

class UserService {
  // Get all users from storage
  async getAllUsers() {
    try {
      const usersJson = await AsyncStorage.getItem(USERS_KEY);
      return usersJson ? JSON.parse(usersJson) : [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  // Save all users to storage
  async saveUsers(users) {
    try {
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Error saving users:', error);
      throw error;
    }
  }

  // Check if email already exists
  async isEmailExists(email) {
    const users = await this.getAllUsers();
    return users.some(user => user.email.toLowerCase() === email.toLowerCase());
  }

  // Check if name combination already exists
  async isNameExists(firstName, lastName) {
    const users = await this.getAllUsers();
    return users.some(user => 
      user.firstName.toLowerCase() === firstName.toLowerCase() && 
      user.lastName.toLowerCase() === lastName.toLowerCase()
    );
  }

  // Register a new user
  async registerUser(userData) {
    const { firstName, lastName, email, phoneNumber, password } = userData;

    // Validate required fields
    if (!firstName || !lastName || !email || !phoneNumber || !password) {
      throw new Error('All fields are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address');
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(phoneNumber)) {
      throw new Error('Please enter a valid phone number');
    }

    // Validate password
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Check for duplicate email
    const emailExists = await this.isEmailExists(email);
    if (emailExists) {
      throw new Error('An account with this email already exists');
    }

    // Check for duplicate name combination
    const nameExists = await this.isNameExists(firstName, lastName);
    if (nameExists) {
      throw new Error('A user with this name already exists');
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phoneNumber: phoneNumber.trim(),
      password: password, // In a real app, this should be hashed
      createdAt: new Date().toISOString(),
    };

    // Save user to storage
    const users = await this.getAllUsers();
    users.push(newUser);
    await this.saveUsers(users);

    // Set as current user
    await this.setCurrentUser(newUser);

    return newUser;
  }

  // Sign in user
  async signInUser(email, password) {
    const users = await this.getAllUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      throw new Error('No account found with this email');
    }

    if (user.password !== password) {
      throw new Error('Invalid password');
    }

    // Set as current user
    await this.setCurrentUser(user);
    return user;
  }

  // Set current user
  async setCurrentUser(user) {
    try {
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error setting current user:', error);
      throw error;
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const userJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Sign out user
  async signOut() {
    try {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // Check if user is signed in
  async isSignedIn() {
    const currentUser = await this.getCurrentUser();
    return currentUser !== null;
  }

  // Update user profile
  async updateUserProfile(userId, updates) {
    const users = await this.getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    // Check for email conflicts if email is being updated
    if (updates.email && updates.email !== users[userIndex].email) {
      const emailExists = await this.isEmailExists(updates.email);
      if (emailExists) {
        throw new Error('An account with this email already exists');
      }
    }

    // Check for name conflicts if name is being updated
    if ((updates.firstName || updates.lastName)) {
      const firstName = updates.firstName || users[userIndex].firstName;
      const lastName = updates.lastName || users[userIndex].lastName;
      
      const nameExists = await this.isNameExists(firstName, lastName);
      if (nameExists && (firstName !== users[userIndex].firstName || lastName !== users[userIndex].lastName)) {
        throw new Error('A user with this name already exists');
      }
    }

    // Update user
    users[userIndex] = { ...users[userIndex], ...updates };
    await this.saveUsers(users);

    // Update current user if it's the same user
    const currentUser = await this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      await this.setCurrentUser(users[userIndex]);
    }

    return users[userIndex];
  }

  // Export all user data (for demonstration)
  async exportUserData() {
    try {
      const users = await this.getAllUsers();
      const currentUser = await this.getCurrentUser();
      
      return {
        allUsers: users,
        currentUser: currentUser,
        totalUsers: users.length,
        exportDate: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  }

  // Clear all user data (for testing)
  async clearAllData() {
    try {
      await AsyncStorage.removeItem(USERS_KEY);
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  // Find user by ID or phone number
  async findUserByIdOrPhone(idOrPhone) {
    const users = await this.getAllUsers();
    return users.find(u => u.id === idOrPhone || u.phoneNumber === idOrPhone);
  }

  // Set subscription plan and device ID
  async setSubscription(userId, plan, deviceId) {
    return this.updateUserProfile(userId, {
      subscription: {
        plan, // 'free', 'weekly', 'monthly', 'yearly'
        startDate: new Date().toISOString(),
        deviceId,
        usage: 0, // minutes used in current period
        lastReset: new Date().toISOString(),
      },
    });
  }

  // Get subscription info
  async getSubscription(userId) {
    const user = (await this.getAllUsers()).find(u => u.id === userId);
    return user?.subscription || { plan: 'free', usage: 0 };
  }

  // Check if device matches subscription
  async checkDevice(userId, deviceId) {
    const sub = await this.getSubscription(userId);
    return sub.deviceId === deviceId;
  }

  // Update usage (minutes)
  async updateUsage(userId, minutes) {
    const user = (await this.getAllUsers()).find(u => u.id === userId);
    if (!user) return;
    const sub = user.subscription || { usage: 0, lastReset: new Date().toISOString() };
    // Reset if a week has passed
    const now = new Date();
    const lastReset = new Date(sub.lastReset);
    const diffDays = (now - lastReset) / (1000 * 60 * 60 * 24);
    if (diffDays >= 7) {
      sub.usage = 0;
      sub.lastReset = now.toISOString();
    }
    sub.usage = (sub.usage || 0) + minutes;
    await this.updateUserProfile(userId, { subscription: sub });
  }

  // Get usage for current week
  async getUsage(userId) {
    const sub = await this.getSubscription(userId);
    // Reset if a week has passed
    const now = new Date();
    const lastReset = new Date(sub.lastReset);
    const diffDays = (now - lastReset) / (1000 * 60 * 60 * 24);
    if (diffDays >= 7) {
      await this.resetWeeklyUsage(userId);
      return 0;
    }
    return sub.usage || 0;
  }

  // Reset weekly usage
  async resetWeeklyUsage(userId) {
    const user = (await this.getAllUsers()).find(u => u.id === userId);
    if (!user) return;
    const sub = user.subscription || {};
    sub.usage = 0;
    sub.lastReset = new Date().toISOString();
    await this.updateUserProfile(userId, { subscription: sub });
  }
}

export default new UserService(); 