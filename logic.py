import os
import shutil
import database as db
import re
import time
from datetime import datetime

def get_folder_tree(path):
    if not os.path.exists(path):
        return {"files": 0, "dirs": 0, "list": []}
    
    files_count, dirs_count, file_list = 0, 0, []
    
    try:
        with os.scandir(path) as it:
            for entry in it:
                if entry.is_file():
                    files_count += 1
                    file_list.append({"name": entry.name, "current": "(root)", "sub": "-", "path": entry.path})
                elif entry.is_dir():
                    dirs_count += 1
                    try:
                        with os.scandir(entry.path) as sub_it:
                            for sub_entry in sub_it:
                                if sub_entry.is_file():
                                    files_count += 1
                                    file_list.append({"name": sub_entry.name, "current": entry.name, "sub": "-", "path": sub_entry.path})
                    except Exception:
                        pass
    except Exception:
        pass
    return {"files": files_count, "dirs": dirs_count, "list": file_list}

def parse_size(size_str):
    """Converts '10MB' to bytes."""
    size_str = size_str.strip().upper().replace(" ", "")
    match = re.match(r'^([\d.]+)(B|KB|MB|GB)?$', size_str)
    if not match:
        return 0
    num = float(match.group(1))
    unit = match.group(2) or "B"
    multipliers = {"B": 1, "KB": 1024, "MB": 1024**2, "GB": 1024**3}
    return int(num * multipliers[unit])

def process_clean_now(folder_path):
    if not os.path.exists(folder_path): 
        return 0
    
    rules = db.list_rules()
    collision = db.get_setting("collision_strategy", "rename")
    processed_count = 0  # Track how many files actually get moved/copied
    
    for entry in os.scandir(folder_path):
        if not entry.is_file(): continue
        
        matched_rule = None
        for rule in rules:
            if match_file(rule, entry.name, entry.path):
                matched_rule = rule
                break
                
        if not matched_rule:
            db.log_activity(entry.name, "default", "preview", "preview")
            continue
            
        action = matched_rule["action"]
        target = matched_rule["target"]
        
        if action == "preview":
            db.log_activity(entry.name, matched_rule["name"], action, "preview")
            continue
            
        if not target or not os.path.exists(target):
            db.log_activity(entry.name, matched_rule["name"], action, "error")
            continue
            
        dest = os.path.join(target, entry.name)
        
        if os.path.exists(dest):
            if collision == "skip":
                db.log_activity(entry.name, matched_rule["name"], action, "skipped")
                continue
            elif collision == "rename":
                base, ext = os.path.splitext(entry.name)
                i = 1
                while os.path.exists(dest):
                    dest = os.path.join(target, f"{base} ({i}){ext}")
                    i += 1
        
        try:
            if action == "move": 
                shutil.move(entry.path, dest)
            elif action == "copy": 
                shutil.copy2(entry.path, dest)
                
            db.log_activity(entry.name, matched_rule["name"], action, "success")
            processed_count += 1  # Increment on success
        except Exception:
            db.log_activity(entry.name, matched_rule["name"], action, "error")

    return processed_count

def match_file(rule, filename, filepath):
    name_lower = filename.lower()
    
    try:
        stat = os.stat(filepath)
        size = stat.st_size
        age_days = (time.time() - stat.st_mtime) / 86400
    except:
        return False

    # ═════════ AUTO-SPLIT LOGIC PARA SA MGA LUMANG DATA ═════════
    raw_values = rule["values"]
    if isinstance(raw_values, str):
        # Kung string pa rin, hatiin natin
        raw_values = re.split(r'[,;\s]+', raw_values)
    
    # Linisin ang values
    values = [v.lower().strip().replace('*', '') for v in raw_values if v.strip()]

    op = rule["operator"]

    for v in values:
        if rule["type"] == "extension":
            if op == "equals" and name_lower.endswith(v if v.startswith(".") else "." + v):
                return True
            if op == "contains" and (v if v.startswith(".") else "." + v) in name_lower:
                return True
                
        elif rule["type"] == "filename":
            if op == "contains" and v in name_lower: return True
            if op == "equals" and v == name_lower: return True
            if op == "starts" and name_lower.startswith(v): return True
            if op == "ends" and name_lower.endswith(v): return True
            
        elif rule["type"] == "size":
            try:
                target_size = parse_size(v)
                if op == "gt" and size > target_size: return True
                if op == "lt" and size < target_size: return True
                if op == "equals" and size == target_size: return True
            except:
                pass
                
        elif rule["type"] == "date":
            try:
                days = float(v)
                if op == "older_than" and age_days > days: return True
                if op == "newer_than" and age_days < days: return True
            except:
                pass
                
    return False