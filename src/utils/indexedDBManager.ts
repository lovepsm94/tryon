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

class IndexedDBManager {
	private dbName = 'TryOnAppDB';
	private version = 1;
	private db: IDBDatabase | null = null;

	// Store names
	private readonly STORES = {
		USER_IMAGES: 'userImages'
	} as const;

	/**
	 * Initialize the database
	 */
	async init(): Promise<void> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.dbName, this.version);

			request.onerror = () => {
				reject(new Error('Failed to open IndexedDB'));
			};

			request.onsuccess = () => {
				this.db = request.result;
				resolve();
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

				// Create userImages store
				if (!db.objectStoreNames.contains(this.STORES.USER_IMAGES)) {
					const imageStore = db.createObjectStore(this.STORES.USER_IMAGES, {
						keyPath: 'id',
						autoIncrement: true
					});
					imageStore.createIndex('type', 'type', { unique: false });
					imageStore.createIndex('timestamp', 'timestamp', { unique: false });
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
				alert(JSON.stringify([e]));
				reject(new Error('Failed to save image to IndexedDB'));
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
	 * Clear all data (images and user data)
	 */
	async clearAllData(): Promise<void> {
		await this.ensureDB();

		return new Promise((resolve, reject) => {
			if (!this.db) {
				reject(new Error('Database not initialized'));
				return;
			}

			const transaction = this.db.transaction([this.STORES.USER_IMAGES], 'readwrite');

			const imageStore = transaction.objectStore(this.STORES.USER_IMAGES);

			const imageRequest = imageStore.clear();

			let completed = 0;
			const totalRequests = 1;

			const checkComplete = () => {
				completed++;
				if (completed === totalRequests) {
					resolve();
				}
			};

			imageRequest.onsuccess = checkComplete;

			imageRequest.onerror = () => {
				reject(new Error('Failed to clear images from IndexedDB'));
			};
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
	 * Revoke object URL to free memory
	 */
	revokeObjectUrl(imageUrl: string): void {
		URL.revokeObjectURL(imageUrl);
	}
}

// Create a singleton instance
export const indexedDBManager = new IndexedDBManager();

// Initialize the database when the module is loaded
indexedDBManager.init().catch(console.error);
