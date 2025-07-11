import React, { createContext, useContext, useState, useMemo, ReactNode, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import productData from '@/pages/home/productData.json';
import { localStorageManager } from '@/utils/localStorageManager';

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
	tryonResultImage: string | null;
	setTryonResultImage: (imageUrl: string | null) => void;
	isTryonLoading: boolean;
	setTryonLoading: (loading: boolean) => void;
	// Cache methods
	getCachedTryonResult: (params: {
		upperId?: number;
		lowerId?: number;
		selectedFrontImageId?: number | null;
	}) => string | null;
	setCachedTryonResult: (params: {
		imageUrl: string;
		upperId?: number;
		lowerId?: number;
		selectedFrontImageId?: number | null;
	}) => void;
	clearTryonCache: () => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

interface ProductProviderProps {
	children: ReactNode;
}

export const ProductProvider: React.FC<ProductProviderProps> = ({ children }) => {
	const { id } = useParams();
	const [selectedVariant, setSelectedVariant] = useState<Product | null>(null);
	const [tryonResultImage, setTryonResultImage] = useState<string | null>(null);
	const [isTryonLoading, setTryonLoading] = useState(false);

	// Permanent cache for tryon results
	const tryonCache = useRef<Map<string, string>>(new Map());

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
	}): string | null => {
		const cacheKey = createCacheKey(params);
		return tryonCache.current.get(cacheKey) || null;
	};

	// Set cached tryon result
	const setCachedTryonResult = (params: {
		imageUrl: string;
		upperId?: number;
		lowerId?: number;
		selectedFrontImageId?: number | null;
	}) => {
		const { imageUrl, ...cacheParams } = params;
		const cacheKey = createCacheKey(cacheParams);
		tryonCache.current.set(cacheKey, imageUrl);
	};

	// Clear all cache
	const clearTryonCache = () => {
		tryonCache.current.clear();
	};

	// Revoke all cached object URLs to free up memory

	useEffect(() => {
		tryonCache.current.forEach((imageUrl) => {
			if (imageUrl.startsWith('blob:')) {
				URL.revokeObjectURL(imageUrl);
			}
		});
		tryonCache.current.clear();
	}, [id]);

	useEffect(() => {
		// reset all state when product changes
		setTryonResultImage(null);
		setSelectedVariant(null);
		setTryonLoading(false);
	}, [id]);

	const currentProduct = useMemo(() => {
		const product = productData.find((product) => product.id === Number(id));
		return product as Product | null;
	}, [id]);

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

	const getSelectedProductByType = (type: 'upper' | 'lower'): Product | null => {
		return selectedProducts[type];
	};

	const value: ProductContextType = {
		currentProduct,
		selectedVariant,
		setSelectedVariant,
		selectedProducts,
		getSelectedProductByType,
		tryonResultImage,
		setTryonResultImage,
		isTryonLoading,
		setTryonLoading,
		getCachedTryonResult,
		setCachedTryonResult,
		clearTryonCache
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
