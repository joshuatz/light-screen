interface Config {
	/** If the settings panel should always be on screen / non-hideable */
	lockSettingsOnScreen: boolean;
	selectedFillColorStr: string;
	mode: 'ring' | 'solid';
	ringSettings: {
		mode: 'led' | 'solid';
		numRings?: number;
		numLeds?: number;
		diffuse?: boolean;
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

declare class NoSleep {
	public enable(): void;
	public disable(): void;
}
