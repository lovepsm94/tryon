import { paths } from '@/routes';
import React from 'react';
import { Link } from 'react-router-dom';

function About() {
	return (
		<div>
			About
			<Link to={paths.home}>sang home</Link>
		</div>
	);
}

export default About;
