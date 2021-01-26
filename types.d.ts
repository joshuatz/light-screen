interface Config {
	/** If the settings panel should always be on screen / non-hideable */
	lockSettingsOnScreen: boolean;
	selectedFillColorHex: string;
	mode: 'ring' | 'solid';
	ringSettings: {
		mode: 'led' | 'solid';
		numRings?: number;
		numLeds?: number;
	};
}

type FillStyle = string | CanvasGradient | CanvasPattern;

interface RingParam {
	/** Default = 'solid' */
	style: Config['ringSettings']['mode'];
	outsideMarginPx?: number;
	ringWidthPercent?: number;
	/** If specified, will override ringWidthPercent and could result in smaller LEDs in order to fix into ring */
	numLeds?: number;
}
