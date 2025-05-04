import os
import chromadb 

docs_directory = 'notion-docs'
persist_directory = 'chroma_db_default_embeddings' 

client = chromadb.PersistentClient(path=persist_directory)

collection = client.get_or_create_collection("notion_api_docs_default")

documents = []
metadatas = []
ids = []

for i, filename in enumerate(os.listdir(docs_directory)):
    if filename.endswith(".txt"):
        filepath = os.path.join(docs_directory, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            documents.append(content)
            metadatas.append({"source": filename})
            ids.append(f"doc_{i}")

collection.add(
    documents=documents,
    metadatas=metadatas,
    ids=ids
)

print(f"Successfully added {collection.count()} documents to Chroma using the default embedding function (direct).")


query = "How do I create a database?"
results = collection.query(
    query_texts=[query],
    n_results=3
)

print(f"\nQuery: {query}")
print(f"Results: {results['documents']}")