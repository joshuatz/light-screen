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

const CSS_VARS = {
	selectedFillColor: `--selectedFillColor`,
};

const AUTOHIDE_MS = 3000;
