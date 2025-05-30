// Report Editor Utility Functions

let autoSaveTimeout;

// Make all text content editable
export function setEditingEnabled(enabled) {
    // Toggle text editing
    const editableElements = document.querySelectorAll('p, h1, td, span');
    editableElements.forEach(element => {
        if (!element.querySelector('img')) {
            element.contentEditable = enabled;
            element.style.cursor = enabled ? 'text' : 'default';
            
            // Remove existing event listeners
            element.onmouseover = null;
            element.onmouseout = null;
            
            if (enabled) {
                element.addEventListener('mouseover', function() {
                    this.style.backgroundColor = '#f0f0f0';
                });
                
                element.addEventListener('mouseout', function() {
                    this.style.backgroundColor = '';
                });
            }
        }
    });

    // Toggle section buttons visibility
    const addButtons = document.querySelectorAll('.add-section-btn');
    addButtons.forEach(button => {
        button.style.display = enabled ? 'inline-block' : 'none';
    });

    // Toggle notes management
    const notesContainer = document.getElementById('notesContainer');
    const addNoteBtn = document.getElementById('addNoteBtn');
    if (notesContainer) notesContainer.style.pointerEvents = enabled ? 'auto' : 'none';
    if (addNoteBtn) addNoteBtn.style.display = enabled ? 'block' : 'none';

    // Toggle image controls visibility
    const imageControls = document.querySelectorAll('.image-controls');
    imageControls.forEach(control => {
        control.style.display = 'none';
        const container = control.parentElement;
        if (enabled) {
            container.addEventListener('mouseover', () => control.style.display = 'block');
            container.addEventListener('mouseout', () => control.style.display = 'none');
        } else {
            container.onmouseover = null;
            container.onmouseout = null;
        }
    });

    // Save state to localStorage
    if (enabled) {
        setupAutoSave();
    }
}

export function setupToggleEditingButton() {
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = 'Enable Editing';
    toggleBtn.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 10px 20px;
        background: #2196F3;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        z-index: 1000;
        font-family: Arial, sans-serif;
        font-size: 14px;
    `;

    let editingEnabled = false;
    toggleBtn.onclick = function() {
        editingEnabled = !editingEnabled;
        toggleBtn.textContent = editingEnabled ? 'Disable Editing' : 'Enable Editing';
        toggleBtn.style.background = editingEnabled ? '#f44336' : '#2196F3';
        setEditingEnabled(editingEnabled);
    };

    document.body.appendChild(toggleBtn);
}

export function setupImageControls() {
    // Add controls to each image
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        const container = document.createElement('div');
        container.style.position = 'relative';
        container.style.display = 'inline-block';
        
        // Replace image with container
        img.parentNode.insertBefore(container, img);
        container.appendChild(img);
        
        // Add control buttons
        const controls = document.createElement('div');
        controls.className = 'image-controls';
        controls.style.cssText = `
            position: absolute;
            top: 0;
            right: 0;
            display: none;
            background: rgba(0,0,0,0.5);
            padding: 5px;
            border-radius: 3px;
        `;
        
        // Replace button
        const replaceBtn = createButton('Replace');
        replaceBtn.onclick = () => replaceImage(img);
        
        // Remove button
        const removeBtn = createButton('Remove');
        removeBtn.onclick = () => removeImage(container);
        
        controls.appendChild(replaceBtn);
        controls.appendChild(removeBtn);
        container.appendChild(controls);
    });
}

function createButton(text) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = `
        margin: 0 5px;
        padding: 5px 10px;
        border: none;
        border-radius: 3px;
        background: white;
        cursor: pointer;
    `;
    return button;
}

function replaceImage(img) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                img.src = e.target.result;
                // Trigger save event
                document.dispatchEvent(new Event('imageChanged'));
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

function removeImage(container) {
    if (confirm('Are you sure you want to remove this image?')) {
        container.remove();
        // Trigger save event
        document.dispatchEvent(new Event('imageChanged'));
    }
}

export function showNotification(message, isSuccess = true) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${isSuccess ? '#4CAF50' : '#f44336'};
        color: white;
        border-radius: 5px;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Show and hide notification
    setTimeout(() => {
        notification.style.opacity = '1';
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
    }, 100);
}

export function setupAutoSave() {
    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    editableElements.forEach(element => {
        element.addEventListener('input', () => {
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(saveChanges, 2000);
        });
    });
}

export function saveChanges() {
    try {
        // Get the current content
        const content = document.documentElement.outerHTML;
        
        // Save to localStorage
        localStorage.setItem('savedContent', content);
        localStorage.setItem('lastSaved', new Date().toISOString());
        
        showNotification('Changes saved!');
    } catch (error) {
        console.error('Error saving changes:', error);
        showNotification('Error saving changes!', false);
    }
}

export function loadSavedContent() {
    const savedContent = localStorage.getItem('savedContent');
    if (savedContent) {
        const lastSaved = localStorage.getItem('lastSaved');
        if (lastSaved) {
            showNotification(`Loaded content from ${new Date(lastSaved).toLocaleString()}`);
        }
    }
}

// Add drag and drop functionality for images
document.addEventListener('dragover', function(e) {
    e.preventDefault();
});

document.addEventListener('drop', function(e) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = '200px';
            
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = e.pageX + 'px';
            container.style.top = e.pageY + 'px';
            container.appendChild(img);
            document.body.appendChild(container);
            setupImageControls(); // Refresh image controls
        };
        reader.readAsDataURL(files[0]);
    }
});

export function setupNotesManagement() {
    const notesContainer = document.getElementById('notesContainer');
    const addNoteBtn = document.getElementById('addNoteBtn');

    // Set fixed width for notes container if not already set
    if (notesContainer) {
        notesContainer.style.cssText = `
            width: 100%;
            max-width: 533pt; /* Match the width of other content */
            margin: 0 auto;
            padding: 0;
        `;
    }

    // Add new note when + button is clicked
    addNoteBtn.addEventListener('click', () => {
        const noteCount = notesContainer.children.length;
        const newNoteDiv = document.createElement('div');
        newNoteDiv.className = 'note-item';
        newNoteDiv.setAttribute('data-note-id', noteCount + 1);
        newNoteDiv.style.cssText = `
            display: flex;
            margin-bottom: 10pt;
            position: relative;
            width: 100%;
            box-sizing: border-box;
        `;
        
        newNoteDiv.innerHTML = `
            <span class="note-number" style="
                min-width: 20pt;
                font-weight: bold;
                flex-shrink: 0;
            ">${noteCount + 1}.</span>
            <div class="note-content" style="
                flex-grow: 1;
                flex-shrink: 1;
                min-width: 0;
                width: calc(100% - 40pt);
            ">
                <p style="
                    margin: 0;
                    width: 100%;
                    box-sizing: border-box;
                    word-wrap: break-word;
                " contenteditable="true">New note text</p>
            </div>
            <div class="note-actions" style="
                position: absolute;
                right: 0;
                top: 0;
                display: none;
                background: white;
                border: 1px solid #ccc;
                border-radius: 4px;
                box-shadow: 2px 2px 5px rgba(0,0,0,0.2);
                padding: 5px 0;
                z-index: 1000;
            ">
                <div class="delete-note" style="
                    padding: 8px 15px;
                    cursor: pointer;
                    color: #ff4444;
                    font-family: Arial, sans-serif;
                    font-size: 14px;
                ">Delete Note</div>
            </div>
        `;
        
        notesContainer.appendChild(newNoteDiv);
        setupNoteHandlers(newNoteDiv);
        const editableText = newNoteDiv.querySelector('p');
        if (editableText) editableText.focus();
    });

    // Setup handlers for existing notes
    document.querySelectorAll('.note-item').forEach(note => {
        setupNoteHandlers(note);
    });

    function setupNoteHandlers(noteElement) {
        // Update existing note styling to match new format
        noteElement.style.cssText = `
            display: flex;
            margin-bottom: 10pt;
            position: relative;
            width: 100%;
            box-sizing: border-box;
        `;

        const noteNumber = noteElement.querySelector('.note-number');
        if (noteNumber) {
            noteNumber.style.cssText = `
                min-width: 20pt;
                font-weight: bold;
                flex-shrink: 0;
            `;
        }

        const noteContent = noteElement.querySelector('.note-content');
        if (noteContent) {
            noteContent.style.cssText = `
                flex-grow: 1;
                flex-shrink: 1;
                min-width: 0;
                width: calc(100% - 40pt);
            `;

            const contentText = noteContent.querySelector('p');
            if (contentText) {
                contentText.style.cssText = `
                    margin: 0;
                    width: 100%;
                    box-sizing: border-box;
                    word-wrap: break-word;
                `;
                contentText.addEventListener('input', () => {
                    saveChanges();
                });
            }
        }

        const actionsMenu = noteElement.querySelector('.note-actions') || 
            createActionsMenu(noteElement);

        // Right-click handler
        noteElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            
            // Hide all other action menus
            document.querySelectorAll('.note-actions').forEach(menu => {
                if (menu !== actionsMenu) {
                    menu.style.display = 'none';
                }
            });

            // Position and show this menu
            const rect = noteElement.getBoundingClientRect();
            actionsMenu.style.display = 'block';
            actionsMenu.style.top = '0';
            actionsMenu.style.right = '0';
        });

        // Click outside to close menu
        document.addEventListener('click', (e) => {
            if (!noteElement.contains(e.target)) {
                actionsMenu.style.display = 'none';
            }
        });

        // Setup delete handler
        const deleteButton = actionsMenu.querySelector('.delete-note');
        deleteButton.addEventListener('click', () => {
            noteElement.remove();
            renumberNotes();
            saveChanges();
        });
    }

    function createActionsMenu(noteElement) {
        const actionsMenu = document.createElement('div');
        actionsMenu.className = 'note-actions';
        actionsMenu.style.cssText = `
            position: absolute;
            right: 0;
            top: 0;
            display: none;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-shadow: 2px 2px 5px rgba(0,0,0,0.2);
            padding: 5px 0;
            z-index: 1000;
        `;

        const deleteOption = document.createElement('div');
        deleteOption.className = 'delete-note';
        deleteOption.style.cssText = `
            padding: 8px 15px;
            cursor: pointer;
            color: #ff4444;
            font-family: Arial, sans-serif;
            font-size: 14px;
        `;
        deleteOption.textContent = 'Delete Note';
        deleteOption.addEventListener('mouseover', () => {
            deleteOption.style.backgroundColor = '#f8f8f8';
        });
        deleteOption.addEventListener('mouseout', () => {
            deleteOption.style.backgroundColor = 'transparent';
        });

        actionsMenu.appendChild(deleteOption);
        noteElement.appendChild(actionsMenu);
        return actionsMenu;
    }

    function renumberNotes() {
        document.querySelectorAll('.note-item').forEach((note, index) => {
            note.setAttribute('data-note-id', index + 1);
            note.querySelector('.note-number').textContent = `${index + 1}.`;
        });
    }

    // Also update existing notes structure
    document.querySelectorAll('.note-item').forEach(note => {
        const content = note.querySelector('p').outerHTML;
        note.style.position = 'relative';
        note.innerHTML = `
            <span class="note-number" style="min-width: 20pt; font-weight: bold;">${note.querySelector('.note-number').textContent}</span>
            <div class="note-content" style="flex-grow: 1;">
                ${content}
            </div>
        `;
        setupNoteHandlers(note);
    });
}

export function setupSectionButtons() {
    const addButtons = document.querySelectorAll('.add-section-btn');
    
    addButtons.forEach((button, index) => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Find the report container
            const reportContainer = document.querySelector('.report-container');
            if (!reportContainer) return;

            // Remove any existing dialogs first
            const existingDialog = reportContainer.querySelector('.column-select-dialog');
            if (existingDialog) {
                existingDialog.remove();
            }
            const existingOverlay = reportContainer.querySelector('.dialog-overlay');
            if (existingOverlay) {
                existingOverlay.remove();
            }

            // Create and show column selection dialog
            const dialog = document.createElement('div');
            dialog.className = 'column-select-dialog';
            dialog.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                z-index: 1001;
                min-width: 300px;
                pointer-events: auto;
            `;

            dialog.innerHTML = `
                <h3 style="margin: 0 0 15px 0; font-family: Arial, sans-serif;">Select Column Layout</h3>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button class="col-select-btn" data-cols="1" style="
                        padding: 10px 20px;
                        background: #f0f0f0;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                        cursor: pointer;
                        font-family: Arial, sans-serif;
                    ">Single Column</button>
                    <button class="col-select-btn" data-cols="2" style="
                        padding: 10px 20px;
                        background: #f0f0f0;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                        cursor: pointer;
                        font-family: Arial, sans-serif;
                    ">Two Columns</button>
                </div>
            `;

            // Add overlay
            const overlay = document.createElement('div');
            overlay.className = 'dialog-overlay';
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 1000;
                pointer-events: auto;
            `;

            // Make sure overlay clicks don't propagate
            overlay.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dialog.remove();
                overlay.remove();
            });

            // Add hover effect to buttons
            const buttons = dialog.querySelectorAll('.col-select-btn');
            buttons.forEach(btn => {
                btn.addEventListener('mouseover', () => {
                    btn.style.background = '#e0e0e0';
                });
                btn.addEventListener('mouseout', () => {
                    btn.style.background = '#f0f0f0';
                });
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const cols = parseInt(btn.getAttribute('data-cols'));
                    const section = button.closest('section') || button.parentElement;
                    
                    if (cols === 1) {
                        addSingleColumn(section, index);
                    } else {
                        addTwoColumns(section, index);
                    }

                    // Remove dialog and overlay
                    dialog.remove();
                    overlay.remove();
                });
            });

            // Prevent any click events from bubbling up from the dialog
            dialog.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });

            // Add the dialog and overlay to the report container instead of body
            reportContainer.style.position = 'relative'; // Ensure positioning context
            reportContainer.appendChild(overlay);
            reportContainer.appendChild(dialog);
        });
    });
}

function addSingleColumn(section, sectionIndex) {
    const newParagraph = document.createElement('p');
    newParagraph.style.cssText = `
        padding-left: 113pt;
        text-indent: -93pt;
        line-height: 163%;
        text-align: left;
        padding-top: 3pt;
    `;
    newParagraph.className = 's1';
    newParagraph.contentEditable = true;
    
    if (sectionIndex === 0) {
        // For Test Report section
        newParagraph.textContent = 'New Test Report Information';
        // Find the table and company address paragraph
        const table = document.querySelector('.client-details-table');
        const companyAddress = table.nextElementSibling;
        // Insert before company address
        if (table && companyAddress) {
            table.parentNode.insertBefore(newParagraph, companyAddress);
        }
    } else {
        // For Chemical Analysis section
        newParagraph.textContent = 'New Chemical Analysis Information';
        // Find the material details table and test method heading
        const materialTable = document.querySelector('.material-details-table');
        const testMethodHeading = document.querySelector('h1[style*="padding-left: 244pt"]');
        
        if (materialTable && testMethodHeading) {
            // Insert before test method heading
            materialTable.parentNode.insertBefore(newParagraph, testMethodHeading);
        }
    }
}

function addTwoColumns(section, sectionIndex) {
    // Find the correct table based on section
    let targetTable;
    if (sectionIndex === 0) {
        // For Test Report section
        targetTable = document.querySelector('.client-details-table');
        
        if (targetTable) {
            const newRow = document.createElement('tr');
            newRow.style.height = '17pt';
            newRow.innerHTML = `
                <td style="width: 324pt">
                    <p class="s1" style="padding-left: 2pt; text-indent: 0pt; line-height: 12pt; text-align: left;" contenteditable="true">
                        New Field : Value
                    </p>
                </td>
                <td style="width: 209pt">
                    <p class="s1" style="padding-left: 74pt; text-indent: 0pt; line-height: 12pt; text-align: left;" contenteditable="true">
                        Additional Info
                    </p>
                </td>
            `;
            // Append to client details table
            targetTable.appendChild(newRow);
        }
    } else {
        // For Chemical Analysis section
        targetTable = document.querySelector('.material-details-table');
        if (!targetTable) {
            console.error('Material details table not found');
            return;
        }

        // Find the Test Method row (last row) in the material details table
        const rows = targetTable.querySelectorAll('tr');
        const testMethodRow = Array.from(rows).find(row => {
            const text = row.textContent.trim();
            return text.includes('Test Method');
        });

        if (testMethodRow) {
            const newRow = document.createElement('tr');
            newRow.style.height = '17pt';
            newRow.innerHTML = `
                <td style="width: 350pt">
                    <p class="s1" style="padding-left: 2pt; text-indent: 0pt; line-height: 12pt; text-align: left;" contenteditable="true">
                        New Parameter : Value
                    </p>
                </td>
                <td style="width: 350pt">
                    <p class="s1" style="padding-left: 5pt; text-indent: 0pt; line-height: 12pt; text-align: left;" contenteditable="true">
                        Additional Info
                    </p>
                </td>
            `;

            // Insert the new row before the Test Method row
            testMethodRow.parentNode.insertBefore(newRow, testMethodRow);
        }
    }
} 