import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { initI18next } from './locales';

initI18next();
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
	// <React.StrictMode>
	<App />
	// </React.StrictMode>
);
