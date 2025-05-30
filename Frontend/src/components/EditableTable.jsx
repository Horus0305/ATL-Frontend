import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export default function EditableTable({ htmlContent, onSave }) {
  const containerRef = useRef(null);
  const [editingEnabled, setEditingEnabled] = useState(false);
  const [modifiedHtml, setModifiedHtml] = useState(htmlContent);

  useEffect(() => {
    if (containerRef.current) {
      // Initialize the container with HTML content
      // Extract and display just the table if possible
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, "text/html");

        // Try to find a table in the HTML
        const table = doc.querySelector("table");

        if (table) {
          // Only use the table part for editing to avoid duplicating headings
          containerRef.current.innerHTML = table.outerHTML;
        } else {
          // If no table is found, use the full HTML (fallback)
          containerRef.current.innerHTML = htmlContent;
        }
      } catch (error) {
        
        containerRef.current.innerHTML = htmlContent;
      }

      // Setup editable elements
      setupEditableElements();
    }
  }, [htmlContent]);

  useEffect(() => {
    // Re-apply editing mode when it changes
    if (containerRef.current) {
      setContentEditable(editingEnabled);
    }
  }, [editingEnabled]);

  const setupEditableElements = () => {
    if (!containerRef.current) return;

    // Initially disable editing
    setContentEditable(false);
  };

  const setContentEditable = (enabled) => {
    if (!containerRef.current) return;

    // Toggle text editing
    const editableElements =
      containerRef.current.querySelectorAll("p, h1, td, span");
    editableElements.forEach((element) => {
      if (!element.querySelector("img")) {
        element.contentEditable = enabled;
        element.style.cursor = enabled ? "text" : "default";

        // Remove existing event listeners
        element.onmouseover = null;
        element.onmouseout = null;

        if (enabled) {
          element.addEventListener("mouseover", function () {
            this.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
            this.style.transition = "background-color 0.2s";
          });

          element.addEventListener("mouseout", function () {
            this.style.backgroundColor = "";
            this.style.transition = "background-color 0.2s";
          });
        }
      }
    });
  };

  const toggleEditing = () => {
    setEditingEnabled(!editingEnabled);
  };

  const handleSave = () => {
    // Get updated HTML content
    const updatedContent = containerRef.current.innerHTML;
    setModifiedHtml(updatedContent);

    // Call the onSave callback with updated content
    if (onSave) {
      onSave(updatedContent);
    }

    // Disable editing mode
    setEditingEnabled(false);
  };

  return (
    <div className="relative">
      {/* Editing Controls */}
      <div className="flex gap-2 justify-end mb-4">
        <Button
          onClick={toggleEditing}
          variant={editingEnabled ? "outline" : "default"}
          className={
            editingEnabled ? "":"text-white bg-black hover:bg-black/90"
          }
        >
          {editingEnabled ? "Disable Editing" : "Enable Editing"}
        </Button>

        {editingEnabled && (
          <Button
            onClick={handleSave}
            className="px-4 py-2 text-white bg-black rounded-md"
          >
            Save Changes
          </Button>
        )}
      </div>

      {/* HTML Container */}
      <div
        ref={containerRef}
        className="overflow-auto p-4 rounded-md border table-container"
      ></div>
    </div>
  );
}
