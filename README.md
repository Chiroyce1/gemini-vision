# gemini-vision

A demo of Google's latest vision based AI model, [gemini-pro-vision](https://deepmind.google/technologies/gemini/).

### Get Started
```bash
git clone https://github.com/Chiroyce1/gemini-vision.git
cd gemini-vision
git checkout server
touch .env
pip install -r requirements.txt
python3 main.py  # Website runs on localhost:8080
```

> Note, this will only work on only `https` or `localhost`, it will not work on `http`. This is due to [MediaDevices](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices) requiring secure contexts.

## API_KEY
You can obtain a free API key for `gemini-vision-pro` from [Google AI Studio](https://ai.google.dev/), then add it to your `.env` file, here is an examle
```bash
API_KEY="your_api_key_here"
```
## Local
`localhost:8080/local` will let users add their own API_KEY to communicate with Google's servers running Gemini Pro, bypassing the flask server. For a purely local experience just use the [static branch](https://github.com/Chiroyce1/gemini-vision).

## Extra
- Yes the UI is wonky, it was just plain HTML yesterday but I decided to make it a bit ✨ pretty ✨ so it looks presentable, feel free to make pull requests for UI improvements.
- Rate limiting is there just in case you deploy a public instance and some bad actor finds it, I think it is 60 requests a second from Google's side, not sure about the quota, so better be on the safe side.
- Any bugs/issues with a specific browser/OS or in general, make an issue [here](https://github.com/Chiroyce1/gemini-vision/issues).
