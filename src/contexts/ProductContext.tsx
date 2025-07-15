import React, { createContext, useContext, useState, useMemo, ReactNode, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import productData from '@/pages/home/productData.json';
import { localStorageManager } from '@/utils/localStorageManager';
import { UpperFitData, LowerFitData, tryonApiService } from '@/utils/tryonApi';

export interface TryonResult {
	tryonImage: string;
	sizeImage: string;
	imageSize: [number, number];
	upperFitData?: UpperFitData;
	lowerFitData?: LowerFitData;
}

export interface Product {
	id: number;
	name: string;
	price: number;
	oldPrice: number;
	rating: number;
	image: string;
	product: string;
	category: 'men' | 'women';
	type: 'upper' | 'lower';
	sizes: string;
	sleeve_type?: 'less' | 'short' | 'long';
	inseam_type?: 'short' | 'long';
	sizeChart?: File | null;
}

interface ProductContextType {
	currentProduct: Product | null;
	selectedVariant: Product | null;
	setSelectedVariant: (variant: Product | null) => void;
	selectedProducts: {
		upper: Product | null;
		lower: Product | null;
	};
	getSelectedProductByType: (type: 'upper' | 'lower') => Product | null;
	selectedSize: string | null;
	setSelectedSize: (size: string | null) => void;
	tryonResult: TryonResult | null;
	setTryonResult: (result: TryonResult | null) => void;
	isTryonLoading: boolean;
	setTryonLoading: (loading: boolean) => void;
	isShowSizeGuide: boolean;
	setIsShowSizeGuide: (show: boolean) => void;
	isLoadingSizeChart: boolean;
	// Cache methods
	getCachedTryonResult: (params: {
		upperId?: number;
		lowerId?: number;
		selectedFrontImageId?: number | null;
	}) => TryonResult | null;
	setCachedTryonResult: (params: {
		result: TryonResult;
		upperId?: number;
		lowerId?: number;
		selectedFrontImageId?: number | null;
	}) => void;
	clearTryonCache: () => void;
	tryonImage: string | null;
	setTryonImage: (image: string | null) => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

interface ProductProviderProps {
	children: ReactNode;
}

export const ProductProvider: React.FC<ProductProviderProps> = ({ children }) => {
	const { id } = useParams();
	const [selectedVariant, setSelectedVariant] = useState<Product | null>(null);
	const [selectedSize, setSelectedSize] = useState<string | null>(null);
	const [tryonResult, setTryonResult] = useState<TryonResult | null>(null);
	const [isLoadingSizeChart, setIsLoadingSizeChart] = useState(false);
	const [tryonImage, setTryonImage] = useState<string | null>(null);
	const [isTryonLoading, setTryonLoading] = useState(false);
	const [isShowSizeGuide, setIsShowSizeGuide] = useState(false);
	const [sizeChart, setSizeChart] = useState<File | null>(null);
	// Permanent cache for tryon results
	const tryonCache = useRef<Map<string, TryonResult>>(new Map());

	// Helper function to create cache key
	const createCacheKey = (params: {
		upperId?: number;
		lowerId?: number;
		selectedFrontImageId?: number | null;
	}): string => {
		const { upperId, lowerId, selectedFrontImageId } = params;
		// Get selectedFrontImageId from localStorage if not provided
		let frontImageId = selectedFrontImageId;
		if (frontImageId === undefined) {
			try {
				const userData = localStorageManager.getUserData();
				frontImageId = userData?.selectedFrontImageId || null;
			} catch (error) {
				console.warn('Could not retrieve selected front image ID from localStorage:', error);
				frontImageId = null;
			}
		}
		return `${upperId || 'none'}-${lowerId || 'none'}-${frontImageId || 'none'}`;
	};

	// Get cached tryon result
	const getCachedTryonResult = (params: {
		upperId?: number;
		lowerId?: number;
		selectedFrontImageId?: number | null;
	}): TryonResult | null => {
		const cacheKey = createCacheKey(params);
		return tryonCache.current.get(cacheKey) || null;
	};

	// Set cached tryon result
	const setCachedTryonResult = (params: {
		result: TryonResult;
		upperId?: number;
		lowerId?: number;
		selectedFrontImageId?: number | null;
	}) => {
		const { result, ...cacheParams } = params;
		const cacheKey = createCacheKey(cacheParams);
		tryonCache.current.set(cacheKey, result);
	};

	// Clear all cache
	const clearTryonCache = () => {
		tryonCache.current.clear();
	};

	// Revoke all cached object URLs to free up memory
	useEffect(() => {
		tryonCache.current.forEach((result) => {
			// Revoke blob URLs for both tryon and size images
			if (result.tryonImage.startsWith('blob:')) {
				URL.revokeObjectURL(result.tryonImage);
			}
			if (result.sizeImage.startsWith('blob:')) {
				URL.revokeObjectURL(result.sizeImage);
			}
		});
		tryonCache.current.clear();
	}, [id]);

	useEffect(() => {
		// reset all state when product changes
		setTryonResult(null);
		setSelectedVariant(null);
		setSelectedSize(null);
		setTryonLoading(false);
		setIsShowSizeGuide(false);
		setSizeChart(null);
		setTryonImage(null);
	}, [id]);

	const currentProduct = useMemo(() => {
		const product = (productData.find((product) => product.id === Number(id)) || null) as Product | null;

		if (product) {
			product.sizeChart = sizeChart;
		}
		return product as Product | null;
	}, [id, sizeChart]);

	const selectedProducts = useMemo(() => {
		const upper =
			currentProduct?.type === 'upper'
				? currentProduct
				: selectedVariant?.type === 'upper'
					? selectedVariant
					: null;
		const lower =
			currentProduct?.type === 'lower'
				? currentProduct
				: selectedVariant?.type === 'lower'
					? selectedVariant
					: null;

		return { upper, lower };
	}, [currentProduct, selectedVariant]);

	useEffect(() => {
		if (!currentProduct?.sizes) return;
		setIsLoadingSizeChart(true);

		tryonApiService
			.fetchProductSizeChart(currentProduct.sizes, 'size_chart.csv')
			.then((res) => {
				setSizeChart(res);
			})
			.catch((err) => {
				console.error(err);
			})
			.finally(() => {
				setIsLoadingSizeChart(false);
			});
	}, [id]);

	const getSelectedProductByType = (type: 'upper' | 'lower'): Product | null => {
		return selectedProducts[type];
	};

	const value: ProductContextType = {
		currentProduct,
		selectedVariant,
		setSelectedVariant,
		selectedProducts,
		getSelectedProductByType,
		selectedSize,
		setSelectedSize,
		isLoadingSizeChart,
		isShowSizeGuide,
		setIsShowSizeGuide,
		tryonResult,
		setTryonResult,
		isTryonLoading,
		setTryonLoading,
		getCachedTryonResult,
		setCachedTryonResult,
		clearTryonCache,
		tryonImage,
		setTryonImage
	};

	return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};

export const useProduct = (): ProductContextType => {
	const context = useContext(ProductContext);
	if (context === undefined) {
		throw new Error('useProduct must be used within a ProductProvider');
	}
	return context;
};
