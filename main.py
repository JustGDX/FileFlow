from builtins import len, str
import webview
import os
import database as db
import logic
import re

class Api:
    def get_initial_data(self):
        return {
            "folders": db.list_folders(),
            "rules": db.list_rules(),
            "activity": db.list_activity(),
            "settings": {
                "theme": db.get_setting("theme", "dark"),
                "collision_strategy": db.get_setting("collision_strategy", "rename")
            }
        }

    def browse_folder(self):
        window = webview.active_window()
        result = window.create_file_dialog(webview.FOLDER_DIALOG)
        if result and len(result) > 0:
            db.add_folder(result[0])
            return db.list_folders()
        return None

    def remove_folder(self, folder_id):
        db.remove_folder(folder_id)
        return db.list_folders()

    def add_rule(self, name, rule_type, operator, values, action, target, priority=100):
        db.add_rule(name, rule_type, operator, values, action, target, priority)
        return db.list_rules()

    def remove_rule(self, rule_id):
        db.remove_rule(rule_id)
        return db.list_rules()

    def get_folder_data(self, folder_path):
        return logic.get_folder_tree(folder_path)

    def clean_now(self, folder_path):
        processed_count = logic.process_clean_now(folder_path)
        return {
            "processed_count": processed_count,
            "activity": db.list_activity(),
            "folder_data": logic.get_folder_tree(folder_path)
        }
    def save_settings(self, theme, collision):
        db.set_setting("theme", theme)
        db.set_setting("collision_strategy", collision)
        return True
        
    def clear_activity(self):
        db.clear_activity()
        return True

    def minimize(self):
        webview.active_window().minimize()

    def close(self):
        webview.active_window().destroy()

    def add_folder_manual(self, path):
        if not os.path.isdir(path):
            return None # Invalid path
        db.add_folder(path)
        return db.list_folders()
    def add_rule(self, name, rule_type, operator, values, action, target, priority=100):
        db.add_rule(name, rule_type, operator, values, action, target, priority)
        return db.list_rules()
    
    def select_target_folder(self):
        window = webview.active_window()
        result = window.create_file_dialog(webview.FOLDER_DIALOG)
        if result and len(result) > 0:
            return result[0]
        return None

    def add_rule(self, name, rule_type, operator, values, action, target, priority=100):
        clean_values = []
        for v in values:
            parts = re.split(r'[,;\s]+', str(v))
            for p in parts:
                p = p.strip().lower()
                if p and p not in clean_values:
                    clean_values.append(p)
                    
        db.add_rule(name, rule_type, operator, clean_values, action, target, priority)
        return db.list_rules()
    def update_rule(self, rule_id, name, rule_type, operator, values, action, target, priority):
        db.update_rule(rule_id, name, rule_type, operator, values, action, target, priority)
        return db.list_rules()

if __name__ == '__main__':
    db.init_db()
    api = Api()
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    html_path = os.path.join(current_dir, 'web', 'index.html')
    # Add the path to your icon
    icon_path = os.path.join(current_dir, 'icon.ico') 
    
    window = webview.create_window(
        title='FileFlow', 
        url=html_path, 
        js_api=api, 
        width=680, 
        height=780, 
        resizable=False,
        background_color='#12141c',
        frameless=True 
    )
    # Start webview and pass the icon parameter
    webview.start()