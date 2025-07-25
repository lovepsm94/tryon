/** @type {import('tailwindcss').Config} */
// eslint-disable-next-line no-undef
module.exports = {
	content: ['./src/**/*.{js,jsx,ts,tsx}'],
	theme: {
		colors: {
			white: '#ffffff',
			dark: '#1B1D21',
			'black-900': '#121212',
			'black-600': '#605F5F',
			'black-500': '#807E7E',
			'black-400': '#A7A7A7',
			'black-300': '#CBCBCB',
			'black-200': '#EAEAEA',
			'black-100': '#F5F5F5',
			primary: '#064EF7'
		},
		extend: {}
	},
	plugins: [require('./src/lib/plugins/gradient')]
};
