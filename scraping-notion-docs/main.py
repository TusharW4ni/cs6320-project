import yaml  # pip install pyyaml

with open("notion.openapi.yaml") as f:
    spec = yaml.safe_load(f)

responses = spec["paths"]["/blocks/{block_id}/children"]["patch"]["responses"]

for code, info in responses.items():
    print(f"{code}: {info.get('description', '<no desc>')}")
