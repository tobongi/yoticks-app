import json

file_path = r"C:\Users\drama\.codex\sessions\2026\07\06\rollout-2026-07-06T13-38-07-019f3738-82dc-7672-bfc8-b0c96283f006.jsonl"
with open(file_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if "payload" in data:
                payload = data["payload"]
                role = None
                text = ""
                
                # Different JSON structures
                if "role" in payload:
                    role = payload["role"]
                    content = payload.get("content", [])
                elif "message" in payload and isinstance(payload["message"], dict):
                    role = payload["message"].get("role")
                    content = payload["message"].get("content", [])
                else:
                    continue
                
                if role in ["user", "assistant"]:
                    if isinstance(content, list):
                        for c in content:
                            if "text" in c:
                                text += c["text"]
                            elif "type" in c and c["type"] == "text" and "text" in c:
                                text += c["text"]
                    elif isinstance(content, str):
                        text = content
                        
                    print(f"Role: {role}")
                    print(f"Text: {text.strip()[:1000]}")
                    print("-" * 40)
        except json.JSONDecodeError:
            pass
