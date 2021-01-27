/** @type {HTMLInputElement} */
const colorPicker = document.querySelector('#colorPicker');
/** @type {HTMLHtmlElement} */
const root = document.querySelector(':root');
/** @type {HTMLCanvasElement} */
const CE = document.querySelector('canvas');
/** @type {HTMLCanvasElement} */
const CE_OVERLAY = document.querySelector('canvas#overlay');
/** @type {NodeListOf<HTMLButtonElement>} */
const presetOptionButtons = document.querySelectorAll('.presets button');
/** @type {HTMLDivElement} */
const settingsPanel = document.querySelector('.settings.card');
/** @type {HTMLInputElement} */
const mainModeCheckboxSwitch = document.querySelector('#mainModeSwitch');
/** @type {HTMLSelectElement} */
const ringLightModeSelect = document.querySelector('#ringLightModeSelect');
/** @type {HTMLButtonElement} */
const webcamPreviewButton = document.querySelector(
	'button.webcamPreviewButton'
);
/** @type {HTMLVideoElement} */
const webcamVideoElem = document.querySelector('video#webcamPreview');
/** @type {HTMLButtonElement} */
const customColorButton = document.querySelector('button#customColorButton');
/** @type {HTMLInputElement} */
const diffusedCheckbox = document.querySelector('input#diffusedCheckbox');

/**
 * Track last time mouse moved / app was interacted with
 */
let lastInteraction = Date.now();
let interactionCheckerTimer;
let settingsAreHidden = false;
let webcamPreviewIsOpen = false;
let noSleepInitialized = false;
let noSleepTracker;
/** @type {null | MediaStream} */
let webcamStream;

/** @type {Config} */
const config = {
	lockSettingsOnScreen: false,
	selectedFillColorStr: '#ffd48a',
	mode: 'ring',
	ringSettings: {
		numRings: 1,
		mode: 'led',
		diffuse: true,
	},
};

const overlayCanvas = {
	el: CE_OVERLAY,
	ctx: CE_OVERLAY.getContext('2d'),
	dimensions: {
		w: CE_OVERLAY.width,
		h: CE_OVERLAY.height,
	},
	clear() {
		this.ctx.clearRect(0, 0, canvas.dimensions.w, canvas.dimensions.h);
	},
};

const canvas = {
	el: CE,
	ctx: CE.getContext('2d'),
	dimensions: {
		w: CE.width,
		h: CE.height,
	},
	clear() {
		this.ctx.clearRect(0, 0, canvas.dimensions.w, canvas.dimensions.h);
		overlayCanvas.clear();
	},
};

const CSS_VARS = {
	selectedFillColor: `--selectedFillColor`,
};

const AUTOHIDE_MS = 3000;

const handleColorChange = (colorStr = '#FFF') => {
	console.log(colorStr);
	root.style.setProperty(CSS_VARS.selectedFillColor, colorStr);
	config.selectedFillColorStr = colorStr;
	renderFrame();
};

const getMidPoint = () => {
	const { dimensions } = canvas;
	return {
		x: Math.floor(dimensions.w / 2),
		y: Math.floor(dimensions.h / 2),
	};
};

/**
 * Draw a ring on the canvas
 * @param {RingParam} RingParameters
 */
const drawRing = ({
	style = 'solid',
	outsideMarginPx = 5,
	ringWidthPercent,
	numLeds,
}) => {
	console.log(numLeds);
	if (!ringWidthPercent) {
		ringWidthPercent = style === 'solid' ? 18 : 16;
	}
	const minLedSpacingPx = 3;
	const midPoint = getMidPoint();
	const { ctx, dimensions } = canvas;
	const smallestDim =
		dimensions.w < dimensions.h ? dimensions.w : dimensions.h;
	const ringWidthPx = Math.floor(smallestDim * (ringWidthPercent / 100));

	ctx.fillStyle = config.selectedFillColorStr;
	ctx.strokeStyle = config.selectedFillColorStr;

	if (style === 'solid') {
		const midTrackRadius =
			smallestDim / 2 - ringWidthPx / 2 - outsideMarginPx;
		// For solid, we can just draw a single arc, with lineWidth = ringWidth
		ctx.beginPath();
		ctx.lineWidth = ringWidthPx;
		ctx.arc(midPoint.x, midPoint.y, midTrackRadius, 0, 2 * Math.PI);
		ctx.stroke();
	} else if (style === 'led') {
		// We will emulate a "track" + embedded LEDs, by drawing LEDS first
		// and then drawing the track (2 concentric circles) on top, and
		// finally by a blur layer on top
		// Inside track ridge
		const insideTrackRidgeRadius =
			smallestDim / 2 -
			ringWidthPx -
			outsideMarginPx -
			minLedSpacingPx * 2;
		// This line is the very middle of a virtual track that contains all LEDs,
		// or contains the solid fill
		const midTrackRidgeRadius =
			insideTrackRidgeRadius + ringWidthPx * 0.5 + minLedSpacingPx;
		// Outside track ridge
		const outsideTrackRidgeRadius =
			midTrackRidgeRadius + ringWidthPx * 0.5 + minLedSpacingPx;
		console.log({
			smallestDim,
			ringWidthPx,
			insideTrackRidgeRadius,
			midTrackRidgeRadius,
			outsideTrackRidgeRadius,
		});
		const ledTrackCircumference = 2 * Math.PI * midTrackRidgeRadius;
		let ledRadius;
		if (numLeds) {
			// If numLeds is provided, we need to make them all fit by reducing
			// the radius of each LED
			// const maxRadius = smallestDim / 2 - ringWidthPx * 0.5;
			const maxLedRadius =
				(outsideTrackRidgeRadius - insideTrackRidgeRadius) / 2 -
				minLedSpacingPx;
			ledRadius = Math.floor(
				// prettier-ignore
				(ledTrackCircumference / numLeds) / 2 - minLedSpacingPx * 2
			);
			ledRadius = ledRadius > maxLedRadius ? maxLedRadius : ledRadius;
		} else {
			// If numLeds is not provided, the goal is to maximize the *size*
			// of each LED, while staying within the bound of maxRingWidth

			// Compute number of LEDS that can fit within the given track
			// Each LED occupies the space of (2 * R) + (2 * spacing), where 2R is
			// the same as the desired ring width px
			ledRadius = ringWidthPx / 2;
			const ledDiameterWithMargin = ledRadius * 2 + minLedSpacingPx * 2;
			numLeds = Math.floor(ledTrackCircumference / ledDiameterWithMargin);
		}

		const radsSep = (2 * Math.PI) / numLeds;
		let radPointer = 0;
		// Draw LEDS around the circle
		for (let x = 0; x < numLeds; x++) {
			// https://stackoverflow.com/a/839931/11447682
			const point = {
				x: Math.floor(
					midTrackRidgeRadius * Math.cos(radPointer) + midPoint.x
				),
				y: Math.floor(
					midTrackRidgeRadius * Math.sin(radPointer) + midPoint.y
				),
			};
			ctx.beginPath();
			ctx.arc(point.x, point.y, ledRadius, 0, 2 * Math.PI);
			ctx.fill();
			radPointer += radsSep;
		}

		if (config.ringSettings.diffuse) {
			// Create an arc that covers the LEDs, with a semi-transparent fill
			ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
			ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
			ctx.beginPath();
			ctx.lineWidth = outsideTrackRidgeRadius - insideTrackRidgeRadius;
			ctx.arc(
				midPoint.x,
				midPoint.y,
				midTrackRidgeRadius,
				0,
				2 * Math.PI
			);
			ctx.stroke();
		}
	}
};

/**
 * Fill the canvas with a given color / fill
 * @param {FillStyle} [fillStyle]
 */
const fillCanvas = (fillStyle = '#FFF') => {
	const { w, h } = canvas.dimensions;
	const { ctx } = canvas;
	ctx.fillStyle = fillStyle;
	ctx.fillRect(0, 0, w, h);
};

const renderFrame = () => {
	// Update canvas props, in case of resize
	const boundingRect = canvas.el.getBoundingClientRect();
	[canvas, overlayCanvas].forEach((o) => {
		o.dimensions = {
			w: boundingRect.width,
			h: boundingRect.height,
		};
		o.el.width = boundingRect.width;
		o.el.height = boundingRect.height;
	});

	if (config.mode === 'solid') {
		// Easy! Just fill entire canvas
		// No need to clear, since we are drawing over existing content
		// Note: You cannot use CSS variables with canvas fillStyle
		fillCanvas(config.selectedFillColorStr);
	} else if (config.mode === 'ring') {
		canvas.clear();
		// Dark background
		fillCanvas('#000');
		drawRing({
			style: config.ringSettings.mode,
			numLeds: config.ringSettings.numLeds || 11,
		});
	}
};

const startWebcamStream = async () => {
	if (!webcamPreviewIsOpen) {
		try {
			webcamStream = await navigator.mediaDevices.getUserMedia({
				audio: false,
				video: { width: 480, height: 270, facingMode: 'user' },
			});
			webcamVideoElem.onloadedmetadata = () => {
				webcamVideoElem.play();
				webcamPreviewIsOpen = true;
			};
			webcamVideoElem.srcObject = webcamStream;
			settingsPanel.setAttribute('data-preview-on', 'true');
		} catch (e) {
			console.error(e);
			alert(
				`Something went wrong trying to preview your camera: ${e.toString()}`
			);
		}
	}
};

const stopWebcamStream = async () => {
	if (webcamStream) {
		webcamStream.getTracks().forEach((t) => {
			if (t.readyState === 'live') {
				t.stop();
			}
		});
	}
	webcamStream = null;
	webcamPreviewIsOpen = false;
	settingsPanel.setAttribute('data-preview-on', 'false');
};

const attachListeners = () => {
	colorPicker.addEventListener('change', () => {
		const colorStr = colorPicker.value;
		handleColorChange(colorStr);
		customColorButton.setAttribute('data-value', colorStr);
		customColorButton.style.cssText = `background-color: ${colorStr};`;
	});
	// Since the canvas is set to take up the whole screen, we need to listen
	// to resize events, and pass through dimension changes and trigger new
	// renders
	window.addEventListener('resize', () => {
		renderFrame();
	});
	presetOptionButtons.forEach((b) => {
		b.addEventListener('click', (evt) => {
			const presetColorStr = b.style.backgroundColor;
			handleColorChange(presetColorStr);
		});
	});
	document.addEventListener('mousemove', () => {
		lastInteraction = Date.now();
		if (settingsAreHidden) {
			settingsAreHidden = false;
			settingsPanel.setAttribute('data-hidden', 'false');
		}
		if (!noSleepInitialized && typeof NoSleep !== 'undefined') {
			noSleepInitialized = true;
			noSleepTracker = new NoSleep();
			noSleepTracker.enable();
		}
	});
	document.querySelector('.autoHideToggle').addEventListener('click', () => {
		config.lockSettingsOnScreen = !config.lockSettingsOnScreen;
		settingsPanel.setAttribute(
			'data-pinned',
			config.lockSettingsOnScreen.toString()
		);
	});
	interactionCheckerTimer = setInterval(() => {
		if (!config.lockSettingsOnScreen) {
			const now = Date.now();
			if (now - lastInteraction >= AUTOHIDE_MS) {
				settingsAreHidden = true;
				settingsPanel.setAttribute('data-hidden', 'true');
			}
		}
	}, AUTOHIDE_MS);
	mainModeCheckboxSwitch.addEventListener('change', () => {
		config.mode = mainModeCheckboxSwitch.checked ? 'ring' : 'solid';
		settingsPanel.setAttribute('data-mode', config.mode);
		renderFrame();
	});
	diffusedCheckbox.addEventListener('change', () => {
		config.ringSettings.diffuse = !!diffusedCheckbox.checked;
		renderFrame();
	});
	ringLightModeSelect.addEventListener('change', () => {
		config.ringSettings.mode = /** @type {Config['ringSettings']['mode']} */ (ringLightModeSelect.value);
		renderFrame();
	});
	webcamPreviewButton.addEventListener('click', () => {
		if (!webcamPreviewIsOpen) {
			startWebcamStream();
		} else {
			stopWebcamStream();
		}
	});
	document
		.querySelector('button.hideButton')
		.addEventListener('click', () => {
			settingsAreHidden = true;
			settingsPanel.setAttribute('data-hidden', 'true');
		});
};

/**
 * Main Init
 */
attachListeners();
renderFrame();
settingsPanel.setAttribute(
	'data-pinned',
	config.lockSettingsOnScreen.toString()
);
