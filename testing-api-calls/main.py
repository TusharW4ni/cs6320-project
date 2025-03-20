from google import genai
from google.genai import types
import pathlib

client = genai.Client(api_key="AIzaSyDZyvxjOGVyI4afjzMFq3BtdkPjNDJMjkI")

# Use the local file directly
filepath = pathlib.Path("blog.txt")

# Ensure the file exists before proceeding
if not filepath.exists():
    raise FileNotFoundError(f"The file {filepath} does not exist.")

prompt = "give me the ingredients list, recipe steps, and any additional tips/notes from this blog post."
response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents=[
        types.Part.from_bytes(
            data=filepath.read_bytes(),
            mime_type="text/plain",
        ),
        prompt,
    ],
)
print(response.text)
