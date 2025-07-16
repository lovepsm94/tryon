import * as poseDetection from '@tensorflow-models/pose-detection';
import { useRef, useCallback } from 'react';

type Keypoint = poseDetection.Keypoint;

interface SmoothingBuffer {
	keypoints: Keypoint[];
	maxSize: number;
}

/**
 * Class để xử lý smooth keypoints bằng cách tính trung bình của các lần gần nhất
 */
export class KeypointSmoothing {
	private buffers: Map<number, SmoothingBuffer> = new Map();
	private readonly maxBufferSize: number;

	constructor(maxBufferSize = 10) {
		this.maxBufferSize = maxBufferSize;
	}

	/**
	 * Thêm keypoints mới vào buffer và trả về keypoints đã được smooth
	 * @param landmarks - Keypoints hiện tại
	 * @returns Keypoints đã được smooth
	 */
	smoothKeypoints(landmarks: Keypoint[]): Keypoint[] {
		if (!landmarks || landmarks.length === 0) {
			return landmarks;
		}

		// Thêm keypoints mới vào buffer cho từng keypoint
		landmarks.forEach((landmark, index) => {
			if (!this.buffers.has(index)) {
				this.buffers.set(index, {
					keypoints: [],
					maxSize: this.maxBufferSize
				});
			}

			const buffer = this.buffers.get(index)!;
			buffer.keypoints.push({ ...landmark });

			// Giữ chỉ maxBufferSize keypoints gần nhất
			if (buffer.keypoints.length > buffer.maxSize) {
				buffer.keypoints.shift();
			}
		});

		// Tính trung bình cho từng keypoint
		return landmarks.map((landmark, index) => {
			const buffer = this.buffers.get(index);
			if (!buffer || buffer.keypoints.length === 0) {
				return landmark;
			}

			// Tính trung bình x, y và score
			const avgX = buffer.keypoints.reduce((sum, kp) => sum + kp.x, 0) / buffer.keypoints.length;
			const avgY = buffer.keypoints.reduce((sum, kp) => sum + kp.y, 0) / buffer.keypoints.length;
			const avgScore = buffer.keypoints.reduce((sum, kp) => sum + (kp.score || 0), 0) / buffer.keypoints.length;

			return {
				...landmark,
				x: avgX,
				y: avgY,
				score: avgScore
			};
		});
	}

	/**
	 * Xóa tất cả buffers (reset smoothing)
	 */
	clearBuffers(): void {
		this.buffers.clear();
	}

	/**
	 * Lấy số lượng keypoints trong buffer
	 * @param keypointIndex - Index của keypoint
	 * @returns Số lượng keypoints trong buffer
	 */
	getBufferSize(keypointIndex: number): number {
		const buffer = this.buffers.get(keypointIndex);
		return buffer ? buffer.keypoints.length : 0;
	}

	/**
	 * Kiểm tra xem buffer đã đầy chưa
	 * @param keypointIndex - Index của keypoint
	 * @returns true nếu buffer đã đầy
	 */
	isBufferFull(keypointIndex: number): boolean {
		const buffer = this.buffers.get(keypointIndex);
		return buffer ? buffer.keypoints.length >= buffer.maxSize : false;
	}
}

/**
 * Hook để sử dụng keypoint smoothing
 */
export const useKeypointSmoothing = (bufferSize = 10) => {
	const smoothingRef = useRef<KeypointSmoothing | null>(null);

	// Khởi tạo smoothing instance
	if (!smoothingRef.current) {
		smoothingRef.current = new KeypointSmoothing(bufferSize);
	}

	const smoothKeypoints = useCallback((landmarks: Keypoint[]): Keypoint[] => {
		if (!smoothingRef.current) {
			return landmarks;
		}
		return smoothingRef.current.smoothKeypoints(landmarks);
	}, []);

	const clearBuffers = useCallback(() => {
		if (smoothingRef.current) {
			smoothingRef.current.clearBuffers();
		}
	}, []);

	return {
		smoothKeypoints,
		clearBuffers,
		smoothing: smoothingRef.current
	};
};
