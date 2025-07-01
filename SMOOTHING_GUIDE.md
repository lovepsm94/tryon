# Sensor Smoothing Guide

## Vấn đề

Cảm biến chuyển động của thiết bị thường tạo ra dữ liệu có nhiễu cao, gây ra hiện tượng "giật" (jitter) khi hiển thị. Điều này làm cho trải nghiệm người dùng kém mượt mà.

## Các phương pháp giải quyết

### 1. **Low-pass Filter (Lọc thông thấp)**

- **Nguyên lý**: Làm mượt dữ liệu bằng cách kết hợp giá trị hiện tại với giá trị trước đó
- **Công thức**: `smoothed = alpha * current + (1 - alpha) * previous`
- **Tham số**: `alpha` (0.1 = rất mượt, 0.9 = rất nhạy)
- **Ưu điểm**: Đơn giản, hiệu quả
- **Nhược điểm**: Có thể làm chậm phản ứng

### 2. **Dead Zone (Vùng chết)**

- **Nguyên lý**: Bỏ qua những chuyển động nhỏ dưới ngưỡng nhất định
- **Tham số**: `deadZone` (ví dụ: 0.1)
- **Ưu điểm**: Loại bỏ nhiễu nhỏ
- **Nhược điểm**: Có thể bỏ sót chuyển động thực

### 3. **Velocity Damping (Giảm chấn vận tốc)**

- **Nguyên lý**: Tính toán vận tốc và áp dụng hệ số giảm chấn
- **Tham số**: `velocityDamping` (0.5-1.0)
- **Ưu điểm**: Mượt mà hơn, ít giật
- **Nhược điểm**: Phức tạp hơn

### 4. **Kalman Filter**

- **Nguyên lý**: Thuật toán ước lượng trạng thái tối ưu
- **Ưu điểm**: Rất chính xác, loại bỏ nhiễu tốt
- **Nhược điểm**: Phức tạp, khó điều chỉnh

## Cấu hình Preset

### VERY_SMOOTH

```javascript
{
  alpha: 0.05,           // Rất mượt
  deadZone: 0.2,         // Vùng chết lớn
  velocityDamping: 0.6,  // Giảm chấn mạnh
  maxVelocity: 1.5,      // Vận tốc tối đa thấp
}
```

**Phù hợp**: Ứng dụng cần độ ổn định cao, không cần phản ứng nhanh

### BALANCED

```javascript
{
  alpha: 0.15,           // Cân bằng
  deadZone: 0.1,         // Vùng chết vừa phải
  velocityDamping: 0.8,  // Giảm chấn vừa phải
  maxVelocity: 2.0,      // Vận tốc tối đa trung bình
}
```

**Phù hợp**: Hầu hết các ứng dụng, cân bằng giữa mượt mà và phản ứng

### RESPONSIVE

```javascript
{
  alpha: 0.3,            // Nhạy
  deadZone: 0.05,        // Vùng chết nhỏ
  velocityDamping: 0.9,  // Giảm chấn nhẹ
  maxVelocity: 3.0,      // Vận tốc tối đa cao
}
```

**Phù hợp**: Ứng dụng cần phản ứng nhanh, game, VR

### KALMAN

```javascript
{
  alpha: 0.1,
  deadZone: 0.1,
  useKalmanFilter: true, // Sử dụng Kalman filter
}
```

**Phù hợp**: Ứng dụng cần độ chính xác cao, có thể chấp nhận độ phức tạp

## Cách sử dụng

### 1. Import và khởi tạo

```javascript
import { SensorSmoother, SMOOTHING_PRESETS } from '@/utils/sensorSmoothing';

// Sử dụng preset
const smoother = new SensorSmoother(SMOOTHING_PRESETS.BALANCED);

// Hoặc cấu hình tùy chỉnh
const smoother = new SensorSmoother({
	alpha: 0.2,
	deadZone: 0.15,
	velocityDamping: 0.85,
	maxVelocity: 2.5
});
```

### 2. Áp dụng smoothing

```javascript
const handleMotion = (event) => {
	const { x, y } = event.accelerationIncludingGravity;
	const smoothed = smoother.smooth(x, y, Date.now());

	if (smoothed) {
		// Sử dụng smoothed.x và smoothed.y
		updateDotPosition(smoothed.x, smoothed.y);
	}
};
```

### 3. Thay đổi cấu hình động

```javascript
// Chuyển sang preset khác
smoother.updateConfig(SMOOTHING_PRESETS.VERY_SMOOTH);

// Hoặc cập nhật từng tham số
smoother.updateConfig({ alpha: 0.25 });
```

## Tips và Tricks

### 1. **Điều chỉnh theo thiết bị**

- iOS: Thường cần `alpha` thấp hơn (0.1-0.2)
- Android: Có thể dùng `alpha` cao hơn (0.2-0.3)
- Tablet: Cần `deadZone` lớn hơn do ít chuyển động

### 2. **Tối ưu performance**

- Sử dụng `requestAnimationFrame` cho DOM updates
- Throttle sensor events (16ms = 60fps)
- Tránh tính toán phức tạp trong event handler

### 3. **Debug và test**

- Sử dụng `SmoothingDemo` component để test
- Log raw vs smoothed values
- Test trên nhiều thiết bị khác nhau

### 4. **Cân bằng giữa mượt mà và chính xác**

- `alpha` thấp = mượt nhưng chậm
- `alpha` cao = nhanh nhưng giật
- `deadZone` lớn = ổn định nhưng có thể bỏ sót
- `velocityDamping` thấp = mượt nhưng có thể "lag"

## Ví dụ thực tế

```javascript
// Trong component PreparePhoto
const sensorSmoother = useRef(new SensorSmoother(SMOOTHING_PRESETS.BALANCED));

const handleMotion = useCallback((event) => {
	if (event.accelerationIncludingGravity) {
		const { x, y } = event.accelerationIncludingGravity;
		const smoothed = sensorSmoother.current.smooth(x, y, Date.now());

		if (smoothed) {
			// Tính toán vị trí dot
			const dotX = calculateXPosition(smoothed.x);
			const dotY = calculateYPosition(smoothed.y);

			// Cập nhật DOM mượt mà
			requestAnimationFrame(() => {
				dotRef.current.style.transform = `translate(${dotX}px, ${dotY}px)`;
			});
		}
	}
}, []);
```

## Kết luận

Việc chọn phương pháp smoothing phù hợp phụ thuộc vào:

1. **Yêu cầu về độ chính xác** của ứng dụng
2. **Loại thiết bị** mục tiêu
3. **Trải nghiệm người dùng** mong muốn
4. **Performance** của ứng dụng
