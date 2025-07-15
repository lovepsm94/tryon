const path = require('path');
const fs = require('fs');

module.exports = {
	webpack: {
		alias: {
			'@': path.resolve(__dirname, 'src')
		}
	}
	// devServer: {
	// 	https: {
	// 		key: fs.readFileSync(path.resolve(__dirname, '.cert/key.pem')),
	// 		cert: fs.readFileSync(path.resolve(__dirname, '.cert/cert.pem'))
	// 	}
	// }
};
