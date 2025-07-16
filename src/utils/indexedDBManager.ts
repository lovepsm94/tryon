export interface UserImageData {
	id?: number;
	imageBlob: Blob;
	timestamp: number;
	type: 'front' | 'side';
}

export interface UserImageDataWithUrl extends Omit<UserImageData, 'imageBlob'> {
	imageUrl: string;
}

export interface UserData {
	id?: number;
	weight?: number;
	height?: number;
	frontViewImageId?: number;
	sideViewImageId?: number;
	timestamp: number;
}

export interface MaskPointsData {
	id?: number;
	imageId: number; // Reference to the user image
	upper: number[][];
	lower: number[][];
	full: number[][];
	timestamp: number;
}

class IndexedDBManager {
	private dbName = 'TryOnAppDB';
	private version = 1;
	private db: IDBDatabase | null = null;

	// Store names
	private readonly STORES = {
		USER_IMAGES: 'userImages',
		MASK_POINTS: 'maskPoints'
	} as const;

	/**
	 * Initialize the database
	 */
	async init(): Promise<void> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.dbName, this.version);

			request.onerror = () => {
				console.error('Failed to open IndexedDB:', request.error);
				reject(new Error('Failed to open IndexedDB'));
			};

			request.onsuccess = () => {
				this.db = request.result;
				console.log('IndexedDB initialized successfully');
				resolve();
			};

			request.onupgradeneeded = (event) => {
				console.log('IndexedDB upgrade needed, version:', this.version);
				const db = (event.target as IDBOpenDBRequest).result;

				// Create userImages store
				if (!db.objectStoreNames.contains(this.STORES.USER_IMAGES)) {
					console.log('Creating userImages store');
					const imageStore = db.createObjectStore(this.STORES.USER_IMAGES, {
						keyPath: 'id',
						autoIncrement: true
					});
					imageStore.createIndex('type', 'type', { unique: false });
					imageStore.createIndex('timestamp', 'timestamp', { unique: false });
				}

				// Create maskPoints store
				if (!db.objectStoreNames.contains(this.STORES.MASK_POINTS)) {
					console.log('Creating maskPoints store');
					const maskStore = db.createObjectStore(this.STORES.MASK_POINTS, {
						keyPath: 'id',
						autoIncrement: true
					});
					maskStore.createIndex('timestamp', 'timestamp', { unique: false });
					maskStore.createIndex('imageId', 'imageId', { unique: false });
				}
			};
		});
	}

	/**
	 * Ensure database is initialized
	 */
	private async ensureDB(): Promise<void> {
		if (!this.db) {
			await this.init();
		}
	}

	/**
	 * Check if database is properly initialized with all required stores
	 */
	async checkDatabaseHealth(): Promise<boolean> {
		try {
			await this.ensureDB();

			if (!this.db) {
				return false;
			}

			// Check if all required stores exist
			const hasUserImages = this.db.objectStoreNames.contains(this.STORES.USER_IMAGES);
			const hasMaskPoints = this.db.objectStoreNames.contains(this.STORES.MASK_POINTS);

			console.log('Database health check:', {
				hasUserImages,
				hasMaskPoints,
				storeNames: Array.from(this.db.objectStoreNames)
			});

			return hasUserImages && hasMaskPoints;
		} catch (error) {
			console.error('Database health check failed:', error);
			return false;
		}
	}

	/**
	 * Convert blob to object URL
	 */
	private blobToObjectUrl(blob: Blob): string {
		return URL.createObjectURL(blob);
	}

	/**
	 * Save user image to IndexedDB
	 */
	async saveUserImage(imageBlob: Blob, type: 'front' | 'side'): Promise<number> {
		await this.ensureDB();

		return new Promise((resolve, reject) => {
			if (!this.db) {
				reject(new Error('Database not initialized'));
				return;
			}

			const transaction = this.db.transaction([this.STORES.USER_IMAGES], 'readwrite');
			const store = transaction.objectStore(this.STORES.USER_IMAGES);

			const data: UserImageData = {
				imageBlob,
				type,
				timestamp: Date.now()
			};

			const request = store.add(data);

			request.onsuccess = () => {
				resolve(request.result as number);
			};

			request.onerror = (e) => {
				console.error('Failed to save image to IndexedDB:', e);
				reject(new Error('Failed to save image to IndexedDB'));
			};
		});
	}

	/**
	 * Save mask points to IndexedDB
	 */
	async saveMaskPoints(imageId: number, upper: number[][], lower: number[][], full: number[][]): Promise<number> {
		await this.ensureDB();

		return new Promise((resolve, reject) => {
			if (!this.db) {
				reject(new Error('Database not initialized'));
				return;
			}

			const transaction = this.db.transaction([this.STORES.MASK_POINTS], 'readwrite');
			const store = transaction.objectStore(this.STORES.MASK_POINTS);

			const data: MaskPointsData = {
				imageId,
				upper,
				lower,
				full,
				timestamp: Date.now()
			};

			const request = store.add(data);

			request.onsuccess = () => {
				resolve(request.result as number);
			};

			request.onerror = (e) => {
				console.error('Failed to save mask points to IndexedDB:', e);
				reject(new Error('Failed to save mask points to IndexedDB'));
			};
		});
	}

	/**
	 * Get latest mask points from IndexedDB
	 */
	async getLatestMaskPoints(): Promise<MaskPointsData | null> {
		await this.ensureDB();

		return new Promise((resolve, reject) => {
			if (!this.db) {
				reject(new Error('Database not initialized'));
				return;
			}

			const transaction = this.db.transaction([this.STORES.MASK_POINTS], 'readonly');
			const store = transaction.objectStore(this.STORES.MASK_POINTS);
			const index = store.index('timestamp');

			const request = index.getAll();

			request.onsuccess = () => {
				const maskPoints = request.result as MaskPointsData[];
				if (maskPoints.length === 0) {
					resolve(null);
					return;
				}

				// Get the most recent mask points
				const latestMaskPoints = maskPoints.reduce((latest, current) =>
					current.timestamp > latest.timestamp ? current : latest
				);

				resolve(latestMaskPoints);
			};

			request.onerror = () => {
				reject(new Error('Failed to get latest mask points from IndexedDB'));
			};
		});
	}

	/**
	 * Get mask points by image ID
	 */
	async getMaskPointsByImageId(imageId: number): Promise<MaskPointsData | null> {
		await this.ensureDB();

		return new Promise((resolve, reject) => {
			if (!this.db) {
				reject(new Error('Database not initialized'));
				return;
			}

			const transaction = this.db.transaction([this.STORES.MASK_POINTS], 'readonly');
			const store = transaction.objectStore(this.STORES.MASK_POINTS);
			const index = store.index('imageId');

			const request = index.getAll(imageId);

			request.onsuccess = () => {
				const maskPoints = request.result as MaskPointsData[];
				if (maskPoints.length === 0) {
					resolve(null);
					return;
				}

				// Return the most recent mask points for this image ID
				const latestMaskPoints = maskPoints.reduce((latest, current) =>
					current.timestamp > latest.timestamp ? current : latest
				);

				resolve(latestMaskPoints);
			};

			request.onerror = () => {
				reject(new Error('Failed to get mask points from IndexedDB'));
			};
		});
	}

	/**
	 * Get user image by ID with object URL
	 */
	async getUserImage(id: number): Promise<UserImageDataWithUrl | null> {
		await this.ensureDB();

		return new Promise((resolve, reject) => {
			if (!this.db) {
				reject(new Error('Database not initialized'));
				return;
			}

			const transaction = this.db.transaction([this.STORES.USER_IMAGES], 'readonly');
			const store = transaction.objectStore(this.STORES.USER_IMAGES);

			const request = store.get(id);

			request.onsuccess = () => {
				const result = request.result as UserImageData | null;
				if (!result) {
					resolve(null);
					return;
				}

				// Convert blob to object URL
				const imageUrl = this.blobToObjectUrl(result.imageBlob);

				const dataWithUrl: UserImageDataWithUrl = {
					id: result.id,
					imageUrl,
					timestamp: result.timestamp,
					type: result.type
				};

				resolve(dataWithUrl);
			};

			request.onerror = () => {
				reject(new Error('Failed to get image from IndexedDB'));
			};
		});
	}

	/**
	 * Get latest user image by type with original blob data
	 */
	async getLatestUserImageBlob(type: 'front' | 'side'): Promise<UserImageData | null> {
		await this.ensureDB();

		return new Promise((resolve, reject) => {
			if (!this.db) {
				reject(new Error('Database not initialized'));
				return;
			}

			const transaction = this.db.transaction([this.STORES.USER_IMAGES], 'readonly');
			const store = transaction.objectStore(this.STORES.USER_IMAGES);
			const index = store.index('type');

			const request = index.getAll(type);

			request.onsuccess = () => {
				const images = request.result as UserImageData[];
				if (images.length === 0) {
					resolve(null);
					return;
				}

				// Get the most recent image
				const latestImage = images.reduce((latest, current) =>
					current.timestamp > latest.timestamp ? current : latest
				);

				resolve(latestImage);
			};

			request.onerror = () => {
				reject(new Error('Failed to get latest image from IndexedDB'));
			};
		});
	}

	/**
	 * Get latest user image by type with object URL
	 */
	async getLatestUserImage(type: 'front' | 'side'): Promise<UserImageDataWithUrl | null> {
		await this.ensureDB();

		return new Promise((resolve, reject) => {
			if (!this.db) {
				reject(new Error('Database not initialized'));
				return;
			}

			const transaction = this.db.transaction([this.STORES.USER_IMAGES], 'readonly');
			const store = transaction.objectStore(this.STORES.USER_IMAGES);
			const index = store.index('type');

			const request = index.getAll(type);

			request.onsuccess = () => {
				const images = request.result as UserImageData[];
				if (images.length === 0) {
					resolve(null);
					return;
				}

				// Get the most recent image
				const latestImage = images.reduce((latest, current) =>
					current.timestamp > latest.timestamp ? current : latest
				);

				// Convert blob to object URL
				const imageUrl = this.blobToObjectUrl(latestImage.imageBlob);

				const dataWithUrl: UserImageDataWithUrl = {
					id: latestImage.id,
					imageUrl,
					timestamp: latestImage.timestamp,
					type: latestImage.type
				};

				resolve(dataWithUrl);
			};

			request.onerror = () => {
				reject(new Error('Failed to get latest image from IndexedDB'));
			};
		});
	}

	/**
	 * Get all user images with object URLs
	 */
	async getAllUserImages(): Promise<UserImageDataWithUrl[]> {
		await this.ensureDB();

		return new Promise((resolve, reject) => {
			if (!this.db) {
				reject(new Error('Database not initialized'));
				return;
			}

			const transaction = this.db.transaction([this.STORES.USER_IMAGES], 'readonly');
			const store = transaction.objectStore(this.STORES.USER_IMAGES);

			const request = store.getAll();

			request.onsuccess = () => {
				const images = request.result as UserImageData[];

				// Convert all blobs to object URLs
				const imagesWithUrls: UserImageDataWithUrl[] = images.map((image) => ({
					id: image.id,
					imageUrl: this.blobToObjectUrl(image.imageBlob),
					timestamp: image.timestamp,
					type: image.type
				}));

				resolve(imagesWithUrls);
			};

			request.onerror = () => {
				reject(new Error('Failed to get all images from IndexedDB'));
			};
		});
	}

	/**
	 * Delete user image by ID
	 */
	async deleteUserImage(id: number): Promise<void> {
		await this.ensureDB();

		return new Promise((resolve, reject) => {
			if (!this.db) {
				reject(new Error('Database not initialized'));
				return;
			}

			const transaction = this.db.transaction([this.STORES.USER_IMAGES], 'readwrite');
			const store = transaction.objectStore(this.STORES.USER_IMAGES);

			const request = store.delete(id);

			request.onsuccess = () => {
				resolve();
			};

			request.onerror = () => {
				reject(new Error('Failed to delete image from IndexedDB'));
			};
		});
	}

	/**
	 * Clear all user images
	 */
	async clearAllUserImages(): Promise<void> {
		await this.ensureDB();

		return new Promise((resolve, reject) => {
			if (!this.db) {
				reject(new Error('Database not initialized'));
				return;
			}

			const transaction = this.db.transaction([this.STORES.USER_IMAGES], 'readwrite');
			const store = transaction.objectStore(this.STORES.USER_IMAGES);

			const request = store.clear();

			request.onsuccess = () => {
				resolve();
			};

			request.onerror = () => {
				reject(new Error('Failed to clear all images from IndexedDB'));
			};
		});
	}

	/**
	 * Clear all data (images and mask points)
	 */
	async clearAllData(): Promise<void> {
		await this.ensureDB();

		return new Promise((resolve, reject) => {
			if (!this.db) {
				reject(new Error('Database not initialized'));
				return;
			}

			// Check which stores actually exist
			const availableStores = Array.from(this.db.objectStoreNames);
			console.log('Available stores for clearing:', availableStores);

			const storesToClear = [];

			// Only include stores that actually exist
			if (availableStores.includes(this.STORES.USER_IMAGES)) {
				storesToClear.push(this.STORES.USER_IMAGES);
			}

			if (availableStores.includes(this.STORES.MASK_POINTS)) {
				storesToClear.push(this.STORES.MASK_POINTS);
			}

			if (storesToClear.length === 0) {
				console.log('No stores to clear');
				resolve();
				return;
			}

			const transaction = this.db.transaction(storesToClear, 'readwrite');
			const requests: IDBRequest[] = [];

			// Clear each available store
			storesToClear.forEach((storeName) => {
				const store = transaction.objectStore(storeName);
				const request = store.clear();
				requests.push(request);
			});

			let completed = 0;
			const totalRequests = requests.length;

			const checkComplete = () => {
				console.log('checkComplete', completed);
				completed++;
				if (completed === totalRequests) {
					console.log('All stores cleared successfully');
					resolve();
				}
			};

			requests.forEach((request) => {
				request.onsuccess = checkComplete;
				request.onerror = (e: Event) => {
					console.error('Failed to clear store:', e);
					reject(new Error('Failed to clear data from IndexedDB'));
				};
			});
		});
	}

	/**
	 * Get database size information
	 */
	async getDatabaseInfo(): Promise<{
		imageCount: number;
		totalSize: number;
	}> {
		await this.ensureDB();

		const images = await this.getAllUserImages();

		// Calculate approximate size
		const totalSize = images.length * 100000; // Rough estimate for image size

		return {
			imageCount: images.length,
			totalSize
		};
	}

	/**
	 * Debug method to check database status
	 */
	async debugDatabaseStatus(): Promise<void> {
		await this.ensureDB();

		if (!this.db) {
			console.log('Database not initialized');
			return;
		}

		const storeNames = Array.from(this.db.objectStoreNames);
		console.log('Available stores:', storeNames);

		// Check user images
		if (storeNames.includes(this.STORES.USER_IMAGES)) {
			const transaction = this.db.transaction([this.STORES.USER_IMAGES], 'readonly');
			const store = transaction.objectStore(this.STORES.USER_IMAGES);
			const countRequest = store.count();

			countRequest.onsuccess = () => {
				console.log('User images count:', countRequest.result);
			};
		}

		// Check mask points
		if (storeNames.includes(this.STORES.MASK_POINTS)) {
			const transaction = this.db.transaction([this.STORES.MASK_POINTS], 'readonly');
			const store = transaction.objectStore(this.STORES.MASK_POINTS);
			const countRequest = store.count();

			countRequest.onsuccess = () => {
				console.log('Mask points count:', countRequest.result);
			};
		}
	}

	/**
	 * Revoke object URL to free memory
	 */
	revokeObjectUrl(imageUrl: string): void {
		URL.revokeObjectURL(imageUrl);
	}

	/**
	 * Force recreate the database (useful for fixing corrupted databases)
	 */
	async forceRecreateDatabase(): Promise<void> {
		// Close existing connection
		if (this.db) {
			this.db.close();
			this.db = null;
		}

		// Delete the existing database
		return new Promise((resolve, reject) => {
			const deleteRequest = indexedDB.deleteDatabase(this.dbName);

			deleteRequest.onsuccess = () => {
				console.log('Old database deleted successfully');
				// Reinitialize the database
				this.init()
					.then(() => {
						console.log('Database recreated successfully');
						resolve();
					})
					.catch(reject);
			};

			deleteRequest.onerror = () => {
				console.error('Failed to delete old database:', deleteRequest.error);
				reject(new Error('Failed to delete old database'));
			};
		});
	}
}

// Create a singleton instance
export const indexedDBManager = new IndexedDBManager();

// Initialize the database when the module is loaded
indexedDBManager
	.init()
	.then(() => {
		// Check database health after initialization
		indexedDBManager.checkDatabaseHealth().then((isHealthy) => {
			if (!isHealthy) {
				console.warn('Database health check failed, attempting to recreate...');
				indexedDBManager.forceRecreateDatabase().catch((recreateError) => {
					console.error('Failed to recreate IndexedDB:', recreateError);
				});
			}
		});
	})
	.catch((error) => {
		console.error('Failed to initialize IndexedDB:', error);
		// If initialization fails, try to recreate the database
		indexedDBManager.forceRecreateDatabase().catch((recreateError) => {
			console.error('Failed to recreate IndexedDB:', recreateError);
		});
	});
