let appData = { folders: [], rules: [], activity: [], settings: {} };
let currentTree = null;

// ═════════ INITIALIZATION ═════════
window.addEventListener('pywebviewready', async () => {
    appData = await window.pywebview.api.get_initial_data();
    
    if (appData.settings.theme === 'light') document.body.classList.add('light-mode');
    document.getElementById('themeToggle').checked = (appData.settings.theme === 'dark');
    
    const radio = document.querySelector(`input[name="collisionStrategy"][value="${appData.settings.collision_strategy}"]`);
    if (radio) radio.checked = true;

    renderAll();
    updateOps();
});

function renderAll() {
    updateStats();
    populateDropdown();
    renderFoldersTable();
    renderRulesTable();
    renderActivityList();
}

// ═════════ NOTIFICATIONS & MODAL ═════════
function showToast(msg, type = "") {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast show ${type}`;
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}

function showModal(title, desc) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalDesc').innerHTML = desc;
    document.getElementById('alertModal').classList.add('show');
}

function closeModal() {
    document.getElementById('alertModal').classList.remove('show');
}

// ═════════ GENERAL UI UPDATES ═════════
function updateStats() {
    document.getElementById('statFolders').textContent = appData.folders.length;
    document.getElementById('statRules').textContent = appData.rules.length;
    document.getElementById('statActions').textContent = appData.activity.length;
}

function populateDropdown() {
    const sel = document.getElementById('watchFolderSelector');
    const currentVal = sel.value;
    
    sel.innerHTML = '<option value="" disabled>No folder selected</option>';
    appData.folders.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.path;
        opt.textContent = f.path;
        sel.appendChild(opt);
    });

    if (currentVal && appData.folders.some(f => f.path === currentVal)) {
        sel.value = currentVal;
    } else {
        sel.value = "";
        document.getElementById('selectedPathDisplay').textContent = "— No folder selected —";
        document.getElementById('selectedPathDisplay').classList.add('none');
        document.getElementById('selectedMeta').textContent = "";
        document.getElementById('cleanNowBtn').disabled = true;
        document.getElementById('subfolderList').innerHTML = `
            <div class="no-subfolders">
                <div class="big">📁</div>
                <p>Select a watch folder from the dropdown above.</p>
            </div>`;
    }
}

// ═════════ DASHBOARD (Main View) ═════════
async function onFolderSelect(path) {
    if (!path) return;
    document.getElementById('selectedPathDisplay').textContent = path;
    document.getElementById('selectedPathDisplay').classList.remove('none');
    document.getElementById('cleanNowBtn').disabled = false;

    currentTree = await window.pywebview.api.get_folder_data(path);
    renderDashboardTable(currentTree.list, path, currentTree.files, currentTree.dirs);
}

async function clickCleanNow() {
    const path = document.getElementById('watchFolderSelector').value;
    if (!path) return;

    document.getElementById('statusText').textContent = "Cleaning... please wait.";
    
    const result = await window.pywebview.api.clean_now(path);
    appData.activity = result.activity;
    
    currentTree = result.folder_data;
    renderDashboardTable(currentTree.list, path, currentTree.files, currentTree.dirs);
    updateStats();
    renderActivityList();
    
    document.getElementById('statusText').textContent = "Ready.";

    if (result.processed_count === 0) {
        showModal(
            "Nothing to Clean", 
            "No files match your current cleaning rules in the selected folder.<br><br>Add a new rule to organize files in this folder, or adjust your existing rules to match more files."
        );
    } else {
        showToast(`Clean Now complete! ${result.processed_count} files processed.`, "success");
    }
}

function renderDashboardTable(files, rootPath, fileCount, dirCount) {
    const listContainer = document.getElementById('subfolderList');
    listContainer.innerHTML = '';
    
    const rootName = rootPath.split('\\').pop();
    document.getElementById('selectedMeta').innerHTML = `Files: <b>${fileCount}</b> · Folders: <b>${dirCount}</b>`;

    if (files.length === 0) {
        listContainer.innerHTML = `<div class="no-subfolders"><div class="big">📭</div><p>This folder is empty.</p></div>`;
        return;
    }

    files.forEach(f => {
        let icon = "📄";
        if (f.name.match(/\.(jpg|jpeg|png|gif)$/i)) icon = "🖼️";
        if (f.name.match(/\.(zip|rar|7z)$/i)) icon = "🗜️";
        if (f.name.match(/\.(mp4|mov|avi)$/i)) icon = "🎬";
        
        const isRoot = f.current === "(root)";
        const currDisplay = isRoot ? `${rootName} (root)` : f.current;
        const subDisplay = f.sub === "-" ? "-" : f.sub;

        listContainer.innerHTML += `
            <div class="file-row">
                <div class="file-col-name" title="${f.name}" style="overflow:hidden; white-space:nowrap; text-overflow:ellipsis; display:block;">
                    <span class="icon">${icon}</span> ${f.name}
                </div>
                <div class="file-col-folder">${currDisplay}</div>
                <div class="file-col-subfolders ${subDisplay === '-' ? 'none' : ''}">${subDisplay}</div>
            </div>
        `;
    });
}

// ═════════ SETTINGS NAVIGATION ═════════
function toggleSettings() {
    document.getElementById('settingsOverlay').classList.toggle('show');
}

function switchTab(tabId, el) {
    document.querySelectorAll('.sp-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.sp-pane').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    document.getElementById(`sp-pane-${tabId}`).classList.add('active');
}

// ═════════ WATCH FOLDERS TAB ═════════
async function addFolderManual() {
    const input = document.getElementById('folderPathInput').value.trim();
    if (!input) return showToast("Please enter a folder path.", "error");
    
    const folders = await window.pywebview.api.add_folder_manual(input);
    if (folders) {
        appData.folders = folders;
        document.getElementById('folderPathInput').value = '';
        populateDropdown();
        renderFoldersTable();
        updateStats();
        showToast("Folder added successfully.", "success");
    } else {
        showToast("Failed to add folder. Check the path.", "error");
    }
}

async function browseAddFolder() {
    const folders = await window.pywebview.api.browse_folder();
    if (folders) {
        appData.folders = folders;
        populateDropdown();
        renderFoldersTable();
        updateStats();
        showToast("Folder added successfully.", "success");
    }
}

async function renderFoldersTable() {
    const tbody = document.getElementById('foldersBody');
    tbody.innerHTML = '';
    
    if (appData.folders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--fg-dim); padding:16px;">No folders yet.</td></tr>`;
        return;
    }

    for (const f of appData.folders) {
        const tree = await window.pywebview.api.get_folder_data(f.path);
        tbody.innerHTML += `
            <tr>
                <td>${f.id}</td>
                <td style="font-family:Consolas; font-size:10px; word-wrap: break-word;">${f.path}</td>
                <td style="text-align:center;">${tree.files}</td>
                <td style="text-align:center;">${tree.dirs}</td>
                <td style="text-align:center;"><button class="btn danger" onclick="removeFolder(${f.id})" style="padding:2px 6px; font-size:9px; border:none; background:transparent; color:var(--danger);">✕</button></td>
            </tr>
        `;
    }
}

async function removeFolder(id) {
    appData.folders = await window.pywebview.api.remove_folder(id);
    populateDropdown();
    renderFoldersTable();
    updateStats();
}

// ═════════ RULES TAB ═════════
function updateOps() {
    const type = document.getElementById('ruleType').value;
    const ops = document.getElementById('ruleOperator');
    
    if (type === 'extension') {
        ops.innerHTML = '<option value="equals">equals</option><option value="contains">contains</option>';
    } else if (type === 'filename') {
        ops.innerHTML = '<option value="contains">contains</option><option value="equals">equals</option><option value="starts">starts</option><option value="ends">ends</option>';
    } else if (type === 'size') {
        ops.innerHTML = '<option value="gt">gt (greater than)</option><option value="lt">lt (less than)</option><option value="equals">equals</option>';
    } else if (type === 'date') {
        ops.innerHTML = '<option value="older_than">older_than_days</option><option value="newer_than">newer_than_days</option>';
    }
}

async function browseTargetFolder() {
    const path = await window.pywebview.api.select_target_folder();
    if (path) {
        document.getElementById('ruleTarget').value = path;
    }
}

function clearRuleForm() {
    document.getElementById('editRuleId').value = '';
    document.getElementById('ruleName').value = '';
    document.getElementById('ruleValue').value = '';
    document.getElementById('ruleTarget').value = '';
    document.getElementById('rulePriority').value = '50';
    document.getElementById('addRuleBtn').textContent = '+ Add Rule';
    document.getElementById('addRuleBtn').classList.add('accent');
}

function editRule(ruleId) {
    const rule = appData.rules.find(r => r.id === ruleId);
    if (!rule) return;

    document.getElementById('editRuleId').value = rule.id;
    document.getElementById('ruleName').value = rule.name;
    document.getElementById('ruleType').value = rule.type;
    updateOps(); 
    document.getElementById('ruleOperator').value = rule.operator;
    document.getElementById('ruleValue').value = rule.values.join(', ');
    document.getElementById('ruleAction').value = rule.action;
    document.getElementById('ruleTarget').value = rule.target;
    
    const p = rule.priority;
    if (p <= 10) document.getElementById('rulePriority').value = "1";
    else if (p <= 50) document.getElementById('rulePriority').value = "50";
    else document.getElementById('rulePriority').value = "100";

    const btn = document.getElementById('addRuleBtn');
    btn.textContent = 'Update Rule';
    btn.classList.remove('accent');

    document.querySelector('.sp-content').scrollTo({ top: 0, behavior: 'smooth' });
}

async function saveRule() {
    const editId = document.getElementById('editRuleId').value;
    const name = document.getElementById('ruleName').value;
    const type = document.getElementById('ruleType').value;
    const op = document.getElementById('ruleOperator').value;
    const val = document.getElementById('ruleValue').value;
    const action = document.getElementById('ruleAction').value;
    const target = document.getElementById('ruleTarget').value;
    const priority = document.getElementById('rulePriority').value;

    if (!name || !val) {
        return showToast("Rule Name and Value are required.", "error");
    }

    const splitByComma = val.split(',');
    let missingComma = false;
    for (let item of splitByComma) {
        if (item.trim().includes(' ')) { missingComma = true; break; }
    }
    if (missingComma) {
        showToast("Reminder: Please use a comma (,) to separate multiple values.", "error");
        return; 
    }

    const values = val.split(',').map(v => v.trim()).filter(v => v);
    
    if (editId) {
        appData.rules = await window.pywebview.api.update_rule(parseInt(editId), name, type, op, values, action, target, parseInt(priority));
        showToast("Rule updated successfully.", "success");
    } else {
        appData.rules = await window.pywebview.api.add_rule(name, type, op, values, action, target, parseInt(priority));
        showToast("Rule added successfully.", "success");
    }
    
    renderRulesTable();
    updateStats();
    clearRuleForm();
}

function renderRulesTable() {
    const tbody = document.getElementById('rulesBody');
    tbody.innerHTML = '';
    
    if (appData.rules.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--fg-dim); padding:16px;">No rules yet.</td></tr>`;
        return;
    }

    const getPriorityText = (p) => {
        if (p <= 10) return "High";
        if (p <= 50) return "Medium";
        return "Low";
    };

    appData.rules.forEach(r => {
        const fullValues = r.values.join(', ');
        let displayValue = r.values[0] || "";
        if (r.values.length > 1) {
            displayValue += ` +${r.values.length - 1}`;
        }

        const tag = `<span title="${fullValues}" style="background:rgba(79,140,255,.2); color:var(--accent); padding:2px 6px; border-radius:10px; font-size:9px; font-family:Consolas; cursor:help;">${displayValue}</span>`;
        
        tbody.innerHTML += `
            <tr>
                <td>${r.id}</td>
                <td>${r.name}</td>
                <td>${tag}</td>
                <td>${r.action}</td>
                <td>${getPriorityText(r.priority)}</td>
                <td style="text-align: center;">
                    <div style="display: flex; gap: 4px; justify-content: center;">
                        <button class="btn" onclick="editRule(${r.id})" style="padding: 2px; font-size: 11px; color: var(--accent); background: transparent;" title="Edit">✏️</button>
                        <button class="btn danger" onclick="removeRule(${r.id})" style="padding: 2px; font-size: 11px; background: transparent; color: var(--danger);" title="Delete">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    });
}

async function removeRule(id) {
    appData.rules = await window.pywebview.api.remove_rule(id);
    renderRulesTable();
    updateStats();
}

// ═════════ ACTIVITY TAB ═════════
async function clearActivity() {
    await window.pywebview.api.clear_activity();
    appData.activity = [];
    renderActivityList();
    updateStats();
}

function renderActivityList() {
    const filter = document.getElementById('activityFilter').value;
    const tbody = document.getElementById('activityBody');
    tbody.innerHTML = '';
    
    const filtered = appData.activity.filter(a => filter === 'all' || a.status === filter);

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--fg-dim); padding:16px;">No activity yet.</td></tr>`;
        return;
    }

    filtered.forEach(a => {
        const statusClass = ['success', 'preview', 'error', 'skipped'].includes(a.status) ? a.status : '';

        tbody.innerHTML += `
            <tr>
                <td style="font-family:Consolas; font-size:10px;">${a.time}</td>
                <td style="font-family:Consolas; font-size:10px; word-break:break-all;" title="${a.filename}">${a.filename}</td>
                <td>${a.rule}</td>
                <td>${a.action}</td>
                <td><span class="pill ${statusClass}">${a.status}</span></td>
            </tr>
        `;
    });
}

// ═════════ PREFERENCES TAB ═════════
function toggleTheme(checkbox) {
    document.body.classList.toggle('light-mode', !checkbox.checked);
    savePrefs();
}

function savePrefs() {
    const theme = document.getElementById('themeToggle').checked ? 'dark' : 'light';
    const collision = document.querySelector('input[name="collisionStrategy"]:checked').value;
    window.pywebview.api.save_settings(theme, collision);
}