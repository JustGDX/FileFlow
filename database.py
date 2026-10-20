import json
import os
import threading
import sys
from datetime import datetime

# ═════════ SMART PATH DETECTOR PARA SA EXE ═════════
if getattr(sys, 'frozen', False):
    # Kung naka-compile na as EXE, kunin yung folder kung saan nandoon yung EXE
    BASE_DIR = os.path.dirname(sys.executable)
else:
    # Kung naka-run via python main.py, kunin yung folder ng script
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_FILE = os.path.join(BASE_DIR, "fileflow_data.json")
_lock = threading.Lock()

_DEFAULT_DATA = {
    "settings": {"theme": "dark", "collision_strategy": "rename"},
    "folders": [],
    "rules": [],
    "activity": [],
    "_next_folder_id": 1,
    "_next_rule_id": 1,
}

def init_db():
    if not os.path.exists(DATA_FILE):
        _save(_DEFAULT_DATA)

def _load():
    if not os.path.exists(DATA_FILE):
        return json.loads(json.dumps(_DEFAULT_DATA))
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return json.loads(json.dumps(_DEFAULT_DATA))

def _save(data):
    try:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error saving data: {e}")

def get_setting(key, default=None):
    with _lock:
        return _load()["settings"].get(key, default)

def set_setting(key, value):
    with _lock:
        data = _load()
        data["settings"][key] = str(value)
        _save(data)

def add_folder(path):
    path = os.path.abspath(path)
    with _lock:
        data = _load()
        if not any(f["path"] == path for f in data["folders"]):
            data["folders"].append({
                "id": data["_next_folder_id"],
                "path": path,
                "created_at": datetime.now().strftime("%Y-%m-%d %H:%M")
            })
            data["_next_folder_id"] += 1
            _save(data)

def remove_folder(folder_id):
    with _lock:
        data = _load()
        data["folders"] = [f for f in data["folders"] if f["id"] != folder_id]
        _save(data)

def list_folders():
    with _lock:
        return _load()["folders"]

def add_rule(name, rule_type, operator, values, action, target, priority=100):
    with _lock:
        data = _load()
        data["rules"].append({
            "id": data["_next_rule_id"],
            "name": name,
            "type": rule_type,
            "operator": operator,
            "values": values,
            "action": action,
            "target": target,
            "priority": priority
        })
        data["_next_rule_id"] += 1
        _save(data)

def remove_rule(rule_id):
    with _lock:
        data = _load()
        data["rules"] = [r for r in data["rules"] if r["id"] != rule_id]
        _save(data)

def list_rules():
    with _lock:
        return sorted(_load()["rules"], key=lambda x: x["priority"])

def log_activity(filename, rule_name, action, status):
    with _lock:
        data = _load()
        data["activity"].insert(0, {
            "time": datetime.now().strftime("%H:%M:%S"),
            "filename": filename,
            "rule": rule_name,
            "action": action,
            "status": status
        })
        data["activity"] = data["activity"][:100] # Keep last 100
        _save(data)

def list_activity():
    with _lock:
        return _load()["activity"]

def clear_activity():
    with _lock:
        data = _load()
        data["activity"] = []
        _save(data)
def update_rule(rule_id, name, rule_type, operator, values, action, target, priority):
    with _lock:
        data = _load()
        for r in data["rules"]:
            if r["id"] == rule_id:
                r["name"] = name
                r["type"] = rule_type
                r["operator"] = operator
                r["values"] = values
                r["action"] = action
                r["target"] = target
                r["priority"] = priority
                break
        _save(data)