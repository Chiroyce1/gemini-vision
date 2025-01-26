import { GoogleGenerativeAI } from "@google/generative-ai";
import { safetySettings, prompts } from "/live/prompts.js";

const video = document.getElementById("webcam");
const responseElement = document.getElementById("response");
const canvas = document.getElementById("canvas");
const modelSelect = document.querySelector("#modelSelect");
const context = canvas.getContext("2d");
const loader = document.querySelector(".loader");
const textarea = document.querySelector("#prompt");

const models = [
	"gemini-1.5-flash-8b",
	"gemini-1.5-flash",
	"gemini-2.0-flash-exp",
	"gemini-1.5-pro",
];

loader.style.display = "none";
let enabled = false;

models.forEach((model) => {
	const option = document.createElement("option");
	option.text = model;
	option.value = model;
	modelSelect.add(option);
});

document.querySelector(
	"#prompt"
).value = `Hey there! Can you describe what you see in the image?`;

let model;
let genAI;
let chat;

const stateBtn = document.getElementById("state");
stateBtn.innerText = enabled ? "Stop" : "Start";
stateBtn.className = enabled ? "red" : "green";
stateBtn.addEventListener("click", () => {
	if (!model) {
		console.log("Creating model...");
		try {
			genAI = new GoogleGenerativeAI(API_KEY);
			model = genAI.getGenerativeModel({
				model: modelSelect.value,
				safetySettings,
			});
			modelSelect.disabled = true;
			modelSelect.title = "Please refresh the page to change the model.";
			modelSelect.style.cursor = "not-allowed";
			chat = model.startChat({
				history: [
					{
						role: "user",
						parts: [
							{
								text: `Keep all your responses less than 80 words, do not use markdown or emojis.`,
							},
						],
					},
					{
						role: "model",
						parts: [
							{
								text: "OK. I will keep my responses less than 80 words.",
							},
						],
					},
				],
			});
		} catch (e) {
			show(`Oops something went wrong.\nError: ${e}`);
		}
	}
	if (enabled) {
		enabled = false;
		speak("");
	} else {
		enabled = true;
	}
	stateBtn.className = enabled ? "red" : "green";
	stateBtn.innerText = enabled ? "Stop" : "Start";
});

const show = (text) => {
	// remove leading whitespace
	text = text.replace(/^\s+/gm, "");
	// remove trailing whitespace
	text = text.replace(/\s+$/gm, "");

	responseElement.innerText = `${responseElement.innerText}\n${text}`;
	responseElement.scrollTop = responseElement.scrollHeight;
};

// Top class error handling
let API_KEY = null;

if (localStorage.getItem("API_KEY")) {
	API_KEY = localStorage.getItem("API_KEY");
	setTimeout(() => {
		setInterval(captureImage, 2000);
	}, 2000); // wait for camera to load
} else {
	alert("Please provide an API_KEY.");
	location.href = "/";
}

let active = false; // is the model currently generating a response
let speaking = false; // is the speechsynthesis currently speaking

function onResize() {
	video.width = window.innerWidth;
	video.height = window.innerHeight - 50;
	video.style.width = `${window.innerWidth}px`;
}

onResize();
window.addEventListener("resize", onResize);

/* ======================================================================================== */
// Generative AI invocation and response handling with speech synthesis
/* ======================================================================================== */

function speak(txt) {
	speechSynthesis.cancel();
	speaking = true;
	const voice = speechSynthesis.getVoices()[voiceSelect.selectedIndex - 1];
	const utterance = new SpeechSynthesisUtterance(txt);
	if (voiceSelect.selectedIndex !== 0) {
		utterance.voice = voice;
		localStorage.setItem("voice", voice.name);
	}
	speechSynthesis.speak(utterance);
	utterance.addEventListener("end", () => {
		speaking = false;
	});
}

async function captureImage() {
	if (!enabled) return;
	if (active) return;
	if (speaking) return;
	loader.style.display = "block";
	context.drawImage(video, 0, 0, canvas.width, canvas.height);
	const imageDataURL = canvas.toDataURL("image/jpeg");
	const imageFile = new File([dataURItoBlob(imageDataURL)], "image.jpg", {
		type: "image/jpeg",
	});
	// open the blob in a new tab
	// const url = URL.createObjectURL(dataURItoBlob(imageDataURL));
	// window.open(url, "_blank");
	const image = await fileToGenerativePart(imageFile);
	if (API_KEY.trim() === "") {
		show("Please provide an API_KEY.");
		location.href = "/";
		return;
	}

	active = true;
	try {
		let start = Date.now();
		const data = textarea.value;
		const res = await chat.sendMessage([data, image]);
		console.log(chat._history);
		let text = res.response.text();
		loader.style.display = "none";
		active = false;
		text = text.replace(/\s+$/gm, ""); // remove trailing whitespace
		console.log(`${text}[${((Date.now() - start) / 1000).toFixed(1)}s]`);
		show(text);
		speak(text);
	} catch (e) {
		console.error(e);
		show(`Oops something went wrong.\nError: ${e.toString()}`);
		loader.style.display = "none";
		active = false;
		return;
	}

	loader.style.display = "none";
	active = false;
}

/* ======================================================================================== */
// Setup speech voices and camera
/* ======================================================================================== */

setTimeout(() => {
	// for some reason this function doesnt work properly on page load
	// so we have to wait a bit
	console.log(`${speechSynthesis.getVoices().length} voices found`);
	speechSynthesis.getVoices().forEach((voice) => {
		const option = document.createElement("option");
		option.value = voice.name;
		option.text = voice.name;
		voiceSelect.add(option);
	});
	const voice = localStorage.getItem("voice");
	if (voice) {
		const voiceIndex = Array.from(voiceSelect.options).findIndex(
			(option) => option.value === voice
		);
		if (voiceIndex !== -1) {
			voiceSelect.selectedIndex = voiceIndex;
		}
	}
}, 1000);

navigator.mediaDevices
	.enumerateDevices()
	.then((devices) => {
		devices.forEach((device) => {
			if (device.kind === "videoinput") {
				const option = document.createElement("option");
				option.value = device.deviceId;
				option.text =
					device.label || `Camera ${cameraSelect.options.length + 1}`;
				cameraSelect.add(option);
			}
		});
	})
	.catch((error) => {
		show(`Error getting camera devices: ${error}`);
		console.error(`Error getting camera devices: ${error}`);
	});

cameraSelect.addEventListener("change", setCamera);

function setCamera() {
	const selectedCameraId = cameraSelect.value;
	// disable all other media streams
	if (video.srcObject) {
		video.srcObject.getTracks().forEach((track) => track.stop());
	}
	navigator.mediaDevices
		.getUserMedia({
			video: { deviceId: selectedCameraId },
		})
		.then((stream) => {
			video.srcObject = stream;
		})
		.catch((error) => {
			console.error(`Error accessing webcam: ${error}`);
			show(`Error accessing webcam: ${error}`);
		});
}

async function setScreen() {
	// disable all other media streams
	if (video.srcObject) {
		video.srcObject.getTracks().forEach((track) => track.stop());
	}
	try {
		const stream = await navigator.mediaDevices.getDisplayMedia({
			video: true,
			audio: false,
		});
		video.srcObject = stream;
	} catch (error) {
		console.error(`Error accessing screen: ${error}`);
		show(`Error accessing screen: ${error}`);
	}
}

document.querySelector("#screen").addEventListener("click", () => {
	setScreen();
});

document.querySelector("#cam").addEventListener("click", () => {
	setCamera();
});

/* ======================================================================================== */
// UTILITY FUNCTIONS for the Google Generative AI JS SDK
/* ======================================================================================== */

function dataURItoBlob(dataURI) {
	// Thanks to ChatGPT for this
	const byteString = atob(dataURI.split(",")[1]);
	const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
	const arrayBuffer = new ArrayBuffer(byteString.length);
	const uint8Array = new Uint8Array(arrayBuffer);

	for (let i = 0; i < byteString.length; i++) {
		uint8Array[i] = byteString.charCodeAt(i);
	}

	return new Blob([arrayBuffer], { type: mimeString });
}

async function fileToGenerativePart(file) {
	const base64EncodedDataPromise = new Promise((resolve) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result.split(",")[1]);
		reader.readAsDataURL(file);
	});
	return {
		inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
	};
}

/* ======================================================================================== */
// that was a lot of code eh?
/* ======================================================================================== */
