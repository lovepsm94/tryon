export interface UserData {
	weight?: number;
	height?: number;
	selectedFrontImageId?: number | null;
	type?: 'model' | 'user';
	timestamp: number;
}

export type Language = 'en' | 'ja';

class LocalStorageManager {
	private readonly USER_DATA_KEY = 'tryon_user_data';
	private readonly LANGUAGE_KEY = 'tryon_language';

	/**
	 * Save user data to localStorage
	 */
	saveUserData(userData: Omit<UserData, 'timestamp'>): void {
		const data: UserData = {
			...userData,
			timestamp: Date.now()
		};

		try {
			localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(data));
		} catch (error) {
			console.error('Error saving user data to localStorage:', error);
			throw new Error('Failed to save user data to localStorage');
		}
	}

	/**
	 * Get user data from localStorage
	 */
	getUserData(): UserData | null {
		try {
			const data = localStorage.getItem(this.USER_DATA_KEY);
			if (!data) {
				return null;
			}

			return JSON.parse(data) as UserData;
		} catch (error) {
			console.error('Error getting user data from localStorage:', error);
			return null;
		}
	}

	/**
	 * Update user data in localStorage
	 */
	updateUserData(updates: Partial<UserData>): void {
		try {
			const existingData = this.getUserData();
			if (!existingData) {
				// If no existing data, create new data
				this.saveUserData(updates);
				return;
			}

			const updatedData: UserData = {
				...existingData,
				...updates,
				timestamp: Date.now()
			};

			localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(updatedData));
		} catch (error) {
			console.error('Error updating user data in localStorage:', error);
			throw new Error('Failed to update user data in localStorage');
		}
	}

	/**
	 * Clear user data from localStorage
	 */
	clearUserData(): void {
		try {
			localStorage.removeItem(this.USER_DATA_KEY);
		} catch (error) {
			console.error('Error clearing user data from localStorage:', error);
			throw new Error('Failed to clear user data from localStorage');
		}
	}

	/**
	 * Check if user data exists
	 */
	hasUserData(): boolean {
		return this.getUserData() !== null;
	}

	/**
	 * Save language to localStorage
	 */
	saveLanguage(language: Language): void {
		try {
			localStorage.setItem(this.LANGUAGE_KEY, language);
		} catch (error) {
			console.error('Error saving language to localStorage:', error);
			throw new Error('Failed to save language to localStorage');
		}
	}

	/**
	 * Get language from localStorage
	 */
	getLanguage(): Language | null {
		try {
			const language = localStorage.getItem(this.LANGUAGE_KEY);
			if (!language) {
				return null;
			}

			return language as Language;
		} catch (error) {
			console.error('Error getting language from localStorage:', error);
			return null;
		}
	}

	/**
	 * Clear language from localStorage
	 */
	clearLanguage(): void {
		try {
			localStorage.removeItem(this.LANGUAGE_KEY);
		} catch (error) {
			console.error('Error clearing language from localStorage:', error);
			throw new Error('Failed to clear language from localStorage');
		}
	}
}

export const localStorageManager = new LocalStorageManager();
