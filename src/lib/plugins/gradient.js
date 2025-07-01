// eslint-disable-next-line @typescript-eslint/no-var-requires
const plugin = require('tailwindcss/plugin');

module.exports = plugin(function ({ addUtilities }) {
	addUtilities({
		'.text-gradient': {
			'background-image': 'linear-gradient(to right, #6B25E0, #2C44EF)',
			'background-clip': 'text',
			color: 'transparent'
		},
		'.border-gradient': {
			position: 'relative',
			border: '2px solid transparent',
			background:
				'linear-gradient(white, white) padding-box, linear-gradient(-45deg, #FFA63D, #FF3D77, #338AFF, #3CF0C5) border-box',
			'background-size': '600% 600%',
			animation: 'gradient-move 5s linear infinite'
		},
		'.bg-gradient': {
			background: 'linear-gradient(-45deg, #FFA63D, #FF3D77, #338AFF, #3CF0C5)',
			'background-size': '600% 600%',
			animation: 'bg-gradient-move 10s ease-in-out infinite'
		},
		'@keyframes gradient-move': {
			'0%': {
				'background-position': '0% 50%'
			},
			'50%': {
				'background-position': '100% 50%'
			},
			'100%': {
				'background-position': '0% 50%'
			}
		},
		'@keyframes bg-gradient-move': {
			'0%': {
				'background-position': '0% 50%'
			},
			'50%': {
				'background-position': '100% 50%'
			},
			'100%': {
				'background-position': '0% 50%'
			}
		}
	});
});
