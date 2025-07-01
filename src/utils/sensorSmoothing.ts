// Sensor smoothing utilities for reducing jitter in device motion data

export interface SmoothingConfig {
	alpha: number; // Low-pass filter factor (0.1 = very smooth, 0.9 = very responsive)
	deadZone: number; // Ignore small movements below this threshold
	minUpdateInterval: number; // Minimum time between updates in ms
	velocityDamping: number; // Damping factor for velocity-based smoothing
	maxVelocity: number; // Maximum velocity to prevent extreme movements
	useKalmanFilter: boolean; // Whether to use Kalman filter for advanced smoothing
}

export const DEFAULT_SMOOTHING_CONFIG: SmoothingConfig = {
	alpha: 0.15,
	deadZone: 0.1,
	minUpdateInterval: 16, // ~60fps
	velocityDamping: 0.8,
	maxVelocity: 2.0,
	useKalmanFilter: false
};

export class SensorSmoother {
	private smoothedX = 0;
	private smoothedY = 0;
	private velocityX = 0;
	private velocityY = 0;
	private lastUpdateTime = 0;
	private lastRawX = 0;
	private lastRawY = 0;
	private config: SmoothingConfig;

	// Kalman filter state (if enabled)
	private kalmanX = { estimate: 0, errorCovariance: 1 };
	private kalmanY = { estimate: 0, errorCovariance: 1 };

	constructor(config: Partial<SmoothingConfig> = {}) {
		this.config = { ...DEFAULT_SMOOTHING_CONFIG, ...config };
	}

	// Method 1: Simple Low-pass Filter
	private applyLowPassFilter(rawX: number, rawY: number): { x: number; y: number } {
		this.smoothedX = this.config.alpha * rawX + (1 - this.config.alpha) * this.smoothedX;
		this.smoothedY = this.config.alpha * rawY + (1 - this.config.alpha) * this.smoothedY;
		return { x: this.smoothedX, y: this.smoothedY };
	}

	// Method 2: Advanced Smoothing with Dead Zone and Velocity Damping
	private applyAdvancedSmoothing(rawX: number, rawY: number, deltaTime: number): { x: number; y: number } {
		// Apply dead zone
		const filteredX = Math.abs(rawX) < this.config.deadZone ? 0 : rawX;
		const filteredY = Math.abs(rawY) < this.config.deadZone ? 0 : rawY;

		// Calculate velocity
		const dt = deltaTime / 1000;
		this.velocityX = (filteredX - this.lastRawX) / dt;
		this.velocityY = (filteredY - this.lastRawY) / dt;

		// Clamp velocity
		this.velocityX = Math.max(-this.config.maxVelocity, Math.min(this.config.maxVelocity, this.velocityX));
		this.velocityY = Math.max(-this.config.maxVelocity, Math.min(this.config.maxVelocity, this.velocityY));

		// Apply velocity damping
		this.velocityX *= this.config.velocityDamping;
		this.velocityY *= this.config.velocityDamping;

		// Apply low-pass filter with velocity compensation
		this.smoothedX = this.config.alpha * filteredX + (1 - this.config.alpha) * this.smoothedX + this.velocityX * dt;
		this.smoothedY = this.config.alpha * filteredY + (1 - this.config.alpha) * this.smoothedY + this.velocityY * dt;

		// Update last values
		this.lastRawX = filteredX;
		this.lastRawY = filteredY;

		return { x: this.smoothedX, y: this.smoothedY };
	}

	// Method 3: Kalman Filter (for advanced users)
	private applyKalmanFilter(rawX: number, rawY: number): { x: number; y: number } {
		// Simple 1D Kalman filter implementation
		const processNoise = 0.01;
		const measurementNoise = 0.1;

		// Update X
		this.kalmanX.errorCovariance += processNoise;
		const kalmanGainX = this.kalmanX.errorCovariance / (this.kalmanX.errorCovariance + measurementNoise);
		this.kalmanX.estimate += kalmanGainX * (rawX - this.kalmanX.estimate);
		this.kalmanX.errorCovariance = (1 - kalmanGainX) * this.kalmanX.errorCovariance;

		// Update Y
		this.kalmanY.errorCovariance += processNoise;
		const kalmanGainY = this.kalmanY.errorCovariance / (this.kalmanY.errorCovariance + measurementNoise);
		this.kalmanY.estimate += kalmanGainY * (rawY - this.kalmanY.estimate);
		this.kalmanY.errorCovariance = (1 - kalmanGainY) * this.kalmanY.errorCovariance;

		return { x: this.kalmanX.estimate, y: this.kalmanY.estimate };
	}

	// Main smoothing method
	smooth(rawX: number, rawY: number, currentTime: number): { x: number; y: number } | null {
		// Throttle updates
		if (currentTime - this.lastUpdateTime < this.config.minUpdateInterval) {
			return null;
		}

		const deltaTime = currentTime - this.lastUpdateTime;
		this.lastUpdateTime = currentTime;

		// Choose smoothing method based on configuration
		if (this.config.useKalmanFilter) {
			return this.applyKalmanFilter(rawX, rawY);
		} else if (this.config.deadZone > 0 || this.config.velocityDamping < 1) {
			return this.applyAdvancedSmoothing(rawX, rawY, deltaTime);
		} else {
			return this.applyLowPassFilter(rawX, rawY);
		}
	}

	// Reset the smoother state
	reset(): void {
		this.smoothedX = 0;
		this.smoothedY = 0;
		this.velocityX = 0;
		this.velocityY = 0;
		this.lastUpdateTime = 0;
		this.lastRawX = 0;
		this.lastRawY = 0;
		this.kalmanX = { estimate: 0, errorCovariance: 1 };
		this.kalmanY = { estimate: 0, errorCovariance: 1 };
	}

	// Update configuration
	updateConfig(newConfig: Partial<SmoothingConfig>): void {
		this.config = { ...this.config, ...newConfig };
	}
}
