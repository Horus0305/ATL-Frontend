import { useEffect, useRef, useState } from "react";
import Handsontable from "handsontable";
import "handsontable/styles/handsontable.css";
import "handsontable/styles/ht-theme-main.css";

function HandsTable({ showTable, test, onDataChange }) {
  const containerRef = useRef(null);
  const [hotInstance, setHotInstance] = useState(null);

  // Define generateInitialData first
  const generateInitialData = () => {
    // Get test names from test.tests array and capitalize first letter
    const testNames =
      test?.tests?.map((t) => {
        const name = t.test;
        return name.charAt(0).toUpperCase() + name.slice(1);
      }) || [];

    // Create data array with rows equal to number of tests plus one empty row at top
    const numRows = (testNames.length || 1) + 1; // Add 1 for the empty row at top
    const data = Array(numRows)
      .fill()
      .map(() => Array(5).fill("")); // Increased to 5 columns to add empty column at left

    // Fill second column with capitalized test names starting from second row
    testNames.forEach((name, index) => {
      data[index + 1][1] = name; // Shifted to column 1 (second column) to leave first column empty
    });

    return data;
  };

  const [columnHeaders, setColumnHeaders] = useState([]);
  const [mergedCells, setMergedCells] = useState([]);
  const [columnWidths, setColumnWidths] = useState([]);
  const [rowHeights, setRowHeights] = useState([]);
  const [tableState, setTableState] = useState({
    data: generateInitialData(),
    mergedCells: [],
    headers: [],
  });

  // Function to generate column headers
  function generateColumnHeaders(columnsCount) {
    const headers = ["Tests"];
    for (let i = 1; i < columnsCount; i++) {
      headers.push(`Column ${i}`);
    }
    return headers;
  }

  useEffect(() => {
    if (!containerRef.current || !showTable) return;

    const hot = new Handsontable(containerRef.current, {
      data: tableState.data,
      height: 600,
      width: "100%",
      stretchH: "all",
      colWidths: 150,
      rowHeights: 40,
      autoRowSize: false,
      colHeaders: false,
      rowHeaders: false,
      licenseKey: "non-commercial-and-evaluation",
      manualColumnMove: true,
      manualColumnResize: true,
      manualRowResize: true,
      manualRowMove: true,
      dropdownMenu: true,
      mergeCells: tableState.mergedCells,
      contextMenu: [
        "row_above",
        "row_below",
        "col_left",
        "col_right",
        "remove_row",
        "remove_col",
        "mergeCells",
        "undo",
        "redo",
        "copy",
        "cut",
        {
          key: "alignment",
          name: "Alignment",
          submenu: {
            items: [
              {
                key: "alignment:left",
                name: "Left",
              },
              {
                key: "alignment:center",
                name: "Center",
              },
              {
                key: "alignment:right",
                name: "Right",
              },
              {
                key: "alignment:justify",
                name: "Justify",
              },
              {
                key: "alignment:top",
                name: "Top",
              },
              {
                key: "alignment:middle",
                name: "Middle",
              },
              {
                key: "alignment:bottom",
                name: "Bottom",
              },
            ],
          },
        },
      ],
      autoColumnSize: {
        syncLimit: 500,
        useHeaders: true,
      },
      cells: function (row, col) {
        return {
          wordWrap: true,
          renderer: function (
            instance,
            td,
            row,
            col,
            prop,
            value,
            cellProperties
          ) {
            Handsontable.renderers.TextRenderer.apply(this, arguments);
            td.style.whiteSpace = "normal";
            td.style.wordBreak = "break-word";
            td.style.lineHeight = "1.5";
            td.style.padding = "8px";
            td.style.verticalAlign = "middle";
            td.style.height = "40px";
            td.style.boxSizing = "border-box";
            td.style.overflow = "hidden";
            td.style.textOverflow = "ellipsis";

            if (value && typeof value === "string") {
              td.innerHTML = value
                .replace(/\n/g, "<br>")
                .replace(/(.{20})/g, "$1&#8203;");
            }
          },
        };
      },
      enterMoves: false,
      enterBeginsEditing: true,
      editor: "text",
      autoWrapRow: true,
      autoWrapCol: true,

      // Add back header editing
      afterGetColHeader: (col, TH) => {
        const input = document.createElement("input");
        input.value = tableState.headers[col] || "";
        input.style.width = "100%";
        input.style.boxSizing = "border-box";
        input.style.padding = "2px 5px";
        input.style.margin = "0";
        input.style.border = "none";
        input.style.background = "transparent";
        input.style.textAlign = "center";
        input.style.color = "white";
        input.style.outline = "none";
        input.style.caretColor = "white";
        input.style.wordWrap = "break-word";
        input.style.whiteSpace = "normal";
        input.style.overflow = "hidden";
        input.style.textOverflow = "ellipsis";
        input.style.minHeight = "30px";

        input.addEventListener("blur", (e) => {
          const newHeaders = [...tableState.headers];
          newHeaders[col] = e.target.value;
          setTableState((prev) => ({
            ...prev,
            headers: newHeaders,
          }));
          hot.updateSettings({ colHeaders: newHeaders });
        });

        const headerDiv = TH.querySelector(".colHeader");
        if (headerDiv) {
          headerDiv.innerHTML = "";
          headerDiv.appendChild(input);
          headerDiv.style.lineHeight = "30px";
          headerDiv.style.fontSize = "14px";
          headerDiv.style.fontWeight = "bold";
          headerDiv.style.overflow = "hidden";
          headerDiv.style.whiteSpace = "normal";
          headerDiv.style.wordWrap = "break-word";
          headerDiv.style.height = "auto";
          headerDiv.style.minHeight = "30px";
          headerDiv.style.textOverflow = "ellipsis";
        }
      },

      beforeKeyDown: function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
          const selected = this.getSelected();
          if (selected) {
            event.stopImmediatePropagation();
            event.preventDefault();

            const [row, col] = selected[0];
            const editor = this.getActiveEditor();

            if (editor && editor.TEXTAREA) {
              const textarea = editor.TEXTAREA;
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const value = textarea.value;

              const newValue =
                value.substring(0, start) + "\n" + value.substring(end);

              textarea.value = newValue;
              textarea.selectionStart = start + 1;
              textarea.selectionEnd = start + 1;

              this.setDataAtCell(row, col, newValue);
            }
          }
        }
      },

      // Add this to style row headers
      afterGetRowHeader: (row, TH) => {
        TH.className = "htRowHeader";
        TH.style.textAlign = "center";
        TH.style.verticalAlign = "middle";
        TH.style.lineHeight = "40px"; // Match this with your row height
        TH.style.padding = "0 8px";
      },

      // Add these event listeners
      afterChange: (changes) => {
        if (changes) {
          const currentData = hot.getData();
          setTableState((prev) => ({
            ...prev,
            data: currentData,
          }));
        }
      },

      afterCreateCol: (index, amount) => {
        const currentHeaders = [...tableState.headers];
        for (let i = 0; i < amount; i++) {
          const newColIndex = index + i;
          currentHeaders.push(`Column ${currentHeaders.length}`);
        }
        setTableState((prev) => ({
          ...prev,
          headers: currentHeaders,
        }));
        setTimeout(() => {
          hot.updateSettings({ colHeaders: currentHeaders });
        }, 0);
      },

      afterRemoveCol: (index, amount) => {
        const currentHeaders = [...tableState.headers];
        currentHeaders.splice(index, amount);
        setTableState((prev) => ({
          ...prev,
          headers: currentHeaders,
        }));
        setTimeout(() => {
          hot.updateSettings({ colHeaders: currentHeaders });
        }, 0);
      },

      // Add this to track merged cells
      afterMergeCells: (cellRange, mergeParent, auto) => {
        const currentMergedCells =
          hot.getPlugin("mergeCells").mergedCellsCollection.mergedCells;
        setTableState((prev) => ({
          ...prev,
          mergedCells: currentMergedCells,
        }));
      },

      afterUnmergeCells: (cellRange, auto) => {
        const currentMergedCells =
          hot.getPlugin("mergeCells").mergedCellsCollection.mergedCells;
        setTableState((prev) => ({
          ...prev,
          mergedCells: currentMergedCells,
        }));
      },

      // Add these listeners for column/row resize
      afterColumnResize: (newSize, column) => {
        const allColWidths = [];
        for (let i = 0; i < hot.countCols(); i++) {
          allColWidths[i] = hot.getColWidth(i);
        }
        setColumnWidths(allColWidths);
      },

      afterRowResize: (newSize, row) => {
        const allRowHeights = [];
        for (let i = 0; i < hot.countRows(); i++) {
          allRowHeights[i] = hot.getRowHeight(i);
        }
        setRowHeights(allRowHeights);
      },

      beforeChange: (changes, source) => {
        if (source === "edit") {
          const currentHeaders = [...tableState.headers];
          hot.updateSettings({ colHeaders: currentHeaders });
        }
      },
    });

    setTimeout(() => {
      hot.render();
    }, 0);

    setHotInstance(hot);

    return () => {
      hot.destroy();
    };
  }, [showTable]);

  // Expose the current data and headers to parent
  useEffect(() => {
    if (hotInstance) {
      const currentData = hotInstance.getData();
      setTableState((prev) => ({
        ...prev,
        data: currentData,
      }));
    }
  }, [hotInstance]);

  return (
    <div
      ref={containerRef}
      className="ht-theme-main-dark-auto z-1000"
      data-headers={JSON.stringify(tableState.headers)}
      data-table-content={JSON.stringify(tableState.data)}
      data-merged-cells={JSON.stringify(tableState.mergedCells)}
      data-column-widths={JSON.stringify(columnWidths)}
      data-row-heights={JSON.stringify(rowHeights)}
      style={{
        width: "100%",
        maxWidth: "1200px",
        margin: "0 auto",
        height: "500px",
        overflow: "auto",
      }}
    ></div>
  );
}

export default HandsTable;
