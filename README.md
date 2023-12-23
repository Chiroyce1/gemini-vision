# gemini-vision

A demo of Google's latest vision based AI model, [gemini-vision-pro](https://deepmind.google/technologies/gemini/).

### Get Started
```bash
git clone https://github.com/Chiroyce1/gemini-vision.git
cd gemini-vision
touch .env  # add your API_KEY here
pip install -r requirements.txt
python3 main.py  # Will listen on localhost:8080
```

### API_KEY
You can obtain a free API key for `gemini-vision-pro` from [Google AI Studio](https://ai.google.dev/), then add it to your `.env` file, here is an examle
```bash
API_KEY="your_api_key_here"
```

## Public Instance?
No, run it yourself. Or use [codespaces](https://github.com/codespaces/new?hide_repo_select=true&ref=main&repo=734611556)! 

## Extra
- Yes the UI is wonky, it was just plain HTML yesterday but I decided to make it a bit ✨ pretty ✨ so it looks presentable to show to people, so feel free to make pull requests for UI improvements.
- Rate limiting is there just in case you deploy a public instance and some bad actor finds it, I think it is 60 requests a second from Google's side, not sure about the quota, so better be on the safe side.
- Any bugs/issues with a specific browser/OS or in general, make an issue [here](https://github.com/Chiroyce1/gemini-vision/issues).