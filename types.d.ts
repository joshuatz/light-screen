interface Config {
	selectedFillColorHex: string;
	mode: 'ring' | 'solid';
	ringSettings: {
		numRings: number;
		mode: 'led' | 'solid';
	};
}

type FillStyle = string | CanvasGradient | CanvasPattern;
