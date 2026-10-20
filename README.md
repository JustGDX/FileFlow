# FileFlow

A lightweight, manual file organization tool built with Python and PyWebView. FileFlow features a sleek, frameless HTML/CSS/JavaScript interface designed to feel like a native Windows desktop application.

All settings, folders, rules, and activity history are stored locally in a simple `fileflow_data.json` file. No database is required.

## Overview

FileFlow helps you organize your files safely and manually. Instead of running in the background and moving files without your knowledge, FileFlow waits for you to click **Clean Now**.

The application scans the root directory of your selected Watch Folder, matches files against your custom rules, and moves or copies matching files to their designated Target Folders.

Files that do not match any rule are logged as **Preview** and remain completely untouched.

### Key Features

- **Manual File Organization** — Organize files with a single click.
- **Custom Rules** — Sort files by extension, filename, size, or date.
- **Smart Priorities** — Use High, Medium, and Low priorities to control which rule runs first.
- **Rule Management** — Easily Edit (✏️) or Delete (🗑️) existing rules without retyping them.
- **Multi-Type Support** — Add multiple extensions to a single rule (e.g., `.pdf, .docx, .csv`).
- **Watch Folder** — Select the folder you want to organize.
- **Target Folders** — Choose where matching files should go using a native folder picker.
- **Move or Copy** — Choose how files are handled.
- **Preview Mode** — Leave unmatched files untouched.
- **Activity History** — Review previous organization activities with color-coded statuses.
- **Custom File Types** — Add and save custom file extensions.
- **Dark and Light Themes** — Switch between themes seamlessly.
- **Local JSON Storage** — Store settings and rules without a database.
- **Collision Protection** — Prevent files from accidentally overwriting existing files (Rename, Skip, or Overwrite).

## Tech Stack

| Component | Technology |
|---|---|
| Frontend UI | HTML5, CSS3, Vanilla JavaScript |
| Backend | Python 3.9+ |
| Desktop Window | [PyWebView](https://pywebview.flowrl.com/) |
| Data Storage | JSON |
| Packaging | PyInstaller |

## Project Structure

```text
FileFlow/
│
├── main.py              # Python backend, desktop window, and API bridge
├── database.py          # JSON data storage and management (Smart EXE pathing)
├── logic.py             # File scanning, rule matching, and file operations
├── requirements.txt     # Python dependencies
├── icon.ico             # Application icon (optional)
├── README.md            # Project documentation
│
└── web/
    ├── index.html       # Application interface
    ├── style.css        # Styling, themes, tooltips, and modals
    └── app.js           # Frontend logic and Python API communication
Requirements
Before running FileFlow, make sure you have the following installed:

Python 3.9 or higher

Microsoft Edge WebView2 Runtime — Required by PyWebView on Windows (Pre-installed on Windows 10/11).

PyInstaller — Only required if you want to package the application as an executable.

Setup and Installation
1. Download the Project
Clone or download the FileFlow repository to your computer.

If using Git, run:

bash
git clone <repository-url>
Navigate to the project directory:

bash
cd FileFlow
2. Install Dependencies
Install the required Python packages:

bash
py -m pip install -r requirements.txt
If the py command is unavailable, try:

bash
python -m pip install -r requirements.txt
3. Run FileFlow
Start the application using:

bash
python main.py
Alternatively:

bash
py main.py
How to Use
Add a Watch Folder — Choose the directory containing the files you want to organize.

Create a Rule — Set conditions based on file extensions, filenames, sizes, or dates. (Remember to use commas for multiple types).

Choose a Target Folder — Specify where matching files should be moved or copied.

Set Priority — Choose High, Medium, or Low to tell FileFlow which rule should take precedence.

Click Clean Now — Run the organization process manually.

Check Activity History — Review the results and see which files were processed.

Files that do not match any rule are left untouched. If no files match, a sleek modal will remind you to adjust your rules.

Building FileFlow into an EXE
You can package FileFlow as a standalone Windows executable using PyInstaller.

1. Install PyInstaller
bash
py -m pip install pyinstaller
2. Build the Executable
Run the following command from the project directory:

bash
py -m PyInstaller --noconsole --onefile --add-data "web;web" --icon=icon.ico --name FileFlow main.py
Note: If you do not have an icon.ico file, remove the --icon=icon.ico argument.

3. Locate the Executable
After the build finishes, your executable will be available at:

text
FileFlow/
└── dist/
    └── FileFlow.exe
You can run FileFlow.exe without manually launching main.py. Test the packaged application before distributing it to other computers.

Data Storage
FileFlow stores its application data locally in:

text
fileflow_data.json
When running as an .exe, this file is created in the exact same folder as your FileFlow.exe file, ensuring your data is never lost.

The file contains:

Application settings and theme preferences

Watch Folder paths

Custom organization rules and priorities

Custom file extensions

Activity history

No SQLite database or external database server is required.

Important: Keep a backup of your JSON data file if you want to preserve your settings and activity history.

Safety
FileFlow is designed to give users absolute control over their files.

File organization runs only when the user initiates it via the "Clean Now" button.

Files that do not match any rule remain completely untouched.

Existing files are protected against accidental overwriting via the Collision Strategy settings.

Review your rules and target folders before clicking Clean Now.

Back up important files before performing large-scale file operations.

License
No license has been specified yet. Add a license before distributing or publishing the project if you want to define how others may use, modify, or redistribute it.
-----------------------
Author: JustGDX