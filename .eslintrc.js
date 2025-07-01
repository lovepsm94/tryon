module.exports = {
	root: true,
	env: {
		browser: true,
		es2021: true,
		node: true
	},
	ignorePatterns: ['**/*.html', 'craco.config.js'],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:react/recommended',
		'plugin:react-hooks/recommended'
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaFeatures: {
			jsx: true
		},
		ecmaVersion: 'latest',
		sourceType: 'module'
	},
	plugins: ['@typescript-eslint', 'react', 'react-hooks'],
	settings: {
		react: {
			version: 'detect'
		}
	},
	rules: {
		'@typescript-eslint/no-unused-vars': 'error',
		'react/react-in-jsx-scope': 'off'
	}
};
