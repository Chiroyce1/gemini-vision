import google.generativeai as genai
from dotenv import load_dotenv
from os import getenv
from flask import Flask, request, render_template
from PIL import Image
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import io

load_dotenv()

genai.configure(api_key=getenv("API_KEY"))
model = genai.GenerativeModel('gemini-pro-vision')
app = Flask(__name__)
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["5/minute"],
    storage_uri="memory://",
)


@app.get('/')
def index():
    return render_template("index.html")


@app.post('/upload')
@limiter.limit("5/minute")
def upload():
    if 'file' not in request.files:
        return {'error': 'No file part'}

    file = request.files['file']
    image_bytes = file.read()
    img = Image.open(io.BytesIO(image_bytes))

    try:
        print("Generating with prompt...")
        print(request.form['prompt'])
        print("-"*20)
        response = model.generate_content([request.form['prompt'], img])
        print("Generated!")
        print(response.text)
        print("-"*20)

        return {'result': response.text}, 200
    except Exception as e:
        return f"Sorry, it looks like an error occured from Google's side. Here is more info:\n{str(e)}\nTry again after a bit.", 500


if __name__ == '__main__':
    app.run(port=8080, debug=True)
