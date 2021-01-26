/** @type {HTMLInputElement} */
const colorPicker = document.querySelector('#colorPicker');
/** @type {HTMLHtmlElement} */
const root = document.querySelector(':root');
const CE = document.querySelector('canvas');
/** @type {NodeListOf<HTMLButtonElement>} */
const presetOptionButtons = document.querySelectorAll('.presets button');

/** @type {Config} */
const config = {
	selectedFillColorHex: '#FFF',
	mode: 'ring',
	ringSettings: {
		numRings: 1,
		mode: 'led',
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
	},
};

const CSS_VARS = {
	selectedFillColor: `--selectedFillColor`,
};

const handleColorChange = (hexStr = '#FFF') => {
	console.log(hexStr);
	root.style.setProperty(CSS_VARS.selectedFillColor, hexStr);
	config.selectedFillColorHex = hexStr;
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
 * @param {Config['ringSettings']['mode']} [style]
 * @param {number} [ringWidthPercent]
 */
const drawRing = (style = 'solid', ringWidthPercent = 10) => {
	const midPoint = getMidPoint();
	const { ctx, dimensions } = canvas;
	const smallestDim =
		dimensions.w < dimensions.h ? dimensions.w : dimensions.h;
	const ringWidthPx = Math.floor(smallestDim * (ringWidthPercent / 100));
	ctx.fillStyle = config.selectedFillColorHex;
	ctx.strokeStyle = config.selectedFillColorHex;
	if (style === 'solid') {
		// For solid, we can just draw a single arc
		ctx.beginPath();
		ctx.lineWidth = ringWidthPx;
		const arcRadius = Math.floor(smallestDim / 2 - ringWidthPx);
		ctx.arc(midPoint.x, midPoint.y, arcRadius, 0, 2 * Math.PI);
		ctx.stroke();
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
	canvas.dimensions = {
		w: boundingRect.width,
		h: boundingRect.height,
	};
	canvas.el.width = boundingRect.width;
	canvas.el.height = boundingRect.height;

	if (config.mode === 'solid') {
		// Easy! Just fill entire canvas
		// No need to clear, since we are drawing over existing content
		// Note: You cannot use CSS variables with canvas fillStyle
		fillCanvas(config.selectedFillColorHex);
	} else if (config.mode === 'ring') {
		canvas.clear();
		// Dark background
		fillCanvas('#000');
		drawRing();
	}
};

const attachListeners = () => {
	colorPicker.addEventListener('change', () => {
		handleColorChange(colorPicker.value);
	});
	window.addEventListener('resize', () => {
		renderFrame();
	});
	presetOptionButtons.forEach((b) => {
		b.addEventListener('click', (evt) => {
			const presetColorStr = b.style.backgroundColor;
			handleColorChange(presetColorStr);
		});
	});
};

attachListeners();
renderFrame();
