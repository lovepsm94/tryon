import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { tryonApiService } from '@/utils/tryonApi';

interface AuthContextType {
	isAuthenticated: boolean;
	isLoading: boolean;
	verifyAccessCode: (accessCode: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
	children: ReactNode;
}

const ACCESS_CODE_KEY = 'tryon_access_code';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	// Check for existing access code on mount
	useEffect(() => {
		const checkExistingAccessCode = async () => {
			const storedAccessCode = localStorage.getItem(ACCESS_CODE_KEY);

			if (!storedAccessCode) {
				setIsAuthenticated(false);
				return;
			}

			const accessCode = parseInt(storedAccessCode, 10);
			if (isNaN(accessCode)) {
				// Invalid stored access code, remove it
				localStorage.removeItem(ACCESS_CODE_KEY);
				setIsAuthenticated(false);
				return;
			}

			setIsLoading(true);
			try {
				const isValid = await tryonApiService.verifyAccessCode(accessCode);
				if (isValid) {
					setIsAuthenticated(true);
				} else {
					localStorage.removeItem(ACCESS_CODE_KEY);
					setIsAuthenticated(false);
				}
			} catch (error) {
				console.error('Error verifying access code:', error);
				// Remove invalid access code
				localStorage.removeItem(ACCESS_CODE_KEY);
				setIsAuthenticated(false);
			} finally {
				setIsLoading(false);
			}
		};

		checkExistingAccessCode();
	}, []);

	const verifyAccessCode = async (accessCode: number): Promise<boolean> => {
		try {
			const isValid = await tryonApiService.verifyAccessCode(accessCode);

			if (isValid) {
				// Store the access code
				localStorage.setItem(ACCESS_CODE_KEY, accessCode.toString());
				setIsAuthenticated(true);
				return true;
			} else {
				return false;
			}
		} catch (error) {
			console.error('Error verifying access code:', error);
			return false;
		}
	};

	const value: AuthContextType = {
		isAuthenticated,
		isLoading,
		verifyAccessCode
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};
