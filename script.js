import { GoogleGenerativeAI } from "@google/generative-ai";
import { prompts, safetySettings } from "./prompts.js";

/* ======================================================================================== */
// DOM and state management setup
/* ======================================================================================== */

const responseElement = document.getElementById("response");
const cameraSelect = document.getElementById("cameraSelect");
const promptSelect = document.getElementById("promptSelect");
const speakBtn = document.getElementById("speak");
const voiceSelect = document.getElementById("voiceSelect");
const promptInput = document.getElementById("prompt");
const video = document.getElementById("webcam");
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

let active = false; // is the model currently generating a response
let output = ""; // last output
let speaking = false; // is the speechsynthesis currently speaking

speakBtn.style.display = "none";
promptInput.value = `What do you see in this picture? Describe in detail, along with reasoning.`;

const show = (text) => (responseElement.innerText = text);
promptSelect.addEventListener("change", (e) => {
	document.querySelector("#prompt").value = promptSelect.value;
});

document.querySelector("#click").addEventListener("click", captureImage);
prompts.forEach((prompt) => {
	const option = document.createElement("option");
	option.text = prompt.description;
	option.value = prompt["prompt"];
	promptSelect.add(option);
});

document.querySelector("#hide").checked = false;
document.querySelector("#hide").addEventListener("click", () => {
	const state = document.querySelector("#hide").checked;
	if (state) {
		document.querySelector("#settings").style.display = "none";
	} else {
		document.querySelector("#settings").style.display = "";
	}
});

speakBtn.addEventListener("click", () => {
	if (speaking) {
		speechSynthesis.cancel();
		speakBtn.innerText = "Speak";
		speaking = false;
	} else if (output.trim() !== "") {
		speak(output);
	}
});

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
		console.log(voice);
		localStorage.setItem("voice", voice.name);
	} else {
		console.log("Using default voice");
	}
	speakBtn.innerText = "Stop Speaking";
	speakBtn.style.display = "";
	speechSynthesis.speak(utterance);
	utterance.addEventListener("end", () => {
		speakBtn.innerText = "Speak";
		speaking = false;
	});
}

async function captureImage() {
	if (active) return;
	context.drawImage(video, 0, 0, canvas.width, canvas.height);
	const imageDataURL = canvas.toDataURL("image/jpeg");
	const imageFile = new File([dataURItoBlob(imageDataURL)], "image.jpg", {
		type: "image/jpeg",
	});
	const image = await fileToGenerativePart(imageFile);
	const API_KEY = document.querySelector("#api").value;
	if (API_KEY.trim() === "") {
		show("Please provide an API_KEY.");
		return;
	}
	// Top class error handling
	let genAI;
	try {
		genAI = new GoogleGenerativeAI(API_KEY);
	} catch (e) {
		show(`Oops something went wrong.\nError: ${e}`);
	}

	const model = genAI.getGenerativeModel({
		model: "gemini-1.5-flash",
		safetySettings,
	});
	show("Loading... ");
	let res;
	active = true;
	speakBtn.style.display = "none";
	try {
		let start = Date.now();
		res = await model.generateContentStream([promptInput.value, image]);
		let text = "";
		for await (const chunk of res.stream) {
			text += chunk.text();
			show(text);
		}
		output = text;
		show(`${output} [${((Date.now() - start) / 1000).toFixed(1)}s]`);
		speak(text);
	} catch (e) {
		console.error(e);
		show(`Oops something went wrong.\nError: ${e.toString()}`);
		active = false;
		return;
	}

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
		show(`Error enumerating devices: ${error}`);
		console.error(`Error enumerating devices: ${error}`);
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

setCamera();

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
