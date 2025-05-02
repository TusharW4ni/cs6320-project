import requests
from bs4 import BeautifulSoup
import nltk
import re
import os

# Download NLTK tokenizer data
nltk.download("punkt")
nltk.download("punkt_tab")


def fetch_notion_docs(url):
    """
    Fetches the HTML content from the Notion API documentation URL.
    """
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    os.makedirs("notion_docs", exist_ok=True)
    file_path = os.path.join("notion_docs", "notion_docs.html")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(response.text)
    print(f"Saved HTML content to {file_path}")
    return response.text


def extract_text_from_html(html_content):
    """
    Parses HTML content and extracts visible text.
    """
    soup = BeautifulSoup(html_content, "lxml")

    # Remove script and style elements
    for script_or_style in soup(["script", "style"]):
        script_or_style.decompose()

    # Extract text
    text = soup.get_text(separator="\n")

    # Collapse multiple newlines and strip leading/trailing whitespace
    lines = [line.strip() for line in text.splitlines()]
    text = "\n".join(line for line in lines if line)

    return text


def clean_text(text):
    """
    Cleans the extracted text by removing unwanted characters and extra spaces.
    """
    # Remove multiple spaces
    text = re.sub(r"\s+", " ", text)
    file_path = os.path.join("notion_docs", "notion_docs_cleaned.txt")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"Saved cleaned text to {file_path}")
    return text.strip()


def chunk_text(text, max_words=500):
    """
    Splits the text into chunks of approximately max_words words.
    """
    sentences = nltk.sent_tokenize(text)
    chunks = []
    current_chunk = []

    for sentence in sentences:
        current_chunk.append(sentence)
        if len(" ".join(current_chunk).split()) >= max_words:
            chunks.append(" ".join(current_chunk))
            current_chunk = []

    # Add any remaining sentences as a chunk
    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return chunks


def save_chunks_to_files(chunks, output_dir="notion_chunks"):
    """
    Saves each text chunk to a separate file in the specified directory.
    """
    os.makedirs(output_dir, exist_ok=True)
    for idx, chunk in enumerate(chunks):
        file_path = os.path.join(output_dir, f"chunk_{idx+1}.txt")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(chunk)


def main():
    notion_doc_urls = [
        "https://developers.notion.com/docs",
        "https://developers.notion.com/docs/working-with-page-content",
        "https://developers.notion.com/reference/post-page",
        "https://developers.notion.com/reference/retrieve-a-page",
        "https://developers.notion.com/reference/database",
        "https://developers.notion.com/reference/page-property-values",
        # Add more URLs as needed
    ]

    all_chunks = []
    for url in notion_doc_urls:
        print(f"Fetching Notion API documentation from {url}...")
        html_content = fetch_notion_docs(url)

        print("Extracting text from HTML...")
        raw_text = extract_text_from_html(html_content)

        print("Cleaning text...")
        cleaned_text = clean_text(raw_text)

        print("Chunking text...")
        chunks = chunk_text(cleaned_text, max_words=500)

        all_chunks.extend(chunks)

    print(f"Saving {len(all_chunks)} chunks to files...")
    save_chunks_to_files(all_chunks)

    print("Processing complete. Chunks are saved in the 'notion_chunks' directory.")


if __name__ == "__main__":
    # main()
    fetch_notion_docs("https://developers.notion.com/docs/getting-started")
    clean_text("notion_docs/notion_docs.html")
