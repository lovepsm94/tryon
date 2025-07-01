import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ja from './ja.json';
import 'dayjs/locale/ja';
import { updateFontFamily } from '@/utils';
import { localStorageManager } from '@/utils/localStorageManager';

export const resources = {
	en: {
		translation: en
	},
	ja: { translation: ja }
};

export const initI18next = () => {
	// Get saved language from localStorage or default to 'ja'
	const savedLanguage = localStorageManager.getLanguage() || 'ja';

	return i18next
		.use(initReactI18next)
		.init({
			lng: savedLanguage,
			debug: true,
			resources: resources
		})
		.then(() => {
			updateFontFamily(i18next.language as 'en' | 'ja');
		});
};

export const getLanguage = () => {
	return i18next.language as 'en' | 'ja';
};

export const changeLanguage = (language: 'en' | 'ja') => {
	// Save language to localStorage
	localStorageManager.saveLanguage(language);
	// Update font family
	updateFontFamily(language);
	return i18next.changeLanguage(language);
};
