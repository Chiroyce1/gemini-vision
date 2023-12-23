const responseElement = document.getElementById("response");
const cameraSelect = document.getElementById("cameraSelect");
const promptInput = document.getElementById("prompt");
const video = document.getElementById("webcam");
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
let active = false;

promptInput.value = `What do you see in this picture? Describe in detail, along with reasoning.`;

navigator.mediaDevices
  .enumerateDevices()
  .then((devices) => {
    devices.forEach((device) => {
      if (device.kind === "videoinput") {
        console.log(device);
        const option = document.createElement("option");
        option.value = device.deviceId;
        option.text =
          device.label || `Camera ${cameraSelect.options.length + 1}`;
        cameraSelect.add(option);
      }
    });
  })
  .catch((error) => {
    console.error("Error enumerating devices:", error);
    responseElement.innerText =
      "Error getting MediaDevices: " + error.toString();
  });

function setCamera() {
  const selectedCameraId = cameraSelect.value;
  navigator.mediaDevices
    .getUserMedia({
      video: { deviceId: selectedCameraId },
    })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((error) => {
      console.error("Error accessing webcam:", error);
      responseElement.innerText = "Error accessing webcam: " + error.toString();
    });
}

async function captureImage() {
  if (active) return;
  active = true;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageDataURL = canvas.toDataURL("image/jpeg");
  const formData = new FormData();
  formData.append("file", dataURItoBlob(imageDataURL), "webcam_image.jpg");
  formData.append("prompt", promptInput.value);

  responseElement.innerText = "Loading... (this can take upto 30s)";
  let res;
  try {
    res = await fetch("/upload", {
      method: "POST",
      body: formData,
    });
  } catch (e) {
    console.error(e);
    responseElement.innerText = `Oops something went wrong on our end. Please try again later.\nError: ${e.toString()}`;
    return;
  }
  if (res.status !== 200) {
    responseElement.innerText = await res.text();
  }
  res = await res.json();
  responseElement.innerText = res.result;
  active = false;
}

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

setCamera();
cameraSelect.addEventListener("change", setCamera);
