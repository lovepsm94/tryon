export type PoseTemplate = {
	keypoints: {
		y: number;
		x: number;
		name?: string;
	}[];
	width: number;
	height: number;
};
export const sidePose = {
	keypoints: [
		{
			y: 50.56446413969252,
			x: 183.17183848704536,
			name: 'nose'
		},
		{
			y: 46.00150701623632,
			x: 180.7514138491394,
			name: 'left_eye'
		},
		{
			y: 46.362382289200305,
			x: 180.89876662443277,
			name: 'right_eye'
		},
		{
			y: 47.111183639616954,
			x: 170.89489425522612,
			name: 'left_ear'
		},
		{
			y: 47.004340047259554,
			x: 171.2885882091562,
			name: 'right_ear'
		},
		{
			y: 67.18015365915097,
			x: 167.78754080640715,
			name: 'left_shoulder'
		},
		{
			y: 66.68159235739361,
			x: 165.78313862167647,
			name: 'right_shoulder'
		},
		{
			y: 102.75733112537472,
			x: 165.770178134293,
			name: 'left_elbow'
		},
		{
			y: 102.58330670878743,
			x: 166.83810084707818,
			name: 'right_elbow'
		},
		{
			y: 137.12109062018095,
			x: 174.53065566011085,
			name: 'left_wrist'
		},
		{
			y: 135.32022630232632,
			x: 173.99480231767583,
			name: 'right_wrist'
		},
		{
			y: 134.3899206795718,
			x: 167.17050824098732,
			name: 'left_hip'
		},
		{
			y: 134.29112377279142,
			x: 168.9190403781067,
			name: 'right_hip'
		},
		{
			y: 182.20229229695065,
			x: 167.97117835045677,
			name: 'left_knee'
		},
		{
			y: 178.9930396970308,
			x: 172.74868056323,
			name: 'right_knee'
		},
		{
			y: 230.3782775881443,
			x: 161.7299683285004,
			name: 'left_ankle'
		},
		{
			y: 218.03073240348007,
			x: 168.21940385527336,
			name: 'right_ankle'
		}
	],
	width: 343,
	height: 275
};

export const frontPose = {
	keypoints: [
		{ x: 320, y: 60, name: 'nose' },
		{ x: 312, y: 55, name: 'left_eye' },
		{ x: 328, y: 55, name: 'right_eye' },
		{ x: 308, y: 70, name: 'left_ear' },
		{ x: 332, y: 70, name: 'right_ear' },
		{ x: 280, y: 110, name: 'left_shoulder' },
		{ x: 360, y: 110, name: 'right_shoulder' },
		{ x: 265, y: 170, name: 'left_elbow' },
		{ x: 375, y: 170, name: 'right_elbow' },
		{ x: 245, y: 240, name: 'left_wrist' },
		{ x: 395, y: 240, name: 'right_wrist' },
		{ x: 290, y: 220, name: 'left_hip' },
		{ x: 350, y: 220, name: 'right_hip' },
		{ x: 295, y: 320, name: 'left_knee' },
		{ x: 345, y: 320, name: 'right_knee' },
		{ x: 288, y: 395, name: 'left_ankle' },
		{ x: 352, y: 395, name: 'right_ankle' }
	],
	width: 640,
	height: 480
};
