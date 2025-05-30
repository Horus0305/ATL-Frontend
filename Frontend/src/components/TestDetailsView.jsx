import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Loader2,
  ArrowLeft,
  Download,
  Trash2,
  FileText,
  Mail,
  Save,
} from "lucide-react";
import { apiRequest, API_URLS } from "@/config/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProformaForm } from "./ProformaForm";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import RORForm from "./RORForm";
import JobCard from "./JobCard";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetHeader,
} from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import {
  setupImageControls,
  setupNotesManagement,
  setupSectionButtons,
  loadSavedContent,
} from "@/utils/reportEditor";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const groupTestsByDepartment = (tests) => {
  return (
    tests?.reduce((acc, test) => {
      // Extract and normalize the main department name
      let mainDepartment =
        test.testType?.split("-")[0]?.trim() || "Uncategorized";

      // Convert department names to match our standard format
      if (mainDepartment.toUpperCase() === "CHEMICAL") {
        mainDepartment = "Chemical";
      } else if (mainDepartment.toUpperCase() === "MECHANICAL") {
        mainDepartment = "Mechanical";
      }

      // Initialize the department if it doesn't exist
      if (!acc[mainDepartment]) {
        acc[mainDepartment] = [];
      }

      acc[mainDepartment].push(test);
      return acc;
    }, {}) || {}
  );
};

const shouldShowDepartment = (department, userRole, tests) => {
  // If not a section head (roles 1 or 2), show all departments
  if (userRole !== 1 && userRole !== 2 && userRole !== 4 && userRole !== 5)
    return true;

  // Get test types for this specific department
  const departmentTests = tests?.filter((test) => {
    const testDepartment = test.testType?.split("-")[0]?.trim().toUpperCase();
    return testDepartment === department.toUpperCase();
  });

  // If no tests for this department, don't show it
  if (!departmentTests?.length) return false;

  // For Chemical Head (role 1)
  if (userRole === 1) {
    // Only show Chemical department
    return department === "Chemical";
  }

  // For Mechanical Head (role 2)
  if (userRole === 2) {
    // Only show Mechanical department
    return department === "Mechanical";
  }

  // For Mechanical Tester (role 4)
  if (userRole === 4) {
    // Only show Mechanical department
    return department === "Mechanical";
  }

  // For Chemical Tester (role 5)
  if (userRole === 5) {
    // Only show Chemical department
    return department === "Chemical";
  }

  return false;
};

// Add this helper function to check job card status
const getJobCardStatus = (testDetails, department) => {
  const jobCard = testDetails?.jobCards?.[department.toLowerCase()];
  if (!jobCard) return null;

  switch (jobCard.status) {
    case 1:
      return { status: "approved", message: "Approved" };
    case 2:
      return {
        status: "rejected",
        message: `Rejected${jobCard.remark ? `: ${jobCard.remark}` : ""}`,
      };
    default:
      return { status: "pending", message: "Pending Approval" };
  }
};

export function TestDetailsView({ test: initialTest, onBack }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testDetails, setTestDetails] = useState(null);
  const [showProformaForm, setShowProformaForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRORForm, setShowRORForm] = useState(false);
  const [showDeleteRORDialog, setShowDeleteRORDialog] = useState(false);
  const [showJobCard, setShowJobCard] = useState(false);
  const [jobCardStatus, setJobCardStatus] = useState(null);
  const [generatedJobCards, setGeneratedJobCards] = useState({});
  const [existingEquipmentTables, setExistingEquipmentTables] = useState({});
  const [existingResultTables, setExistingResultTables] = useState({});
  const [resultRemarks, setResultRemarks] = useState({});
  const [isApprovingTestResults, setIsApprovingTestResults] = useState(false);
  const [isRejectingTestResults, setIsRejectingTestResults] = useState(false);
  const [isSendingReportForApproval, setIsSendingReportForApproval] =
    useState(false);
  const [isApprovingReport, setIsApprovingReport] = useState(false);
  const [isRejectingReport, setIsRejectingReport] = useState(false);
  const [reportRemark, setReportRemark] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const userRole = user.role; // Get the user role
  const [showResultsSheet, setShowResultsSheet] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [testingStandard, setTestingStandard] = useState("");
  const [numberOfResults, setNumberOfResults] = useState(1);
  const [units, setUnits] = useState([""]); // Array to hold units for each result
  const [generatedTable, setGeneratedTable] = useState([]); // State to hold generated table data
  const [testList, setTestList] = useState([]); // State to hold the list of tests to be conducted
  const [isTableGenerated, setIsTableGenerated] = useState(false); // State to track if the table is generated
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false); // State to show delete confirmation dialog
  const [isViewingResults, setIsViewingResults] = useState(false); // State to track if viewing results
  const [sendingForApproval, setSendingForApproval] = useState(false);
  const navigate = useNavigate();
  const [testStatus, setTestStatus] = useState("Status not set");
  const [rejectionRemark, setRejectionRemark] = useState("");
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isEditingEnabled, setIsEditingEnabled] = useState(false);
  const [isReportEmailDialogOpen, setIsReportEmailDialogOpen] = useState(false);
  const [reportEmailSending, setReportEmailSending] = useState(false);
  const [reportDirectorEmails, setReportDirectorEmails] = useState("");
  const [currentReportTest, setCurrentReportTest] = useState(null);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [pendingReports, setPendingReports] = useState([]);

  // Define tabs based on user role
  const tabs = [
    { value: "details", label: "Test Details" },
    { value: "ror", label: "ROR" },
    { value: "invoice", label: "Proforma Invoice" },
    { value: "jobcard", label: "Job Card" },
    { value: "results", label: "Test Results" },
    { value: "report", label: "Report" },
  ];

  // Filter tabs based on user role
  const filteredTabs = tabs.filter((tab) => {
    if (userRole === 3) {
      // Receptionist
      return ["details", "ror", "invoice", "jobcard"].includes(tab.value);
    } else if (userRole === 0 || userRole === 1 || userRole === 2) {
      // Superadmin or Section Heads
      return true; // Show all tabs
    } else if (userRole === 4 || userRole === 5) {
      // Testers
      return ["jobcard", "results"].includes(tab.value);
    }
    return false; // Default case
  });

  // Set default tab to the first one in filteredTabs
  const defaultTabValue =
    filteredTabs.length > 0 ? filteredTabs[0].value : "details";

  useEffect(() => {
    fetchTestDetails();
    if (userRole === 0) { // Only fetch pending reports for superadmin
      fetchPendingReports();
    }
  }, [userRole]);

  useEffect(() => {
    
  }, [initialTest]);

  useEffect(() => {
    if (showReportSheet && selectedReport?.reportUrl) {
      // Initialize editing features when report is loaded
      setTimeout(() => {
        setupImageControls();
        setupNotesManagement();
        setupSectionButtons();
        loadSavedContent();
      }, 100);
    }
  }, [showReportSheet, selectedReport]);

  const fetchTestDetails = async () => {
    try {
      setLoading(true);
      

      const response = await apiRequest(
        `${API_URLS.getTestDetails}/${initialTest._id}`
      );

      if (!response.ok) {
        throw new Error(response.error || "Failed to fetch test details");
      }

      if (!response.test) {
        throw new Error("No test data received");
      }
      
      // Transform the test data to match the expected format
      const transformedData = {
        ...response.test,
        testId: response.test.testId,
        clientName: response.test.clientName,
        emailId: response.test.emailId,
        contactNo: response.test.contactNo,
        address: response.test.address,
        rorUrl: response.test.rorUrl || null,
        proformaUrl: response.test.proformaUrl || null,
        rorStatus: response.test.rorStatus || 0,
        proformaStatus: response.test.proformaStatus || 0,
        tests: response.test.tests?.map((t) => {
          // Log each test's transformation
          
          
          // Ensure testReportApproval is a number
          const testReportApproval = typeof t.testReportApproval === 'number' 
            ? t.testReportApproval 
            : parseInt(t.testReportApproval) || 0;
          
          
          
          return {
            atlId: t.atlId || "",
            date: t.date || "",
            material: t.material || "",
            materialId: t.materialId || "",
            quantity: t.quantity || "",
            testType: t.testType || "",
            testReportApproval, // Use the transformed value
            tests: t.tests?.map((test) => ({
              test: test.test,
              standard: test.standard,
              testResult: test.testResult || "",
              unit: test.unit || "",
            })) || [],
            reporturl: t.reporturl || "",
          };
        }) || [],
      };

     

      setTestDetails(transformedData);
      setLoading(false);
    } catch (error) {
      
      setError(error.message);
      setLoading(false);
    }
  };

  const fetchPendingReports = async () => {
    try {
      const response = await apiRequest(
        `${API_URLS.TESTS}/reports/pending-approval`
      );

      if (!response.ok) {
        throw new Error(response.error || "Failed to fetch pending reports");
      }

      
      setPendingReports(response.tests || []);
    } catch (error) {
      
      toast({
        title: "Error",
        description: "Failed to fetch pending reports",
        variant: "destructive",
      });
    }
  };

  const handleProformaSuccess = () => {
    setShowProformaForm(false);
    fetchTestDetails();
    toast({
      title: "Success",
      description: "Proforma created successfully",
    });
  };

  const deleteProforma = async () => {
    try {
      const response = await apiRequest(
        `${API_URLS.deleteProforma}/${testDetails._id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(response.error || "Failed to delete proforma");
      }

      toast({
        title: "Success",
        description: "Proforma deleted successfully",
      });

      setShowDeleteDialog(false);
      fetchTestDetails();
    } catch (error) {
      console.error("Error deleting proforma:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete proforma",
        variant: "destructive",
      });
    }
  };

  const handleDownloadProforma = () => {
    try {
      // Create a Blob from the base64 string
      const byteCharacters = atob(testDetails.proformaUrl);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `proforma_${testDetails.testId}.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading proforma:", error);
      toast({
        title: "Error",
        description: "Failed to download proforma",
        variant: "destructive",
      });
    }
  };

  const handleRORSuccess = () => {
    setShowRORForm(false);
    fetchTestDetails();
    toast({
      title: "Success",
      description: "ROR generated successfully",
    });
  };

  const handleDownloadROR = () => {
    try {
      const byteCharacters = atob(testDetails.rorUrl);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ror_${testDetails.testId}.pdf`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading ROR:", error);
      toast({
        title: "Error",
        description: "Failed to download ROR",
        variant: "destructive",
      });
    }
  };

  const deleteROR = async () => {
    try {
      const response = await apiRequest(
        `${API_URLS.deleteROR}/${testDetails._id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(response.error || "Failed to delete ROR");
      }

      setShowDeleteRORDialog(false);
      fetchTestDetails();
      toast({
        title: "Success",
        description: "ROR deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting ROR:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete ROR",
        variant: "destructive",
      });
    }
  };

  const handleJobCardAction = async () => {
    try {
      if (
        !testDetails?.jobCards ||
        Object.keys(testDetails?.jobCards || {}).length === 0
      ) {
        // Generate new job cards
        const response = await apiRequest(
          `${API_URLS.TESTS}/${testDetails._id}/jobcard`,
          {
            method: "POST",
            body: JSON.stringify({
              departments: Object.keys(
                groupTestsByDepartment(testDetails?.tests || [])
              ).filter((dept) => dept !== "Uncategorized"),
            }),
          }
        );

        if (response.ok) {
          setShowJobCard(true);
          setJobCardStatus("generated");
          setTestDetails((prev) => ({
            ...prev,
            jobCards: response.test.jobCards,
          }));
          toast({
            title: "Success",
            description: "Job cards generated successfully",
          });
        }
      } else {
        // Send for approval
        const response = await apiRequest(
          `${API_URLS.TESTS}/${testDetails._id}/jobcard/send`,
          {
            method: "POST",
            body: JSON.stringify({
              departments: Object.keys(
                groupTestsByDepartment(testDetails?.tests || [])
              ).filter((dept) => dept !== "Uncategorized"),
            }),
          }
        );

        if (response.ok) {
          setJobCardStatus("sent_for_approval");
          setTestDetails((prev) => ({
            ...prev,
            status: "Job Card Sent for Approval",
          }));
          toast({
            title: "Success",
            description: "Job cards sent for approval",
          });
        }
      }
    } catch (error) {
      console.error("Error handling job card action:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to handle job card action",
        variant: "destructive",
      });
    }
  };

  const handleJobCardApproval = async (department, action) => {
    try {
      const endpoint =
        action === "approve"
          ? API_URLS.approveJobCard(testDetails._id)
          : API_URLS.rejectJobCard(testDetails._id);

      const response = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify({ department }),
      });

      if (response.ok) {
        setTestDetails((prev) => ({
          ...prev,
          jobCards: {
            ...prev.jobCards,
            [department.toLowerCase()]: {
              ...prev.jobCards[department.toLowerCase()],
              status: action === "approve" ? 1 : 2,
            },
          },
          status:
            action === "approve"
              ? "Job Assigned to Testers"
              : "Job Card Rejected",
        }));

        toast({
          title: "Success",
          description: `Job card ${
            action === "approve" ? "approved" : "rejected"
          } successfully`,
        });
      }
    } catch (error) {
      console.error(`Error ${action}ing job card:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} job card`,
        variant: "destructive",
      });
    }
  };

  const renderProformaContent = () => {
    if (!testDetails) return null;

    if (testDetails.proformaStatus === 1 && testDetails.proformaUrl) {
      return (
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Proforma Invoice</h3>
            <div className="flex gap-2">
              <Button
                onClick={handleDownloadProforma}
                className="flex gap-2 items-center"
              >
                <Download className="w-4 h-4" />
                Download Proforma
              </Button>

              <Dialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="flex gap-2 items-center"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Proforma
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Proforma</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this proforma? This action
                      cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={deleteProforma}>
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="w-full h-[600px] border border-border rounded-lg overflow-hidden">
            <iframe
              src={`data:application/pdf;base64,${testDetails.proformaUrl}`}
              width="100%"
              height="100%"
              title="Proforma Invoice"
              className="w-full h-full"
            />
          </div>
        </div>
      );
    }

    return renderProformaTab();
  };

  const renderProformaTab = () => {
    if (!testDetails) return null;

    // Check if user is not a receptionist (role 3)
    if (user.role !== 3) {
      return (
        <div className="p-4 text-center">
          <p className="text-gray-600">
            Only receptionists can generate proforma invoices.
          </p>
        </div>
      );
    }

    if (testDetails.proformaStatus === 0) {
      if (showProformaForm) {
        return (
          <ProformaForm
            testData={testDetails}
            onSuccess={handleProformaSuccess}
          />
        );
      }
      return (
        <div className="flex justify-center p-8">
          <Button
            onClick={() => setShowProformaForm(true)}
            className="text-white bg-black hover:bg-black/90"
          >
            Get Proforma Form
          </Button>
        </div>
      );
    }

    return (
      <div className="p-4">
        <h3 className="mb-4 text-lg font-semibold">Proforma Invoice</h3>
        <p>Proforma invoice has been generated.</p>
      </div>
    );
  };

  const renderRORContent = () => {
    if (!testDetails) return null;

    if (testDetails.rorStatus === 1 && testDetails.rorUrl) {
      return (
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">ROR Document</h3>
            <div className="flex gap-2">
              <Button
                onClick={handleDownloadROR}
                className="flex gap-2 items-center"
              >
                <Download className="w-4 h-4" />
                Download ROR
              </Button>

              <Dialog
                open={showDeleteRORDialog}
                onOpenChange={setShowDeleteRORDialog}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="flex gap-2 items-center"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete ROR
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete ROR</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this ROR? This action
                      cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteRORDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={deleteROR}>
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="w-full h-[600px] border border-border rounded-lg overflow-hidden">
            <iframe
              src={`data:application/pdf;base64,${testDetails.rorUrl}`}
              width="100%"
              height="100%"
              title="ROR Document"
              className="w-full h-full"
            />
          </div>
        </div>
      );
    }

    // Show ROR form for receptionist
    if (user.role === 3) {
      if (showRORForm) {
        return <RORForm testData={testDetails} onSuccess={handleRORSuccess} />;
      }
      return (
        <div className="flex justify-center p-8">
          <Button
            onClick={() => setShowRORForm(true)}
            className="text-white bg-black hover:bg-black/90"
          >
            Get ROR Form
          </Button>
        </div>
      );
    }

    return (
      <div className="p-4 text-center">
        <p className="text-gray-600">
          Only receptionists can generate ROR documents.
        </p>
      </div>
    );
  };

  const handleGenerateJobCard = async (department, tests) => {
    try {
      const response = await apiRequest(`${API_URLS.TESTS}/jobcard`, {
        method: "POST",
        data: {
          testId: testDetails._id,
          department,
          tests,
        },
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Job card generated successfully",
        });
      }
    } catch (error) {
      console.error("Error generating job card:", error);
      toast({
        title: "Error",
        description: "Failed to generate job card",
        variant: "destructive",
      });
    }
  };

  const handleGenerateInitialJobCard = async () => {
    try {
      const groupedTests = groupTestsByDepartment(testDetails?.tests || []);
      const departments = Object.keys(groupedTests).filter(
        (dept) => dept !== "Uncategorized"
      );

      const response = await apiRequest(
        `${API_URLS.TESTS}/${testDetails._id}/jobcard`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            departments,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate job cards");
      }

      // Update local state immediately
      setTestDetails((prev) => ({
        ...prev,
        status: "Job Card Created",
        jobCards: response.test.jobCards,
      }));

      toast({
        title: "Success",
        description: "Job cards generated successfully",
      });
    } catch (error) {
      console.error("Error generating initial job cards:", error);
      toast({
        title: "Error",
        description: "Failed to generate job cards",
        variant: "destructive",
      });
    }
  };

  const handleSendForApproval = async () => {
    try {
      const groupedTests = groupTestsByDepartment(testDetails?.tests || []);
      const departments = Object.keys(groupedTests).filter(
        (dept) => dept !== "Uncategorized"
      );

      const response = await apiRequest(
        `${API_URLS.TESTS}/${testDetails._id}/jobcard/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            departments,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send job cards for approval");
      }

      await fetchTestDetails();
      toast({
        title: "Success",
        description: "Job cards sent for approval",
      });
    } catch (error) {
      console.error("Error sending job cards for approval:", error);
      toast({
        title: "Error",
        description: "Failed to send job cards for approval",
        variant: "destructive",
      });
    }
  };

  const renderJobCardTab = () => {
    if (!testDetails) return null;

    const validStatuses = [
      "ROR and Proforma Mailed to Client",
      "Job Card Created",
      "Job Card Sent for Approval",
      "Job Assigned to Testers",
      "Test Values Added",
      "Test Values Approved",
      "Test Values Rejected",
      "Report Generated",
      "Report Approved",
      "Completed",
    ];

    // Always show job cards if they exist, regardless of status
    if (testDetails?.jobCards && Object.keys(testDetails.jobCards).length > 0) {
      return (
        <div className="p-6 rounded-lg border shadow-sm bg-card border-border">
          <div className="flex justify-between items-center pb-2 mb-4 border-b border-border">
            <h3 className="text-lg font-semibold">Job Cards</h3>
            {user.role === 3 && testDetails.status === "Job Card Created" && (
              <Button
                onClick={handleSendForApproval}
                disabled={sendingForApproval}
                className="flex gap-2 items-center"
              >
                {sendingForApproval ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Sending for Approval...
                  </>
                ) : (
                  <FileText className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>

          {/* Show job cards */}
          {Object.entries(groupTestsByDepartment(testDetails?.tests || [])).map(
            ([department, tests]) => {
              if (department === "Uncategorized") return null;

              const shouldShow = shouldShowDepartment(
                department,
                user?.role,
                testDetails?.tests || []
              );

              const jobCardStatus = getJobCardStatus(testDetails, department);

              return shouldShow ? (
                <div key={department} className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-4 items-center">
                      <h4 className="font-medium text-md">{department}</h4>
                      {jobCardStatus && (
                        <span
                          className={`px-2 py-1 rounded-full text-sm ${
                            jobCardStatus.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : jobCardStatus.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {jobCardStatus.message}
                        </span>
                      )}
                    </div>

                    {/* Show approve button for section heads */}
                    {(user?.role === 1 || user?.role === 2) &&
                      testDetails.status === "Job Card Sent for Approval" &&
                      (!testDetails.jobCards?.[department.toLowerCase()]
                        ?.status ||
                        testDetails.jobCards[department.toLowerCase()]
                          .status === 0) && (
                        <div>
                          <Button
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() =>
                              handleJobCardApproval(department, "approve")
                            }
                          >
                            Approve
                          </Button>
                        </div>
                      )}
                  </div>

                  <JobCard
                    data={{
                      date: testDetails.date,
                      department,
                      test: tests,
                      status: jobCardStatus?.status,
                      remark:
                        testDetails?.jobCards?.[department.toLowerCase()]
                          ?.remark,
                    }}
                  />
                </div>
              ) : null;
            }
          )}
        </div>
      );
    }

    // If no job cards exist and status is appropriate, show generate button
    if (testDetails.status === "ROR and Proforma Mailed to Client") {
      return (
        <div className="p-6 rounded-lg border shadow-sm bg-card border-border">
          <div className="p-4 text-center">
            <Button
              onClick={handleGenerateInitialJobCard}
              className="text-white bg-black hover:bg-black/90"
            >
              Generate Job Card
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 rounded-lg border shadow-sm bg-card border-border">
        <div className="p-4 text-center">
          <p className="mb-4 text-gray-600">
            Job cards can only be generated after ROR and Proforma have been
            mailed to the client.
          </p>
          <Button
            disabled
            className="text-white cursor-not-allowed bg-black/50"
          >
            Generate Job Card
          </Button>
        </div>
      </div>
    );
  };

  const handleAddResults = (test) => {
    // Use the full path to ensure proper routing
    const currentPath = window.location.pathname;
    navigate(`${currentPath}/add`, { state: { test } });
  };

  const handleViewResults = async (test) => {
    setSelectedTest(test);
    setShowResultsSheet(true);
    setIsViewingResults(true);
    setTestList(test.tests || []);

    try {
      const testId = testDetails._id;
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
          const tableKey = `${test.atlId}-${test.testType}-${test.material}`;

          if (testDetail.equipmenttable) {
            console.log("Found existing equipment table for:", test.material);
            setExistingEquipmentTables((prev) => ({
              ...prev,
              [tableKey]: testDetail.equipmenttable,
            }));
          }

          if (testDetail.resulttable) {
            console.log("Found existing result table for:", test.material);
            setExistingResultTables((prev) => ({
              ...prev,
              [tableKey]: testDetail.resulttable,
            }));
          }

          // Set test result status if available
          if (testDetail.testResultStatus) {
            setTestStatus(testDetail.testResultStatus);
          } else {
            setTestStatus("Status not set");
          }

          // Set rejection remark if available
          if (testDetail.testResultRemark) {
            setRejectionRemark(testDetail.testResultRemark);
          }
        }
      }
    } catch (error) {
      console.error("Error checking for existing tables:", error);
      toast({
        title: "Error",
        description: "Failed to fetch test results",
        variant: "destructive",
      });
    }
  };

  const handleApproveTestResults = async () => {
    try {
      setIsApprovingTestResults(true);
      const response = await apiRequest(
        `${API_URLS.TESTS}/${testDetails._id}/approve-results`,
        {
          method: "POST",
          body: JSON.stringify({
            atlId: selectedTest.atlId,
            testType: selectedTest.testType,
            material: selectedTest.material,
            status: "Test Values Approved", // Explicitly set the status
          }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Test results approved successfully",
        });
        closeResultsSheet();
        fetchTestDetails();
      }
    } catch (error) {
      console.error("Error approving test results:", error);
      toast({
        title: "Error",
        description: "Failed to approve test results",
        variant: "destructive",
      });
    } finally {
      setIsApprovingTestResults(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const response = await apiRequest(
        `${API_URLS.TESTS}/${testDetails._id}/generate-report`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Report generation initiated successfully",
        });
        fetchTestDetails();
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    }
  };

  const handleRejectTestResults = async () => {
    const remarkKey = `${selectedTest.atlId}-${selectedTest.testType}-${selectedTest.material}`;
    const currentRemark = resultRemarks[remarkKey];

    if (!currentRemark?.trim()) {
      toast({
        title: "Error",
        description: "Please provide a remark for rejection",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRejectingTestResults(true);
      const response = await apiRequest(
        `${API_URLS.TESTS}/${testDetails._id}/reject-results`,
        {
          method: "POST",
          body: JSON.stringify({
            atlId: selectedTest.atlId,
            testType: selectedTest.testType,
            material: selectedTest.material,
            remark: currentRemark.trim(),
          }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Test results rejected successfully",
        });
        closeResultsSheet();
        fetchTestDetails();
      }
    } catch (error) {
      console.error("Error rejecting test results:", error);
      toast({
        title: "Error",
        description: "Failed to reject test results",
        variant: "destructive",
      });
    } finally {
      setIsRejectingTestResults(false);
    }
  };

  const handleRemarkChange = (value) => {
    const remarkKey = `${selectedTest.atlId}-${selectedTest.testType}-${selectedTest.material}`;
    setResultRemarks((prev) => ({
      ...prev,
      [remarkKey]: value,
    }));
  };

  const closeResultsSheet = () => {
    setShowResultsSheet(false);
    setSelectedTest(null);
  };

  // Function to filter tests based on user role
  const getFilteredTests = () => {
    if (userRole === 4) {
      // Mechanical Tester
      return testDetails.tests.filter(
        (test) =>
          test.testType?.split("-")[0]?.trim().toUpperCase() === "MECHANICAL"
      );
    } else if (userRole === 5) {
      // Chemical Tester
      return testDetails.tests.filter(
        (test) =>
          test.testType?.split("-")[0]?.trim().toUpperCase() === "CHEMICAL"
      );
    } else if (userRole === 1) {
      // Chemical Section Head
      return testDetails.tests.filter(
        (test) =>
          test.testType?.split("-")[0]?.trim().toUpperCase() === "CHEMICAL"
      );
    } else if (userRole === 2) {
      // Mechanical Section Head
      return testDetails.tests.filter(
        (test) =>
          test.testType?.split("-")[0]?.trim().toUpperCase() === "MECHANICAL"
      );
    }
    return testDetails.tests; // Default case, return all tests
  };

  // Function to filter reports for the current user
  const getFilteredReportsForUser = () => {
    if (userRole === 0) {
      // For superadmin, return the pending reports for the current test
      const currentTestPendingReports = pendingReports.find(
        test => test._id === testDetails._id
      );
      return currentTestPendingReports?.tests || [];
    }
    // Section heads and others: show all reports for their department
    return getFilteredTests();
  };

  const handleViewReport = async (test) => {
    try {
      const testIndex = testDetails.tests.findIndex(
        (t) =>
          t.atlId === test.atlId &&
          t.testType === test.testType &&
          t.material === test.material
      );

      if (testIndex !== -1) {
        const testDetail = testDetails.tests[testIndex];
        setSelectedReport({
          ...test,
          reportUrl: testDetail.reporturl,
          testReportApproval: testDetail.testReportApproval // Make sure to include testReportApproval
        });
        setShowReportSheet(true);
        setIsEditingEnabled(false); // Reset editing state when opening new report

        // Initialize editing features when report is loaded
        setTimeout(() => {
          setupImageControls();
          setupNotesManagement();
          setupSectionButtons();
          loadSavedContent();
        }, 100);
      } else {
        toast({
          title: "Error",
          description: "Could not find report details",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast({
        title: "Error",
        description: "Failed to load report",
        variant: "destructive",
      });
    }
  };

  const saveReportToDatabase = async (content) => {
    try {
      setIsSavingReport(true);
      
      // Prepare the request payload with the correct field names
      const payload = {
        atlId: selectedReport.atlId,
        testType: selectedReport.testType,
        material: selectedReport.material,
        reportHtml: content // Changed from reportUrl to reportHtml
      };

      console.log("Saving report with payload:", payload);

      const response = await apiRequest(
        API_URLS.editReport(testDetails._id),
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(response.error || "Failed to save report changes");
      }

      // Update local state
      setSelectedReport(prev => ({
        ...prev,
        reportUrl: content
      }));

      // Update the test details state to reflect the changes
      setTestDetails(prev => ({
        ...prev,
        tests: prev.tests.map(test => {
          if (test.atlId === selectedReport.atlId && 
              test.testType === selectedReport.testType && 
              test.material === selectedReport.material) {
            return {
              ...test,
              reporturl: content
            };
          }
          return test;
        })
      }));

      toast({
        title: "Success",
        description: "Report changes saved successfully",
      });
    } catch (error) {
      console.error("Error saving report:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save report changes",
        variant: "destructive",
      });
      throw error; // Re-throw to handle in the calling function
    } finally {
      setIsSavingReport(false);
    }
  };

  const toggleReportEditing = async () => {
    const reportContainer = document.querySelector(".report-container");
    if (!reportContainer) return;

    // If we're currently in editing mode and about to disable it, save the content
    if (isEditingEnabled) {
      try {
        // First disable editing mode to hide all control elements
        setIsEditingEnabled(false);
        
        // Find all editable elements within the report container
        const contentElements = reportContainer.querySelectorAll("p, h1, td, span");
        contentElements.forEach((element) => {
          if (!element.querySelector("img")) {
            element.contentEditable = false;
            element.style.cursor = "default";
            element.onmouseover = null;
            element.onmouseout = null;
          }
        });

        // Hide section buttons
        const addButtons = reportContainer.querySelectorAll(".add-section-btn");
        addButtons.forEach((button) => {
          button.style.display = "none";
        });

        // Hide notes management
        const notesContainer = reportContainer.querySelector("#notesContainer");
        const addNoteBtn = reportContainer.querySelector("#addNoteBtn");
        if (notesContainer) notesContainer.style.pointerEvents = "none";
        if (addNoteBtn) addNoteBtn.style.display = "none";

        // Hide image controls
        const imageControls = reportContainer.querySelectorAll(".image-controls");
        imageControls.forEach((control) => {
          control.style.display = "none";
          const container = control.parentElement;
          container.onmouseover = null;
          container.onmouseout = null;
        });

        // Now get the content and save it
        const content = reportContainer.innerHTML;
        await saveReportToDatabase(content);
        
      } catch (error) {
        // If save failed, re-enable editing and show error
        console.error("Failed to save report:", error);
        setIsEditingEnabled(true);
        toast({
          title: "Error",
          description: "Failed to save changes. Please try again.",
          variant: "destructive",
        });
        return;
      }
    } else {
      // If we're enabling editing, set the state and setup edit controls
      setIsEditingEnabled(true);
      
      // Find all editable elements within the report container
      const contentElements = reportContainer.querySelectorAll("p, h1, td, span");
      contentElements.forEach((element) => {
        if (!element.querySelector("img")) {
          element.contentEditable = true;
          element.style.cursor = "text";

          element.addEventListener("mouseover", function () {
            this.style.backgroundColor = "#f0f0f0";
          });

          element.addEventListener("mouseout", function () {
            this.style.backgroundColor = "";
          });
        }
      });

      // Show section buttons
      const addButtons = reportContainer.querySelectorAll(".add-section-btn");
      addButtons.forEach((button) => {
        button.style.display = "inline-block";
      });

      // Enable notes management
      const notesContainer = reportContainer.querySelector("#notesContainer");
      const addNoteBtn = reportContainer.querySelector("#addNoteBtn");
      if (notesContainer) notesContainer.style.pointerEvents = "auto";
      if (addNoteBtn) addNoteBtn.style.display = "block";

      // Setup image controls
      const imageControls = reportContainer.querySelectorAll(".image-controls");
      imageControls.forEach((control) => {
        const container = control.parentElement;
        container.addEventListener("mouseover", () => (control.style.display = "block"));
        container.addEventListener("mouseout", () => (control.style.display = "none"));
      });

      // Setup auto-save
      const editableNodes = reportContainer.querySelectorAll('[contenteditable="true"]');
      editableNodes.forEach((element) => {
        element.addEventListener("input", () => {
          clearTimeout(window.autoSaveTimeout);
          window.autoSaveTimeout = setTimeout(async () => {
            const content = reportContainer.innerHTML;
            const reportKey = `report_${selectedReport.atlId}_${selectedReport.testType}_${selectedReport.material}`;
            localStorage.setItem(reportKey, content);
            localStorage.setItem(`${reportKey}_lastSaved`, new Date().toISOString());
          }, 2000);
        });
      });
    }
  };

  const handleSendIndividualReportForApproval = async () => {
    try {
      setIsSendingReportForApproval(true);
      const response = await apiRequest(
        API_URLS.sendIndividualReportForApproval(testDetails._id),
        {
          method: "POST",
          body: JSON.stringify({
            atlId: selectedReport.atlId,
            testType: selectedReport.testType,
            material: selectedReport.material,
          }),
        }
      );

      if (response.ok) {
        console.log("Response from send for approval:", response);
        
        // Update the local state to reflect the change in approval status
        setTestDetails(prev => ({
          ...prev,
          tests: prev.tests.map(test => {
            if (
              test.atlId === selectedReport.atlId &&
              test.testType === selectedReport.testType &&
              test.material === selectedReport.material
            ) {
              return {
                ...test,
                testReportApproval: response.testReportApproval // Use the value from the response
              };
            }
            return test;
          })
        }));

        // Update the selected report state
        setSelectedReport(prev => ({
          ...prev,
          testReportApproval: response.testReportApproval // Use the value from the response
        }));

        toast({
          title: "Success",
          description: "Report sent for approval successfully",
        });
        setShowReportSheet(false);
      }
    } catch (error) {
      console.error("Error sending report for approval:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send report for approval",
        variant: "destructive",
      });
    } finally {
      setIsSendingReportForApproval(false);
    }
  };

  const handleApproveIndividualReport = async () => {
    try {
      setIsApprovingReport(true);
      const response = await apiRequest(
        API_URLS.approveIndividualReport(testDetails._id),
        {
          method: "POST",
          body: JSON.stringify({
            atlId: selectedReport.atlId,
            testType: selectedReport.testType,
            material: selectedReport.material,
          }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Report approved successfully",
        });
        setShowReportSheet(false);
        fetchTestDetails();
      }
    } catch (error) {
      console.error("Error approving report:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve report",
        variant: "destructive",
      });
    } finally {
      setIsApprovingReport(false);
    }
  };

  const handleRejectIndividualReport = async () => {
    if (!reportRemark.trim()) {
      toast({
        title: "Error",
        description: "Please provide a remark for rejection",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRejectingReport(true);
      const response = await apiRequest(
        API_URLS.rejectIndividualReport(testDetails._id),
        {
          method: "POST",
          body: JSON.stringify({
            atlId: selectedReport.atlId,
            testType: selectedReport.testType,
            material: selectedReport.material,
            remark: reportRemark.trim(),
          }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Report rejected successfully",
        });
        setShowReportSheet(false);
        fetchTestDetails();
      }
    } catch (error) {
      console.error("Error rejecting report:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject report",
        variant: "destructive",
      });
    } finally {
      setIsRejectingReport(false);
    }
  };

  const handleOpenReportEmailDialog = (test) => {
    setCurrentReportTest(test);
    setReportDirectorEmails("");
    setIsReportEmailDialogOpen(true);
  };

  const handleSendReportEmail = async () => {
    if (!currentReportTest) return;
    try {
      setReportEmailSending(true);
      const ccEmails = reportDirectorEmails
        .split(/[\,\s]+/)
        .map((email) => email.trim())
        .filter((email) => email.length > 0);
      const response = await apiRequest(
        `${API_URLS.TESTS}/${testDetails._id}/send-report-mail`,
        {
          method: "POST",
          body: JSON.stringify({
            ccEmails,
            atlId: currentReportTest.atlId,
            testType: currentReportTest.testType,
            material: currentReportTest.material,
          }),
        }
      );
      if (response.ok) {
        toast({
          title: "Success",
          description:
            "Report sent successfully to client and CC'd to directors",
        });
        setIsReportEmailDialogOpen(false);
        fetchTestDetails();
      } else {
        throw new Error(response.error || "Failed to send report email");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send report email",
      });
    } finally {
      setReportEmailSending(false);
    }
  };

  const renderReportSheet = () => {
    if (!selectedReport) return null;

    // Add styles for report container
    const reportContainerStyles = {
      minHeight: "500px",
      backgroundColor: "#ffffff",
      border: "1px solid #e2e8f0",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      position: "relative",
    };

    // Get the approval status for the current report
    const currentTest = testDetails.tests.find(
      t =>
        t.atlId === selectedReport.atlId &&
        t.testType === selectedReport.testType &&
        t.material === selectedReport.material
    );
    const approvalStatus = currentTest?.testReportApproval || 0;

    return (
      <Sheet open={showReportSheet} onOpenChange={setShowReportSheet}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-5xl h-[100vh] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>Test Report</SheetTitle>
            <SheetDescription>
              ATL ID: {selectedReport.atlId} | Material: {selectedReport.material}
              {approvalStatus === 1 && (
                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                  Pending Approval
                </span>
              )}
              {approvalStatus === 2 && (
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  Approved
                </span>
              )}
              {approvalStatus === -1 && (
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                  Rejected
                </span>
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={toggleReportEditing}
                  className="flex items-center gap-2"
                  disabled={isSavingReport || approvalStatus === 2} // Disable editing if report is approved
                >
                  {isEditingEnabled ? (
                    <>
                      <FileText className="h-4 w-4" />
                      Disable Editing
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Enable Editing
                    </>
                  )}
                </Button>
                {isSavingReport && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving changes...
                  </div>
                )}
              </div>

              {/* Show send for approval button for section heads */}
              {(userRole === 1 || userRole === 2) &&
                approvalStatus === 0 && (
                  <Button
                    onClick={handleSendIndividualReportForApproval}
                    disabled={isSendingReportForApproval}
                    className="flex gap-2 items-center"
                  >
                    {isSendingReportForApproval ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Sending for Approval...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        Send for Approval
                      </>
                    )}
                  </Button>
                )}

              {/* Show approve/reject buttons for superadmin */}
              {userRole === 0 && (
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Textarea
                      placeholder="Enter rejection remark..."
                      value={reportRemark}
                      onChange={(e) => setReportRemark(e.target.value)}
                      className="mb-2"
                    />
                    <Button
                      variant="destructive"
                      onClick={handleRejectIndividualReport}
                      disabled={isRejectingReport}
                      className="w-full"
                    >
                      {isRejectingReport ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        "Reject Report"
                      )}
                    </Button>
                  </div>
                  <Button
                    onClick={handleApproveIndividualReport}
                    disabled={isApprovingReport}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isApprovingReport ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      "Approve Report"
                    )}
                  </Button>
                </div>
              )}

              {/* Show rejection remark if report is rejected */}
              {approvalStatus === -1 && currentTest?.reportRemark && (
                <div className="mt-2 p-2 bg-red-50 text-red-800 rounded">
                  <p className="font-medium">Rejection Remark:</p>
                  <p>{currentTest.reportRemark}</p>
                </div>
              )}
            </div>

            {selectedReport.reportUrl ? (
              <div
                className="p-4 mt-4 rounded-lg border report-container"
                style={reportContainerStyles}
                dangerouslySetInnerHTML={{ __html: selectedReport.reportUrl }}
              />
            ) : (
              <div className="p-4 mt-4 text-center rounded-lg border text-muted-foreground">
                No report has been generated yet.
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 bg-background text-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading test details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500 bg-background">
        <p>Error: {error}</p>
        <Button onClick={fetchTestDetails} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!testDetails) {
    return (
      <div className="p-4 text-center bg-background text-foreground">
        No test details found
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-[1200px] mx-auto w-full">
      {/* Header with back button */}
      <div className="flex justify-between items-center pb-4 mb-6 border-b">
        <div className="flex gap-4 items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex gap-2 items-center text-sm hover:bg-gray-100 dark:hover:text-black"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold">Test Details</h2>
            <p className="text-sm text-muted-foreground">
              Test ID: {testDetails?.testId}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTabValue} className="w-full">
        <TabsList className="p-1 w-full h-12 rounded-lg bg-card">
          {filteredTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-1 h-10 data-[state=active]:bg-gray-200 dark:data-[state=active]:bg-gray-500 data-[state=active]:border data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md transition-all"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {filteredTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-6">
            {tab.value === "details" && (
              <div className="p-6 rounded-lg border shadow-sm bg-card border-border">
                {/* Client Details Section */}
                <div>
                  <h4 className="pb-2 mb-4 text-lg font-semibold border-b">
                    Client Details
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <span className="font-medium min-w-[120px] text-foreground">
                          Client Name:
                        </span>
                        <span>{testDetails.clientName}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-medium min-w-[120px] text-foreground">
                          Email ID:
                        </span>
                        <span>{testDetails.emailId}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <span className="font-medium min-w-[120px] text-foreground">
                          Contact No.:
                        </span>
                        <span>{testDetails.contactNo}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-medium min-w-[120px] text-foreground">
                          Address:
                        </span>
                        <span>{testDetails.address}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <br />
                {/* Test Details Table */}
                <div>
                  <h4 className="pb-2 mb-2 text-lg font-semibold border-b"></h4>
                  <h4 className="pb-2 mb-4 text-lg font-semibold border-b">
                    Test Details
                  </h4>
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ATL ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Material</TableHead>
                          <TableHead>Material ID</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Test</TableHead>
                          <TableHead>Standards</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {testDetails?.tests?.map((test, index) => (
                          <TableRow key={index}>
                            <TableCell>{test.atlId}</TableCell>
                            <TableCell>{test.date}</TableCell>
                            <TableCell>{test.material}</TableCell>
                            <TableCell>{test.materialId}</TableCell>
                            <TableCell>{test.quantity}</TableCell>
                            <TableCell>
                              {test.tests?.map((t) => t.test).join(", ") || ""}
                            </TableCell>
                            <TableCell>
                              {test.tests?.map((t) => t.standard).join(", ") ||
                                ""}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
            {tab.value === "ror" && renderRORContent()}
            {tab.value === "invoice" && renderProformaContent()}
            {tab.value === "jobcard" && renderJobCardTab()}
            {tab.value === "results" && (
              <div className="p-6 rounded-lg border shadow-sm bg-card border-border">
                <div className="flex justify-between items-center">
                  <h3 className="pb-2 mb-4 text-lg font-semibold border-b border-border">
                    Test Results
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {getFilteredTests().map((test, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-6 rounded-lg border shadow-md"
                    >
                      <h4 className="font-semibold">{test.material}</h4>
                      <p>ATL ID: {test.atlId}</p>
                      <p>Quantity: {test.quantity}</p>
                      <p>
                        Standard:{" "}
                        {test.tests?.map((t) => t.standard).join(", ") || "N/A"}
                      </p>
                      {userRole === 4 || userRole === 5 ? (
                        <Button
                          onClick={() => handleAddResults(test)}
                          className="mt-2"
                        >
                          Add Results
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleViewResults(test)}
                          className="mt-2"
                        >
                          View Results
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab.value === "report" && (
              <div className="p-6 rounded-lg border shadow-sm bg-card border-border">
                <div className="flex justify-between items-center">
                  <h3 className="pb-2 mb-4 text-lg font-semibold border-b border-border">
                    Test Reports
                  </h3>
                  {(userRole === 1 || userRole === 2) &&
                    testDetails.status === "Test Values Approved" && (
                      <Button
                        onClick={handleGenerateReport}
                        className="text-white bg-green-600 hover:bg-green-700"
                      >
                        Generate Reports
                      </Button>
                    )}
                </div>
                {["Report Generated", "Report Sent for Approval", "Report Approved", "Report Rejected", "Report Mailed to Client", "Completed"].includes(testDetails.status) ? (
                  <div className="grid grid-cols-1 gap-4">
                    {getFilteredReportsForUser().map((test, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-6 rounded-lg border shadow-md"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold">{test.material}</h4>
                          <p>ATL ID: {test.atlId}</p>
                          <p>Quantity: {test.quantity}</p>
                          <p>
                            Standard:{" "}
                            {test.tests?.map((t) => t.standard).join(", ") ||
                              "N/A"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleViewReport(test)}
                            className="mt-2"
                          >
                            View Details
                          </Button>
                          {(userRole === 1 || userRole === 2) &&
                            testDetails.status === "Report Approved" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenReportEmailDialog(test)}
                                className="flex items-center gap-1"
                              >
                                <Mail className="h-4 w-4" />
                                Send Report Email
                              </Button>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <p>Reports will be available after test values have been approved by the section head.</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Results Sheet */}
      <Sheet open={showResultsSheet} onOpenChange={closeResultsSheet}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-5xl h-[100vh] overflow-y-auto"
        >
          <SheetTitle>
            {isViewingResults ? "View Test Results" : "Add Test Results"}
          </SheetTitle>
          <div className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium">Test ID:</label>
                <span>{selectedTest?.atlId}</span>
              </div>
              <div>
                <label className="block mb-2 font-medium">Material:</label>
                <span>{selectedTest?.material}</span>
              </div>
              <div>
                <label className="block mb-2 font-medium">Date:</label>
                <span>{new Date(selectedTest?.date).toLocaleDateString()}</span>
              </div>
              <div>
                <label className="block mb-2 font-medium">Test Type:</label>
                <span>{selectedTest?.testType}</span>
              </div>
            </div>

            {/* Display Equipment and Result Tables */}
            {selectedTest && (
              <>
                {existingEquipmentTables[
                  `${selectedTest.atlId}-${selectedTest.testType}-${selectedTest.material}`
                ] && (
                  <div className="mt-6">
                    <h3 className="mb-4 text-lg font-semibold">
                      Equipment Details for {selectedTest.material}
                    </h3>
                    <div
                      className="overflow-auto p-4 rounded-lg border"
                      dangerouslySetInnerHTML={{
                        __html:
                          existingEquipmentTables[
                            `${selectedTest.atlId}-${selectedTest.testType}-${selectedTest.material}`
                          ],
                      }}
                    />
                  </div>
                )}

                {existingResultTables[
                  `${selectedTest.atlId}-${selectedTest.testType}-${selectedTest.material}`
                ] && (
                  <div className="mt-6">
                    <h3 className="mb-4 text-lg font-semibold">
                      Test Results for {selectedTest.material}
                    </h3>
                    <div
                      className="overflow-auto p-4 rounded-lg border result-table-container"
                      dangerouslySetInnerHTML={{
                        __html:
                          existingResultTables[
                            `${selectedTest.atlId}-${selectedTest.testType}-${selectedTest.material}`
                          ],
                      }}
                      style={{
                        pointerEvents: "none",
                        userSelect: "none",
                      }}
                    />
                  </div>
                )}

                {(!existingEquipmentTables[
                  `${selectedTest.atlId}-${selectedTest.testType}-${selectedTest.material}`
                ] ||
                  !existingResultTables[
                    `${selectedTest.atlId}-${selectedTest.testType}-${selectedTest.material}`
                  ]) && (
                  <div className="mt-6 text-center text-gray-500">
                    <p>
                      No test results available yet for {selectedTest.material}.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Show approval controls only for section heads */}
            {(userRole === 1 || userRole === 2) &&
              existingEquipmentTables &&
              existingResultTables && (
                <div className="mt-6 space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <div
                      className={`px-4 py-2 rounded-full text-sm font-medium ${
                        testStatus === "Results Approved"
                          ? "bg-green-100 text-green-800"
                          : testStatus === "Results Rejected"
                          ? "bg-red-100 text-red-800"
                          : testStatus === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {testStatus || "Status not set"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block font-medium">
                      Remarks for {selectedTest?.material} (required for
                      rejection)
                    </label>
                    <textarea
                      value={
                        resultRemarks[
                          `${selectedTest?.atlId}-${selectedTest?.testType}-${selectedTest?.material}`
                        ] || ""
                      }
                      onChange={(e) => handleRemarkChange(e.target.value)}
                      className="w-full min-h-[100px] p-2 border rounded-md"
                      placeholder="Enter remarks here..."
                    />
                  </div>

                  <div className="flex gap-4 justify-end">
                    <Button
                      variant="destructive"
                      onClick={handleRejectTestResults}
                      disabled={
                        isApprovingTestResults ||
                        !existingEquipmentTables[
                          `${selectedTest?.atlId}-${selectedTest?.testType}-${selectedTest?.material}`
                        ] ||
                        !existingResultTables[
                          `${selectedTest?.atlId}-${selectedTest?.testType}-${selectedTest?.material}`
                        ]
                      }
                    >
                      {isRejectingTestResults ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        `Reject Results for ${selectedTest?.material}`
                      )}
                    </Button>
                    <Button
                      variant="default"
                      onClick={handleApproveTestResults}
                      disabled={
                        isApprovingTestResults ||
                        !existingEquipmentTables[
                          `${selectedTest?.atlId}-${selectedTest?.testType}-${selectedTest?.material}`
                        ] ||
                        !existingResultTables[
                          `${selectedTest?.atlId}-${selectedTest?.testType}-${selectedTest?.material}`
                        ]
                      }
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isApprovingTestResults ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        `Approve Results for ${selectedTest?.material}`
                      )}
                    </Button>
                  </div>
                </div>
              )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Report Sheet */}
      {renderReportSheet()}

      {/* Report Email Dialog */}
      <Dialog
        open={isReportEmailDialogOpen}
        onOpenChange={setIsReportEmailDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Test Report</DialogTitle>
            <DialogDescription>
              The report will be sent to the client. You can also CC them to
              directors by adding their email addresses below.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="ccEmails" className="text-sm font-medium">
                Director Emails (CC)
              </label>
              <Input
                id="ccEmails"
                placeholder="Enter email addresses separated by commas or spaces"
                value={reportDirectorEmails}
                onChange={(e) => setReportDirectorEmails(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Multiple emails can be separated by commas or spaces
              </p>
            </div>
            {currentReportTest && (
              <div className="text-sm">
                <p>
                  <strong>Test ID:</strong> {currentReportTest.testId}
                </p>
                <p>
                  <strong>Client:</strong> {testDetails.clientName}
                </p>
                <p>
                  <strong>Client Email:</strong> {testDetails.emailId}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReportEmailDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendReportEmail}
              disabled={reportEmailSending}
              className="dark:hover:bg-[#E8E8E8] dark:bg-white dark:text-black"
            >
              {reportEmailSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Report"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
