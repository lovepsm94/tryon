import React from 'react';
import { ReactComponent as CameraIcon } from '@/assets/camera.svg';
import { ReactComponent as TrashIcon } from '@/assets/trash.svg';
import Drawer from '@/components/ui/Drawer';
import { indexedDBManager, UserImageDataWithUrl } from '@/utils/indexedDBManager';
import { localStorageManager } from '@/utils/localStorageManager';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import PreparePhoto from '@/pages/product/Mobile/ProductActions/PreparePhoto';

const CameraPoseButton: React.FC = () => {
	const [openDrawer, setOpenDrawer] = React.useState(false);
	const [frontImages, setFrontImages] = React.useState<UserImageDataWithUrl[]>([]);
	const [showPreparePhoto, setShowPreparePhoto] = React.useState(false);
	const [selectedImageId, setSelectedImageId] = React.useState<number | null>(null);

	React.useEffect(() => {
		indexedDBManager.getAllUserImages().then((images) => {
			setFrontImages(images.filter((img) => img.type === 'front'));
		});
	}, [openDrawer]);

	// Load selected image ID from localStorage on component mount
	React.useEffect(() => {
		try {
			const userData = localStorageManager.getUserData();
			if (userData && userData.selectedFrontImageId) {
				setSelectedImageId(userData.selectedFrontImageId);
			}
		} catch (error) {
			console.error('Error loading selected image ID:', error);
		}
	}, []);

	const handleCaptureClick = () => {
		setOpenDrawer(false);
		setShowPreparePhoto(true);
	};

	const handlePreparePhotoCancel = () => {
		setShowPreparePhoto(false);
	};

	const handlePreparePhotoContinue = () => {
		setShowPreparePhoto(false);
		// Refresh images after photo is taken
		indexedDBManager.getAllUserImages().then((images) => {
			setFrontImages(images.filter((img) => img.type === 'front'));
		});
	};

	const handleDeleteImage = async (imageId: number, imageUrl: string) => {
		try {
			// Delete from IndexedDB
			await indexedDBManager.deleteUserImage(imageId);
			// Revoke object URL to free memory
			indexedDBManager.revokeObjectUrl(imageUrl);

			// If the deleted image was selected, clear the selection
			if (selectedImageId === imageId) {
				setSelectedImageId(null);
				localStorageManager.updateUserData({ selectedFrontImageId: null });
			}

			// Refresh the image list
			const images = await indexedDBManager.getAllUserImages();
			setFrontImages(images.filter((img) => img.type === 'front'));
		} catch (error) {
			console.error('Error deleting image:', error);
		}
	};

	const handleImageClick = (imageId: number) => {
		setSelectedImageId(imageId);
		// Save to localStorage
		localStorageManager.updateUserData({ selectedFrontImageId: imageId });
	};

	return (
		<>
			{!openDrawer && (
				<button
					onClick={() => setOpenDrawer(true)}
					className='fixed z-10 bottom-20 right-8 w-[54px] h-[54px] bg-[#373737] rounded-full flex items-center justify-center text-white'
				>
					<CameraIcon />
				</button>
			)}
			<Drawer
				contentClassName='rounded-none bg-black-900/80 p-6 md:px-[140px]'
				isOpen={openDrawer}
				showOverlay={false}
				onClose={() => setOpenDrawer(false)}
			>
				<Swiper slidesPerView='auto' spaceBetween={16} className='p-4'>
					{/* Capture button as first slide */}
					<SwiperSlide className='!w-[120px] !h-[155px]'>
						<div
							onClick={handleCaptureClick}
							className='w-full h-full cursor-pointer bg-[#808191] flex items-center justify-center text-white'
						>
							<div className='h-[60px] w-[60px] bg-[#BBBCCA] rounded-full flex items-center justify-center'>
								<CameraIcon />
							</div>
						</div>
					</SwiperSlide>

					{/* Existing front images */}
					{frontImages.map((img, idx) => (
						<SwiperSlide key={img.id || idx} className='!w-[120px] !h-[155px]'>
							<div
								className={`w-full h-full flex-shrink-0 flex items-center justify-center relative cursor-pointer ${
									selectedImageId === img.id ? 'border-gradient' : ''
								}`}
								onClick={() => img.id && handleImageClick(img.id)}
							>
								<img
									src={img.imageUrl}
									alt={`pose-front-${idx}`}
									className='w-full h-full object-cover'
								/>
								{/* Delete button */}
								<button
									onClick={(e) => {
										e.stopPropagation();
										if (img.id) {
											handleDeleteImage(img.id, img.imageUrl);
										}
									}}
									className='absolute top-2 right-2 w-5 h-5 bg-[#808191] rounded-full flex items-center justify-center text-white'
								>
									<TrashIcon />
								</button>
							</div>
						</SwiperSlide>
					))}
				</Swiper>
			</Drawer>

			{/* PreparePhoto Modal */}
			{showPreparePhoto && (
				<PreparePhoto onCancel={handlePreparePhotoCancel} onContinue={handlePreparePhotoContinue} />
			)}
		</>
	);
};

export default CameraPoseButton;
