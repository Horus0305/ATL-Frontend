import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Trash2 } from "lucide-react";
import HandsTable from "@/components/HandsTable";
import { EquipmentSelectionTable } from "../../components/EquipmentSelectionTable";
import { API_URLS, apiRequest } from "@/config/api";
import { useToast } from "@/components/ui/use-toast";
import EditableTable from "@/components/EditableTable";

export default function AddResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showTable, setShowTable] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [imageData, setImageData] = useState({});
  const [clientData, setClientData] = useState(null);
  const [equipmentDetails, setEquipmentDetails] = useState([]);
  const [testStandards, setTestStandards] = useState([]);
  const [existingEquipmentTable, setExistingEquipmentTable] = useState(null);
  const [existingResultTable, setExistingResultTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testStatus, setTestStatus] = useState("");
  const [rejectionRemark, setRejectionRemark] = useState("");
  const test = location.state?.test;
  const { toast } = useToast();

  useEffect(() => {
    console.log("Test object:", test);
    // Check if test exists and has clientName
    if (test) {
      console.log("Full test object for debugging:", test);
      fetchClientData();
      fetchTestStandards();
      checkExistingTables();
    }
  }, [test]);

  const checkExistingTables = async () => {
    try {
      if (!test || !test.atlId || !test.testType || !test.material) {
        console.error("Missing required test information");
        setLoading(false);
        return;
      }

      const urlParts = window.location.pathname.split("/");
      const testId = urlParts[urlParts.length - 2];

      if (!testId) {
        console.error("Test ID not found in URL");
        setLoading(false);
        return;
      }

      console.log("Checking for existing tables for test ID:", testId);
      const response = await apiRequest(`${API_URLS.TESTS}/${testId}`);

      if (response.ok && response.test) {
        // Find the specific test with matching atlId, testType, AND material
        const testDetail = response.test.tests.find(
          (t) =>
            t.atlId === test.atlId &&
            t.testType === test.testType &&
            t.material === test.material
        );

        if (testDetail) {
          console.log("Found existing test details:", testDetail);

          if (testDetail.equipmenttable) {
            console.log("Found existing equipment table");
            setExistingEquipmentTable(testDetail.equipmenttable);
          }

          if (testDetail.resulttable) {
            console.log("Found existing result table");
            setExistingResultTable(testDetail.resulttable);
            setShowTable(true);
          }

          // Update test status based on testResultStatus field
          console.log("Test result status:", testDetail.testResultStatus);
          console.log("Test result remark:", testDetail.testResultRemark);

          if (testDetail.testResultStatus === "Results Approved") {
            setTestStatus("Results Approved");
          } else if (testDetail.testResultStatus === "Results Rejected") {
            setTestStatus("Results Rejected");
            // Set the rejection remark
            if (testDetail.testResultRemark) {
              setRejectionRemark(testDetail.testResultRemark);
              toast({
                title: "Results Rejected",
                description: `Reason: ${testDetail.testResultRemark}`,
                variant: "destructive",
              });
            }
          } else if (testDetail.equipmenttable && testDetail.resulttable) {
            if (testDetail.testResultStatus === "Pending") {
              setTestStatus("Sent for Approval");
            } else {
              // If no status is set but tables exist, consider it as pending
              setTestStatus("Sent for Approval");
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking for existing tables:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add an effect to periodically check for status updates
  useEffect(() => {
    let intervalId;

    // Only start polling if we have test results sent for approval
    if (testStatus === "Sent for Approval") {
      // Initial check
      checkExistingTables();

      // Set up polling
      intervalId = setInterval(checkExistingTables, 10000); // Check every 10 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [testStatus, test]); // Added test to dependencies

  // Add an effect to check status when component mounts
  useEffect(() => {
    if (test) {
      checkExistingTables();
    }
  }, [test]);

  const fetchTestStandards = async () => {
    try {
      if (!test) {
        console.error("No test object available");
        return;
      }
      console.log("Fetching test standards...");
      const response = await apiRequest(API_URLS.getTestStandards);
      console.log("Test standards API response:", response);
      if (response.ok && response.standards) {
        // Find standards for the current material and test type
        const relevantStandards = response.standards.filter(
          (standard) =>
            standard.material === test.material &&
            standard.testType === test.testType
        );
        setTestStandards(relevantStandards);
      }
    } catch (error) {
      console.error("Error fetching test standards:", error);
    }
  };

  const fetchClientData = async () => {
    try {
      if (!test) {
        console.error("No test object available");
        return;
      }
      console.log("Fetching client data...");
      const response = await apiRequest(API_URLS.getAllClients);
      console.log("Clients API response:", response);
      if (response.ok && response.clients) {
        // Find the client with matching name (case-insensitive and trimmed)
        const client = response.clients.find((c) => {
          const clientNameFromDB = (c.clientname || "").toLowerCase().trim();
          const testClientName = (test.clientName || "").toLowerCase().trim();
          console.log("Comparing:", clientNameFromDB, "with:", testClientName);
          return clientNameFromDB === testClientName;
        });

        if (client) {
          console.log("Found client data:", client);
          setClientData(client);
        } else {
          // Try to find by partial match if exact match fails
          const partialMatch = response.clients.find((c) => {
            const clientNameFromDB = (c.clientname || "").toLowerCase().trim();
            const testClientName = (test.clientName || "").toLowerCase().trim();
            return (
              clientNameFromDB.includes(testClientName) ||
              testClientName.includes(clientNameFromDB)
            );
          });

          if (partialMatch) {
            console.log("Found client by partial match:", partialMatch);
            setClientData(partialMatch);
          } else {
            console.error("Client not found in database, using test data");
            // If client not found in database, use the data from test object
            setClientData({
              clientname: test.clientName,
              address: test.address,
            });
          }
        }
      } else {
        console.error("Failed to fetch clients data:", response);
        // Fallback to test object data if API fails
        setClientData({
          clientname: test.clientName,
          address: test.address,
        });
      }
    } catch (error) {
      console.error("Error fetching client data:", error);
      // Fallback to test object data if API fails
      setClientData({
        clientname: test.clientName,
        address: test.address,
      });
    }
  };

  const fetchEquipmentDetails = async (equipmentIds) => {
    try {
      const response = await apiRequest(API_URLS.getEquipmentByIds, {
        method: "POST",
        body: JSON.stringify({ equipmentIds }),
      });
      if (response.ok) {
        setEquipmentDetails(response.equipment);
      }
    } catch (error) {
      console.error("Error fetching equipment details:", error);
    }
  };

  useEffect(() => {
    if (selectedEquipment.length > 0) {
      const equipmentIds = selectedEquipment.map((eq) => eq._id);
      fetchEquipmentDetails(equipmentIds);
    }
  }, [selectedEquipment]);

  useEffect(() => {
    // Function to load image and convert to base64
    const loadImage = async (path) => {
      try {
        const response = await fetch(path);
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error("Error loading image:", error);
        return "";
      }
    };

    // Load all images
    const loadAllImages = async () => {
      const images = {
        logo1: await loadImage("/images/image4.png"),
        logo2: await loadImage("/images/image5.png"),
        signature: await loadImage("/images/image1.jpg"),
        stamp: await loadImage("/images/image3.png"),
      };
      setImageData(images);
    };

    loadAllImages();
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  const handleGenerateTable = () => {
    setShowTable(true);
  };

  const handleEquipmentSelect = (equipment) => {
    setSelectedEquipment(equipment);
  };

  const handleDownload = async () => {
    const hotContainer = document.querySelector(".handsontable");
    if (!hotContainer) return;

    const containerDiv = hotContainer.closest("[data-headers]");
    if (!containerDiv) return;

    const headers = JSON.parse(
      containerDiv.getAttribute("data-headers") || "[]"
    );
    const data = JSON.parse(
      containerDiv.getAttribute("data-table-content") || "[]"
    );

    // Create base HTML template
    const baseTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>ATL</title>
    <style type="text/css">
      * { margin: 0; padding: 0; text-indent: 0; }
      h1 { color: black; font-family: "Times New Roman", serif; font-style: normal; font-weight: bold; text-decoration: underline; font-size: 11pt; }
      .s1 { color: black; font-family: "Times New Roman", serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 11pt; }
      .s2 { color: black; font-family: "Times New Roman", serif; font-style: normal; font-weight: bold; text-decoration: none; font-size: 11pt; }
      .s3 { color: black; font-family: "Times New Roman", serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 10pt; }
      .s4 { color: black; font-family: "Times New Roman", serif; font-style: normal; font-weight: bold; text-decoration: none; font-size: 10pt; }
      .s5 { color: black; font-family: "Times New Roman", serif; font-style: normal; font-weight: bold; text-decoration: none; font-size: 11pt; }
      .s6 { color: black; font-family: "Times New Roman", serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 12pt; }
      table, tbody { vertical-align: top; overflow: visible; }
    </style>
  </head>
  <body>
    <div>
      <p style="text-indent: 0pt; text-align: left">
        <span style="overflow: hidden; display: inline-block; margin: 0px 0px; border: 0px solid #000000; transform: rotate(0rad) translateZ(0px); -webkit-transform: rotate(0rad) translateZ(0px); width: 186.3px; height: 105.66px; padding-left: 100px; padding-top: 10px;">
          <img alt="" src="${
            imageData.logo1
          }" style="width: 186.3px; height: 105.66px; margin-left: 0px; margin-top: 0px; transform: rotate(0rad) translateZ(0px); -webkit-transform: rotate(0rad) translateZ(0px);" title="" />
        </span>
        <span style="margin-left: 300px"></span>
        <span style="overflow: hidden; display: inline-block; margin: 0.8px 0.76px; border: 0px solid #000000; transform: rotate(0.02rad) translateZ(0px); -webkit-transform: rotate(0.02rad) translateZ(0px); width: 92.18px; height: 87.5px;">
          <img alt="" src="${
            imageData.logo2
          }" style="width: 92.18px; height: 87.5px; margin-left: 0px; margin-top: 0px; transform: rotate(0rad) translateZ(0px); -webkit-transform: rotate(0rad) translateZ(0px);" title="" />
        </span>
      </p>
    </div>
    <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
      <h1 style="padding-top: 1pt; text-indent: 0pt; text-align: center">TEST REPORT</h1>
      <button class="add-section-btn" style="display: none; background: #4caf50; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; font-size: 18px; cursor: pointer; display: none; align-items: center; justify-content: center; margin-left: 10px;">+</button>
    </div>
    <table style="border-collapse: collapse; margin-left: 17.5pt" cellspacing="0" class="client-details-table">
      <tr style="height: 17pt">
        <td style="width: 324pt">
          <p class="s1" style="padding-left: 2pt; text-indent: 0pt; line-height: 12pt; text-align: left;">Report No. : ${
            test?.atlId || "ATL/24/12/1422"
          }</p>
        </td>
        <td style="width: 209pt">
          <p class="s1" style="padding-left: 74pt; text-indent: 0pt; line-height: 12pt; text-align: left;">Date: ${
            test?.date || "28/12/2024"
          }</p>
        </td>
      </tr>
      <tr style="height: 21pt">
        <td style="width: 324pt">
          <p class="s1" style="padding-top: 3pt; padding-left: 2pt; text-indent: 0pt; text-align: left;">Date of Receipt : ${
            test?.date || "19/12/2024"
          }</p>
        </td>
        <td style="width: 209pt">
          <p class="s1" style="padding-top: 3pt; padding-left: 74pt; text-indent: 0pt; text-align: left;">ULR: TCB74924000001055F</p>
        </td>
      </tr>
      <tr style="height: 17pt">
        <td style="width: 324pt">
          <p class="s1" style="padding-top: 3pt; padding-left: 2pt; text-indent: 0pt; line-height: 12pt; text-align: left;">Company Name : ${
            clientData?.clientname || "N/A"
          }</p>
        </td>
        <td style="width: 209pt">
          <p class="s1" style="padding-top: 3pt; padding-left: 74pt; text-indent: 0pt; line-height: 12pt; text-align: left;">Order No.*:${
            test?.atlId || "N/A"
          }</p>
        </td>
      </tr>
    </table>
    <p style="padding-left: 113pt; text-indent: -93pt; line-height: 163%; text-align: left; padding-top: 3pt;">Company Address : ${
      clientData?.address || "N/A"
    }</p>
    <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
      <h1 style="padding-top: 3pt; text-indent: 0pt; text-align: center; margin: 0; margin-right: 10px;">TEST REPORT ON ${
        test?.testType ? test.testType.split("-")[0].trim() : "Chemical"
      } ANALYSIS OF ${test?.material}</h1>
      <button class="add-section-btn" style="display: none; background: #4caf50; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; font-size: 18px; cursor: pointer; align-items: center; justify-content: center;">+</button>
    </div>
    <p style="text-indent: 0pt; text-align: left"><br /></p>
    <table style="border-collapse: collapse; margin-left: 17.5pt" cellspacing="0" class="material-details-table">
      <tr style="height: 17pt">
        <td style="width: 350pt">
          <p class="s1" style="padding-left: 2pt; text-indent: 0pt; line-height: 12pt; text-align: left;">Sample Description : ${
            test?.material
          }</p>
        </td>
        <td style="width: 350pt">
          <p class="s1" style="padding-left: 5pt; text-indent: 0pt; line-height: 12pt; text-align: left;">Condition of Sample : Satisfactory</p>
        </td>
      </tr>
      <tr style="height: 17pt">
        <td style="width: 350pt">
          <p class="s1" style="padding-left: 2pt; text-indent: 0pt; line-height: 12pt; text-align: left;">Product Name : ${
            test?.material
          }</p>
        </td>
        <td style="width: 350pt">
          <p class="s1" style="padding-left: 5pt; text-indent: 0pt; line-height: 12pt; text-align: left;">Lab Reference Number : ${
            test?.atlId
          }</p>
        </td>
      </tr>
      <tr style="height: 17pt">
        <td style="width: 350pt">
          <p class="s1" style="padding-left: 2pt; text-indent: 0pt; line-height: 12pt; text-align: left;">Customer Reference : ${
            clientData?.clientname || "N/A"
          }</p>
        </td>
        <td style="width: 350pt">
          <p class="s1" style="padding-left: 5pt; text-indent: 0pt; line-height: 12pt; text-align: left;">Period of Test : 20/12/2024 to 23/12/2024</p>
        </td>
      </tr>
      <tr style="height: 17pt">
        <td style="width: 700pt" colspan="2">
          <p class="s1" style="padding-left: 2pt; text-indent: 0pt; line-height: 12pt; text-align: left;">Test Method : ${
            testStandards.length > 0
              ? testStandards.map((standard) => standard.standard).join(", ")
              : test.tests?.map((t) => t.standard).join(", ") ||
                "IS: 9103: 1999/RA 2018, IS: 6925: 1973/RA 2018"
          }</p>
        </td>
      </tr>
    </table>
    <p style="text-indent: 0pt; text-align: left"><br /></p>`;

    // Generate equipment table HTML
    const equipmentTableHtml = `
      <p style="text-indent: 0pt; text-align: left"></p>
      <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
        <h1 style="padding-top: 9pt; text-indent: 0pt; text-align: center" font-size="15pt">Equipments Details</h1>
        <button class="add-section-btn" style="display: none; background: #4caf50; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; font-size: 18px; cursor: pointer; align-items: center; justify-content: center; margin-left: 10px;">+</button>
      </div>
      <p style="text-indent: 0pt; text-align: left; padding-top: 3pt;"></p>
      <div style="display: flex; justify-content: center; padding-left: 20px; padding-right: 20px;">
        <table style="border-collapse: collapse; margin: 0 auto;" cellspacing="0">
          <tr style="height: 15pt">
            <td style="width: 62pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
              <p class="s4" style="padding-top: 2pt; text-indent: 0pt; text-align: center">Equipment Used</p>
            </td>
            <td style="width: 84pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
              <p class="s4" style="padding-top: 2pt; text-indent: 0pt; text-align: center">Range</p>
            </td>
            <td style="width: 84pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
              <p class="s4" style="padding-top: 2pt; text-indent: 0pt; text-align: center">Certificate No.</p>
            </td>
            <td style="width: 84pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
              <p class="s4" style="padding-top: 2pt; text-indent: 0pt; text-align: center">Calibrated date</p>
            </td>
            <td style="width: 84pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
              <p class="s4" style="padding-top: 2pt; text-indent: 0pt; text-align: center">Due Date</p>
            </td>
            <td style="width: 84pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
              <p class="s4" style="padding-top: 2pt; text-indent: 0pt; text-align: center">Calibrated By</p>
            </td>
          </tr>
          ${equipmentDetails
            .map(
              (equipment) => `
            <tr style="height: 15pt">
              <td style="width: 62pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
                <p class="s1" style="padding-top: 2pt; text-indent: 0pt; text-align: center">${
                  equipment.equipment || ""
                }</p>
              </td>
              <td style="width: 84pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
                <p class="s1" style="padding-top: 2pt; text-indent: 0pt; text-align: center">${
                  equipment.range || ""
                }</p>
              </td>
              <td style="width: 84pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
                <p class="s1" style="padding-top: 2pt; text-indent: 0pt; text-align: center">${
                  equipment.cno || ""
                }</p>
              </td>
              <td style="width: 84pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
                <p class="s1" style="padding-top: 2pt; text-indent: 0pt; text-align: center">${
                  new Date(equipment.cdate).toLocaleDateString() || ""
                }</p>
              </td>
              <td style="width: 84pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
                <p class="s1" style="padding-top: 2pt; text-indent: 0pt; text-align: center">${
                  new Date(equipment.ddate).toLocaleDateString() || ""
                }</p>
              </td>
              <td style="width: 84pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
                <p class="s1" style="padding-top: 2pt; text-indent: 0pt; text-align: center">${
                  equipment.cname || ""
                }</p>
              </td>
            </tr>
          `
            )
            .join("")}
        </table>
      </div>`;

    // Generate results table HTML
    const resultsTableHtml = `
      <p style="text-indent: 0pt; text-align: left"></p>
      <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
        <h1 style="padding-top: 9pt; text-indent: 0pt; text-align: center" font-size="15pt">Test Results</h1>
        <button class="add-section-btn" style="display: none; background: #4caf50; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; font-size: 18px; cursor: pointer; align-items: center; justify-content: center; margin-left: 10px;">+</button>
      </div>
      <p style="text-indent: 0pt; text-align: left; padding-top: 3pt;"></p>
      <div style="display: flex; justify-content: center; padding-left: 20px; padding-right: 20px;">
        <table style="border-collapse: collapse; margin: 0 auto;" cellpadding="15">
          ${(() => {
            try {
              // Get merged cells data
              const mergedCellsData =
                typeof containerDiv.getAttribute("data-merged-cells") ===
                "string"
                  ? JSON.parse(
                      containerDiv.getAttribute("data-merged-cells") || "[]"
                    )
                  : [];

              // Get column widths and row heights
              const columnWidths =
                typeof containerDiv.getAttribute("data-column-widths") ===
                "string"
                  ? JSON.parse(
                      containerDiv.getAttribute("data-column-widths") || "[]"
                    )
                  : [];

              const rowHeights =
                typeof containerDiv.getAttribute("data-row-heights") ===
                "string"
                  ? JSON.parse(
                      containerDiv.getAttribute("data-row-heights") || "[]"
                    )
                  : [];

              // Get table content
              const data =
                typeof containerDiv.getAttribute("data-table-content") ===
                "string"
                  ? JSON.parse(
                      containerDiv.getAttribute("data-table-content") || "[]"
                    )
                  : [];

              const mergedCellsMap = new Map();

              // Create a map of merged cells for easy lookup
              mergedCellsData.forEach((mc) => {
                for (let row = mc.row; row < mc.row + mc.rowspan; row++) {
                  for (let col = mc.col; col < mc.col + mc.colspan; col++) {
                    if (row === mc.row && col === mc.col) {
                      mergedCellsMap.set(`${row},${col}`, {
                        rowspan: mc.rowspan,
                        colspan: mc.colspan,
                        value: data[mc.row][mc.col],
                      });
                    } else {
                      mergedCellsMap.set(`${row},${col}`, { skip: true });
                    }
                  }
                }
              });

              return data
                .map((row, rowIndex) => {
                  const rowHeight = rowHeights[rowIndex] || 40;
                  const isFirstRow = rowIndex === 0;
                  let rowHtml = `<tr style="height: ${rowHeight}px">`;

                  row.forEach((cell, colIndex) => {
                    const mergedCell = mergedCellsMap.get(
                      `${rowIndex},${colIndex}`
                    );
                    const colWidth = columnWidths[colIndex] || 84;

                    if (mergedCell?.skip) {
                      return;
                    }

                    if (mergedCell) {
                      rowHtml += `
                        <td style="width: ${colWidth}pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt; text-align: center; vertical-align: middle;"
                            rowspan="${mergedCell.rowspan}"
                            colspan="${mergedCell.colspan}">
                          <p class="${
                            isFirstRow ? "s4" : "s1"
                          }" style="margin: 0; padding: 0; text-align: center">${
                        mergedCell.value || ""
                      }</p>
                        </td>`;
                    } else {
                      rowHtml += `
                        <td style="width: ${colWidth}pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt; text-align: center; vertical-align: middle;">
                          <p class="${
                            isFirstRow ? "s4" : "s1"
                          }" style="margin: 0; padding: 0; text-align: center">${
                        cell || ""
                      }</p>
                        </td>`;
                    }
                  });

                  rowHtml += `</tr>`;
                  return rowHtml;
                })
                .join("");
            } catch (error) {
              console.error("Error generating results table HTML:", error);
              return "<tr><td>Error generating table</td></tr>";
            }
          })()}
        </table>
      </div>`;

    const footerHtml = `
      <p style="text-indent: 0pt; text-align: left"></p>
      <div style="display: flex; align-items: center">
        <p class="s5" style="padding-top: 6pt; padding-left: 10pt; text-indent: 0pt; text-align: left; margin-right: 10px;">Note:</p>
        <button id="addNoteBtn" style="display: none; background: #4caf50; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; font-size: 18px; cursor: pointer; align-items: center; justify-content: center; margin-top: 6pt;">+</button>
      </div>
      <div id="notesContainer" class="notes-section" style="padding-left: 10pt; padding-right: 10pt">
        <div class="note-item" style="display: flex; margin-bottom: 10pt" data-note-id="1">
          <span class="note-number" style="min-width: 20pt; font-weight: bold">1.</span>
          <p style="margin: 0">The above results relate to the sample submitted by the customer.</p>
        </div>
        <div class="note-item" style="display: flex; margin-bottom: 10pt" data-note-id="2">
          <span class="note-number" style="min-width: 20pt; font-weight: bold">2.</span>
          <p style="margin: 0">Test results shall not be reproduced except in full without the written permission of Avant-Tech lab &amp; Research Center Pvt. Ltd.</p>
        </div>
        <div class="note-item" style="display: flex; margin-bottom: 10pt" data-note-id="3">
          <span class="note-number" style="min-width: 20pt; font-weight: bold">3.</span>
          <p style="margin: 0">We do not undertake any responsibility for any involvement in any type of litigation arising out of this report submitted by Avant – Tech lab &amp; Research Centre Pvt. Ltd.</p>
        </div>
        <div class="note-item" style="display: flex; margin-bottom: 10pt" data-note-id="4">
          <span class="note-number" style="min-width: 20pt; font-weight: bold">4.</span>
          <p style="margin: 0">Uniformity requirements for ash content is not applicable to accelerating admixture which may contain more than 1 percent chloride content.</p>
        </div>
      </div>
      <p style="text-indent: 0pt; text-align: left"><br /></p>
      <p style="padding-left: 21.5pt; text-indent: 0pt; text-align: left;">For Avant-Tech Lab &amp; Research Centre Pvt.</p>
      <p style="text-indent: 0pt; text-align: left"><br /></p>
      <table style="border-collapse: collapse; margin-left: 21.5pt" cellspacing="0">
        <tr style="height: 58pt">
          <td style="width: 186pt; vertical-align: bottom;">
            <img width="91" height="58" src="${
              test?.testType?.toLowerCase().includes("chemical")
                ? imageData.signature
                : "https://res.cloudinary.com/dzus0pcxr/image/upload/v1747115216/jaymit_sir_sign_vyzyyo.png"
            }" alt="Signature 1" style="margin-bottom: 5pt;" />
            <p class="s1" style="text-indent: 0pt; text-align: left;">${
              test?.testType?.toLowerCase().includes("chemical")
                ? "Nisha Kamble"
                : "Jaymit Mali"
            }</p>
            <p class="s1" style="text-indent: 0pt; text-align: left;">${
              test?.testType?.toLowerCase().includes("chemical")
                ? "Quality Manager"
                : "Technical Manager"
            }</p>
            <p class="s1" style="text-indent: 0pt; text-align: left;">${
              test?.testType?.toLowerCase().includes("chemical")
                ? "Authorised Signatory – Chemical"
                : "Authorised Signatory - Mechanical"
            }</p>
          </td>
          <td style="width: 186pt; vertical-align: bottom;">
            <img width="91" height="58" src="https://res.cloudinary.com/dzus0pcxr/image/upload/v1747115216/Govilkar_sir_sign_u7kjjh.png" alt="Signature 2" style="margin-bottom: 5pt;" />
            <p class="s1" style="text-indent: 0pt; text-align: left;">Sadanand Govilkar</p>
            <p class="s1" style="text-indent: 0pt; text-align: left;">Managing Director</p>
            <p class="s1" style="text-indent: 0pt; text-align: left;">Avant Tech Lab</p>
          </td>
          <td style="width: 131pt; text-align: center;">
            <img width="131" height="131" src="${
              imageData.stamp
            }" alt="QR Code 1" />
            <p class="s2" style="text-indent: 0pt; text-align: center;">REPORT</p>
          </td>
          <td style="width: 131pt; text-align: center;">
            <img width="131" height="131" src="${
              imageData.stamp
            }" alt="QR Code 2" />
            <p class="s2" style="text-indent: 0pt; text-align: center;">NABL</p>
          </td>
        </tr>
      </table>
    </body>
    </html>`;

    // Combine all parts
    const fullHtml = `${baseTemplate}${equipmentTableHtml}${resultsTableHtml}${footerHtml}`;

    try {
      // Check if the report is too large (over 40MB to be safe)
      const reportSize = new Blob([fullHtml]).size;
      const maxSize = 40 * 1024 * 1024; // 40MB in bytes

      console.log("Report size:", reportSize, "bytes");

      if (reportSize > maxSize) {
        toast({
          title: "Error",
          description:
            "Report is too large to upload. Please reduce the amount of data or contact support.",
          variant: "destructive",
        });
        return;
      }

      // Extract the test ID from the URL
      const urlParts = window.location.pathname.split("/");
      const testId = urlParts[urlParts.length - 2]; // The ID is the second-to-last part of the URL

      console.log("Test ID from URL:", testId);
      console.log("Test object:", test);
      console.log("ATL ID:", test?.atlId);

      if (!testId) {
        throw new Error("Test ID not found in URL. Cannot upload report.");
      }

      if (!test?.atlId) {
        throw new Error(
          "ATL ID not found in test object. Cannot upload report."
        );
      }

      // Upload the report to the server
      console.log("Sending report to server...");
      console.log("Equipment table HTML type:", typeof equipmentTableHtml);
      console.log("Result table HTML type:", typeof resultsTableHtml);

      const response = await apiRequest(API_URLS.uploadTestReport(testId), {
        method: "POST",
        body: JSON.stringify({
          atlId: test.atlId,
          reportHtml: fullHtml,
          testType: test.testType,
          material: test.material,
          equipmenttable: String(equipmentTableHtml),
          resulttable: String(resultsTableHtml),
        }),
      });

      console.log("Server response:", response);

      if (!response.ok) {
        throw new Error(response.error || "Failed to upload report");
      }

      // Show success message
      toast({
        title: "Success",
        description: "Report saved successfully",
      });

      window.location.reload();

      // Download the report after successful save
      const blob = new Blob([fullHtml], { type: "text/html" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Test_Report_${test.atlId}_${test.testType
        .split("-")[0]
        .trim()}_${test.material}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error handling report:", error);

      // Provide more specific error messages
      let errorMessage = "Failed to save report";
      if (error.message && error.message.includes("request entity too large")) {
        errorMessage =
          "Report is too large to upload. Please reduce the amount of data or contact support.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDelete = () => {
    setShowTable(false);
  };

  const renderExistingEquipmentTable = () => {
    if (!existingEquipmentTable) return null;

    return (
      <div className="p-6 w-full bg-white rounded-lg shadow-sm dark:bg-black">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Equipment Table</h2>
          <Button
            onClick={() => {
              // Reset just the equipment table
              setExistingEquipmentTable(null);
              toast({
                title: "Equipment Table Reset",
                description: "You can now select new equipment.",
              });
            }}
            variant="outline"
            className="dark:bg-white dark:text-black"
          >
            Replace Equipment Table
          </Button>
        </div>

        {/* Display the equipment table without editing capability */}
        <div
          className="overflow-auto p-4 rounded-md border equipment-table-display"
          dangerouslySetInnerHTML={{ __html: existingEquipmentTable }}
        />
      </div>
    );
  };

  const renderExistingResultTable = () => {
    if (!existingResultTable) return null;

    return (
      <div className="p-6 w-full bg-white rounded-lg shadow-sm dark:bg-black">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Result Table</h2>
          <Button
            onClick={() => {
              // Reset just the result table
              setExistingResultTable(null);
              setShowTable(false);
              toast({
                title: "Result Table Reset",
                description: "You can now create a new result table.",
              });
            }}
            variant="outline"
          >
            Replace Result Table
          </Button>
        </div>
        <EditableTable
          htmlContent={existingResultTable}
          onSave={(updatedHtml) => {
            handleSaveTableUpdate(updatedHtml, "result");
          }}
        />
      </div>
    );
  };

  const handleSaveTableUpdate = async (updatedHtml, tableType) => {
    try {
      // Extract the test ID from the URL
      const urlParts = window.location.pathname.split("/");
      const testId = urlParts[urlParts.length - 2];

      if (!testId || !test?.atlId || !test?.testType || !test?.material) {
        throw new Error("Missing required test information");
      }

      console.log(`Saving updated ${tableType} table...`);

      // First, fetch the current test data to get the full report
      const testResponse = await apiRequest(`${API_URLS.TESTS}/${testId}`);

      if (!testResponse.ok || !testResponse.test) {
        throw new Error("Failed to fetch current test data");
      }

      // Find the specific test with matching atlId, testType, AND material
      const testDetail = testResponse.test.tests.find(
        (t) =>
          t.atlId === test.atlId &&
          t.testType === test.testType &&
          t.material === test.material
      );

      if (!testDetail) {
        throw new Error("Test detail not found");
      }

      // Get the current report HTML
      const currentReportHtml = testDetail.reporturl;
      let updatedReportHtml = currentReportHtml;

      // Update the report HTML with the new table
      if (currentReportHtml) {
        // Create a temporary DOM element to parse the HTML
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = currentReportHtml;

        if (tableType === "equipment") {
          // Find and replace equipment table section in the report
          const equipmentTableSection = tempDiv.querySelector(
            ".equipment-table-section"
          );
          if (equipmentTableSection) {
            equipmentTableSection.innerHTML = updatedHtml;
          } else {
            // If the section doesn't exist, try to find and replace the equipment table by structure
            const equipmentTableHeading = Array.from(
              tempDiv.querySelectorAll("h1")
            ).find(
              (h) =>
                h.textContent.includes("Equipments Details") ||
                h.textContent.includes("Equipment Details")
            );

            if (equipmentTableHeading) {
              // Extract just the table from the updated HTML
              const tempTableContainer = document.createElement("div");
              tempTableContainer.innerHTML = updatedHtml;

              // Find the table in the updated HTML
              const updatedTable = tempTableContainer.querySelector("table");

              if (updatedTable) {
                // Find the table after the heading in the original report
                let nextElement = equipmentTableHeading.nextElementSibling;
                while (nextElement && !nextElement.querySelector("table")) {
                  nextElement = nextElement.nextElementSibling;
                }

                if (nextElement && nextElement.querySelector("table")) {
                  // Replace just the table, not the surrounding content
                  const originalTable = nextElement.querySelector("table");
                  originalTable.parentNode.replaceChild(
                    updatedTable.cloneNode(true),
                    originalTable
                  );
                }
              }
            }
          }
        } else if (tableType === "result") {
          // Find and replace result table section in the report
          const resultTableSection = tempDiv.querySelector(
            ".result-table-section"
          );
          if (resultTableSection) {
            resultTableSection.innerHTML = updatedHtml;
          } else {
            // If the section doesn't exist, try to find and replace the result table by structure
            const resultTableHeading = Array.from(
              tempDiv.querySelectorAll("h1")
            ).find((h) => h.textContent.includes("Test Results"));

            if (resultTableHeading) {
              // Extract just the table from the updated HTML
              const tempTableContainer = document.createElement("div");
              tempTableContainer.innerHTML = updatedHtml;

              // Find the table in the updated HTML
              const updatedTable = tempTableContainer.querySelector("table");

              if (updatedTable) {
                // Find the table after the heading in the original report
                let nextElement = resultTableHeading.nextElementSibling;
                while (nextElement && !nextElement.querySelector("table")) {
                  nextElement = nextElement.nextElementSibling;
                }

                if (nextElement && nextElement.querySelector("table")) {
                  // Replace just the table, not the surrounding content
                  const originalTable = nextElement.querySelector("table");
                  originalTable.parentNode.replaceChild(
                    updatedTable.cloneNode(true),
                    originalTable
                  );
                }
              }
            }
          }
        }

        // Get the updated report HTML
        updatedReportHtml = tempDiv.innerHTML;
      }

      // Create payload based on table type
      const payload = {
        atlId: test.atlId,
        testType: test.testType,
        material: test.material,
        reportHtml: updatedReportHtml,
      };

      // Set the appropriate field based on table type
      if (tableType === "equipment") {
        payload.equipmenttable = updatedHtml;
        // Update local state
        setExistingEquipmentTable(updatedHtml);
      } else if (tableType === "result") {
        payload.resulttable = updatedHtml;
        // Update local state
        setExistingResultTable(updatedHtml);
      }

      // Send update to the server
      const response = await apiRequest(
        `${API_URLS.TESTS}/${testId}/update-table`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(
          response.error || `Failed to update ${tableType} table`
        );
      }

      toast({
        title: "Success",
        description: `${
          tableType.charAt(0).toUpperCase() + tableType.slice(1)
        } table updated successfully`,
      });
    } catch (error) {
      console.error(`Error updating ${tableType} table:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to update ${tableType} table`,
        variant: "destructive",
      });
    }
  };

  const handleSaveEquipment = async () => {
    try {
      if (selectedEquipment.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one equipment",
          variant: "destructive",
        });
        return;
      }

      // Generate equipment table HTML
      const equipmentTableHtml = `
        <div style="display: flex; justify-content: center;">
          <table style="border-collapse: collapse; margin: 0 auto;" cellspacing="0">
            <tr style="height: 15pt">
              <td style="width: 62pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
                <p class="s4" style="padding-top: 2pt; text-indent: 0pt; text-align: center">Equipment Used</p>
              </td>
              <td style="width: 84pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
                <p class="s4" style="padding-top: 2pt; text-indent: 0pt; text-align: center">Range</p>
              </td>
              <td style="width: 84pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
                <p class="s4" style="padding-top: 2pt; text-indent: 0pt; text-align: center">Certificate No.</p>
              </td>
              <td style="width: 84pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
                <p class="s4" style="padding-top: 2pt; text-indent: 0pt; text-align: center">Calibrated date</p>
              </td>
              <td style="width: 84pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
                <p class="s4" style="padding-top: 2pt; text-indent: 0pt; text-align: center">Due Date</p>
              </td>
              <td style="width: 84pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
                <p class="s4" style="padding-top: 2pt; text-indent: 0pt; text-align: center">Calibrated By</p>
              </td>
            </tr>
            ${equipmentDetails
              .map(
                (equipment) => `
              <tr style="height: 15pt">
                <td style="width: 62pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
                  <p class="s1" style="padding-top: 2pt; text-indent: 0pt; text-align: center">${
                    equipment.equipment || ""
                  }</p>
                </td>
                <td style="width: 84pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
                  <p class="s1" style="padding-top: 2pt; text-indent: 0pt; text-align: center">${
                    equipment.range || ""
                  }</p>
                </td>
                <td style="width: 84pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
                  <p class="s1" style="padding-top: 2pt; text-indent: 0pt; text-align: center">${
                    equipment.cno || ""
                  }</p>
                </td>
                <td style="width: 84pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
                  <p class="s1" style="padding-top: 2pt; text-indent: 0pt; text-align: center">${
                    new Date(equipment.cdate).toLocaleDateString() || ""
                  }</p>
                </td>
                <td style="width: 84pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
                  <p class="s1" style="padding-top: 2pt; text-indent: 0pt; text-align: center">${
                    new Date(equipment.ddate).toLocaleDateString() || ""
                  }</p>
                </td>
                <td style="width: 84pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
                  <p class="s1" style="padding-top: 2pt; text-indent: 0pt; text-align: center">${
                    equipment.cname || ""
                  }</p>
                </td>
              </tr>
            `
              )
              .join("")}
          </table>
        </div>`;

      // Extract the test ID from the URL
      const urlParts = window.location.pathname.split("/");
      const testId = urlParts[urlParts.length - 2];

      if (!testId || !test?.atlId || !test?.testType || !test?.material) {
        throw new Error("Missing required test information");
      }

      // First, fetch the current test data to get the full report
      const testResponse = await apiRequest(`${API_URLS.TESTS}/${testId}`);

      if (!testResponse.ok || !testResponse.test) {
        throw new Error("Failed to fetch current test data");
      }

      // Find the specific test with matching atlId, testType, AND material
      const testDetail = testResponse.test.tests.find(
        (t) =>
          t.atlId === test.atlId &&
          t.testType === test.testType &&
          t.material === test.material
      );

      if (!testDetail) {
        throw new Error("Test detail not found");
      }

      // Get the current report HTML
      let updatedReportHtml = testDetail.reporturl;

      // Update the report HTML with the new equipment table if it exists
      if (updatedReportHtml) {
        // Create a temporary DOM element to parse the HTML
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = updatedReportHtml;

        // Try to find and replace the equipment table by structure
        const equipmentTableHeading = Array.from(
          tempDiv.querySelectorAll("h1")
        ).find(
          (h) =>
            h.textContent.includes("Equipments Details") ||
            h.textContent.includes("Equipment Details")
        );

        if (equipmentTableHeading) {
          // Extract just the table from the updated HTML
          const tempTableContainer = document.createElement("div");
          tempTableContainer.innerHTML = equipmentTableHtml;

          // Find the table in the updated HTML
          const updatedTable = tempTableContainer.querySelector("table");

          if (updatedTable) {
            // Find the table after the heading in the original report
            let nextElement = equipmentTableHeading.nextElementSibling;
            while (nextElement && !nextElement.querySelector("table")) {
              nextElement = nextElement.nextElementSibling;
            }

            if (nextElement && nextElement.querySelector("table")) {
              // Replace just the table, not the surrounding content
              const originalTable = nextElement.querySelector("table");
              originalTable.parentNode.replaceChild(
                updatedTable.cloneNode(true),
                originalTable
              );
            }
          }
        }

        // Get the updated report HTML
        updatedReportHtml = tempDiv.innerHTML;
      }

      // Create payload
      const payload = {
        atlId: test.atlId,
        testType: test.testType,
        material: test.material,
        equipmenttable: equipmentTableHtml,
        reportHtml: updatedReportHtml,
      };

      // Send update to the server
      const response = await apiRequest(
        `${API_URLS.TESTS}/${testId}/update-table`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(response.error || `Failed to save equipment table`);
      }

      // Update local state
      setExistingEquipmentTable(equipmentTableHtml);

      toast({
        title: "Success",
        description: "Equipment table saved successfully",
      });
    } catch (error) {
      console.error("Error saving equipment table:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save equipment table",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-[95vh] dark:bg-black overflow-y-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={handleBack} className="mr-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-2xl font-bold dark:text-white">Add Test Results</h2>
      </div>

      {loading ? (
        <div className="flex justify-center items-center my-8">
          <p>Loading...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-4 max-w-[1200px] mx-auto px-4 pb-8">
          <div className="p-6 w-full bg-white rounded-lg shadow-sm dark:bg-black">
            <div className="flex justify-between items-center">
              <div>
                <label className="block mb-2">
                  Test ID: {test?.atlId || "N/A"}
                </label>
                <label className="block mb-2">
                  Material: {test?.material || "N/A"}
                </label>
                <label className="block mb-2">
                  Date: {test?.date || "N/A"}
                </label>
                <label className="block mb-2">
                  Test Type: {test?.testType || "N/A"}
                </label>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <div
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    testStatus === "Results Approved"
                      ? "bg-green-100 text-green-800"
                      : testStatus === "Results Rejected"
                      ? "bg-red-100 text-red-800"
                      : testStatus === "Sent for Approval"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {testStatus}
                </div>
                {rejectionRemark && testStatus === "Results Rejected" && (
                  <div className="max-w-md text-sm text-right text-red-600">
                    <span className="font-semibold">
                      Section Head's Remark:
                    </span>
                    <br />
                    {rejectionRemark}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Saved Equipment Table Section */}
          {existingEquipmentTable && renderExistingEquipmentTable()}

          {/* Equipment Selection Table - Only show if no existing equipment table */}
          {!existingEquipmentTable && (
            <div className="p-6 w-full bg-white rounded-lg shadow-sm dark:bg-black">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Select Equipment</h2>
                {selectedEquipment.length > 0 && (
                  <Button
                    onClick={handleSaveEquipment}
                    className="flex gap-2 items-center"
                    variant="outline"
                  >
                    Save Equipment Selection
                  </Button>
                )}
              </div>
              <EquipmentSelectionTable
                onEquipmentSelect={handleEquipmentSelect}
              />
            </div>
          )}

          {/* Saved Result Table Section */}
          {existingResultTable && renderExistingResultTable()}

          {/* Results Table - Only show if no existing result table */}
          {!existingResultTable && (
            <div className="flex flex-col items-center w-full">
              {!showTable ? (
                <Button onClick={handleGenerateTable} className="mt-4">
                  Generate Table
                </Button>
              ) : (
                <div className="p-6 w-full bg-white rounded-lg shadow-sm dark:bg-black">
                  <div className="flex gap-4 justify-end mb-4">
                    <Button
                      onClick={handleDownload}
                      className="flex gap-2 items-center"
                      variant="outline"
                    >
                      <Download className="w-4 h-4" />
                      Save
                    </Button>
                    <Button
                      onClick={handleDelete}
                      className="flex gap-2 items-center"
                      variant="destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                  <h2 className="mb-4 text-2xl font-bold text-center">
                    Result Table
                  </h2>
                  <div className="overflow-x-auto">
                    {showTable && (
                      <HandsTable showTable={showTable} test={test} />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
