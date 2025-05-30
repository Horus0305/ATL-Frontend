import { useState, useEffect, forwardRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { apiRequest, API_URLS } from "@/config/api";
import { Input } from "@/components/ui/input";
import { ChevronUp, ChevronDown, Search, Mail } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const TestTable = forwardRef((props, ref) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [directorEmails, setDirectorEmails] = useState("");
  const [currentTest, setCurrentTest] = useState(null);
  const [emailSending, setEmailSending] = useState(false);
  const [isReportEmailDialogOpen, setIsReportEmailDialogOpen] = useState(false);
  const [reportDirectorEmails, setReportDirectorEmails] = useState("");
  const [reportEmailSending, setReportEmailSending] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [completingTest, setCompletingTest] = useState(false);
  const [testToComplete, setTestToComplete] = useState(null);
  const userRole = user.role;

  const TEST_STATUSES = [
    "Test Data Entered",
    "ROR Generated",
    "Proforma Generated",
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

  const getRoutePrefix = () => {
    switch (user.role) {
      case 0:
        return "/superadmin/tests";
      case 1:
      case 2:
        return "/sectionhead/tests"; // Both section heads use the same route
      case 3:
        return "/receptionist/materialTests";
      case 4:
      case 5:
        return "/tester";
      default:
        return "/tests";
    }
  };

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(`${API_URLS.getAllTests}`);
      if (response.ok) {
        setTests(response.tests);
      } else {
        setError(response.error || "Failed to fetch tests");
      }
    } catch (err) {
      console.error("Error fetching tests:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleOpenEmailDialog = (test) => {
    setCurrentTest(test);
    setDirectorEmails("");
    setIsEmailDialogOpen(true);
  };

  const handleSendEmailWithCC = async () => {
    if (!currentTest) return;

    try {
      setEmailSending(true);

      // Split emails by commas or spaces and trim each email
      const ccEmails = directorEmails
        .split(/[,\s]+/)
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      const response = await apiRequest(
        `${API_URLS.sendTestDocuments}/${currentTest._id}`,
        {
          method: "POST",
          body: JSON.stringify({ ccEmails }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description:
            "Documents sent successfully to client's email and CC'd to directors",
        });
        setIsEmailDialogOpen(false);
        // Refresh the tests list to show updated status
        fetchTests();
      } else {
        throw new Error(response.error || "Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send email",
      });
    } finally {
      setEmailSending(false);
    }
  };

  // const handleOpenReportEmailDialog = (test) => {
  //   setCurrentTest(test);
  //   setReportDirectorEmails("");
  //   setIsReportEmailDialogOpen(true);
  // };

  const handleSendReportEmail = async () => {
    if (!currentTest) return;
    try {
      setReportEmailSending(true);
      const ccEmails = reportDirectorEmails
        .split(/[,\s]+/)
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      // Find the appropriate test based on user role
      const testToSend = currentTest.tests.find((test) => {
        const testType = test.testType.split("-")[0].trim().toUpperCase();
        return (
          (user.role === 1 && testType === "CHEMICAL") ||
          (user.role === 2 && testType === "MECHANICAL")
        );
      });

      if (!testToSend) {
        throw new Error("No matching test found for your role");
      }

      const response = await apiRequest(
        `${API_URLS.TESTS}/${currentTest._id}/send-report-mail`,
        {
          method: "POST",
          body: JSON.stringify({
            ccEmails,
            atlId: testToSend.atlId,
            testType: testToSend.testType,
            material: testToSend.material,
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
        fetchTests();
      } else {
        throw new Error(response.error || "Failed to send report email");
      }
    } catch (error) {
      console.error("Error sending report email:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send report email",
      });
    } finally {
      setReportEmailSending(false);
    }
  };

  const handleOpenCompleteDialog = (test) => {
    setTestToComplete(test);
    setIsCompleteDialogOpen(true);
  };

  const handleMarkComplete = async () => {
    if (!testToComplete) return;
    try {
      setCompletingTest(true);
      const response = await apiRequest(
        `${API_URLS.TESTS}/${testToComplete._id}/mark-complete`,
        {
          method: "POST",
        }
      );
      if (response.ok) {
        toast({
          title: "Success",
          description: "Test marked as completed.",
        });
        setIsCompleteDialogOpen(false);
        fetchTests();
      } else {
        throw new Error(response.error || "Failed to mark as complete");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to mark as complete",
      });
    } finally {
      setCompletingTest(false);
    }
  };

  const renderActions = (test) => {
    return (
      <div className="flex justify-start space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`${getRoutePrefix()}/${test._id}`)}
        >
          View Details
        </Button>
        {user.role === 3 &&
          test.rorStatus === 1 &&
          test.proformaStatus === 1 &&
          test.status === "Proforma Generated" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenEmailDialog(test)}
              className="flex gap-1 items-center"
            >
              <Mail className="w-4 h-4" />
              Send Email
            </Button>
          )}
        {/* {(user.role === 1 || user.role === 2) &&
          test.status === "Report Approved" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenReportEmailDialog(test)}
              className="flex gap-1 items-center"
            >
              <Mail className="w-4 h-4" />
              Send Report Email
            </Button>
          )} */}
        {user.role === 3 && test.status === "Report Mailed to Client" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenCompleteDialog(test)}
            className="flex gap-1 items-center text-green-700 border-green-700"
          >
            Complete
          </Button>
        )}
      </div>
    );
  };

  const getStatusColor = (status) => {
    if (!status) return "text-gray-500";
    switch (status.toLowerCase()) {
      case "test data entered":
        return "text-blue-600";
      case "ror generated":
        return "text-purple-600";
      case "proforma generated":
        return "text-indigo-600";
      case "ror and proforma mailed to client":
        return "text-teal-600";
      case "job card created":
        return "text-cyan-600";
      case "job card sent for approval":
        return "text-amber-600";
      case "job card assigned":
        return "text-orange-600";
      case "job assigned to testers":
        return "text-orange-600";
      case "test values added":
        return "text-yellow-600";
      case "test values approved":
        return "text-green-600";
      case "test values rejected":
        return "text-red-600";
      case "report generated":
        return "text-emerald-600";
      case "report approved":
        return "text-lime-600";
      case "completed":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const filteredAndSortedTests = tests
    .filter((test) => {
      // First apply search and status filters
      const searchMatch = searchTerm
        .toLowerCase()
        .split(" ")
        .every(
          (term) =>
            test.testId?.toLowerCase().includes(term) ||
            test.clientName?.toLowerCase().includes(term) ||
            test.status?.toLowerCase().includes(term)
        );

      const statusMatch =
        statusFilter === "all" || test.status === statusFilter;

      // Add department-based filtering for section heads and testers
      if (
        user.role === 1 ||
        user.role === 2 ||
        user.role === 4 ||
        user.role === 5
      ) {
        const testTypes =
          test.tests?.map((t) =>
            t.testType?.split("-")[0]?.trim().toUpperCase()
          ) || [];

        // For Chemical Head (role 1)
        if (user.role === 1) {
          return searchMatch && statusMatch && testTypes.includes("CHEMICAL");
        }

        // For Mechanical Head (role 2)
        if (user.role === 2) {
          return searchMatch && statusMatch && testTypes.includes("MECHANICAL");
        }

        // For Mechanical Tester (role 4)
        if (user.role === 4) {
          const hasApprovedJobCard =
            test.jobCards?.["mechanical"]?.status === 1;
          return (
            searchMatch &&
            statusMatch &&
            testTypes.includes("MECHANICAL") &&
            hasApprovedJobCard
          );
        }

        // For Chemical Tester (role 5)
        if (user.role === 5) {
          const hasApprovedJobCard = test.jobCards?.["chemical"]?.status === 1;
          return (
            searchMatch &&
            statusMatch &&
            testTypes.includes("CHEMICAL") &&
            hasApprovedJobCard
          );
        }
      }

      return searchMatch && statusMatch;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

  const getStatusBadge = (test) => {
    // Map the status to appropriate badge
    const statusMap = {
      pending: { label: "Pending", variant: "secondary" },
      in_progress: { label: "In Progress", variant: "warning" },
      completed: { label: "Completed", variant: "success" },
    };

    const status = statusMap[test.status] || statusMap.pending;

    return <Badge variant={status.variant}>{status.label}</Badge>;
  };

  const getRORStatus = (status) => {
    switch (status) {
      case 1:
        return <Badge variant="success">Generated</Badge>;
      case 0:
      default:
        return <Badge variant="secondary">Not Generated</Badge>;
    }
  };

  const getProformaStatus = (status) => {
    switch (status) {
      case 1:
        return <Badge variant="success">Generated</Badge>;
      case 0:
      default:
        return <Badge variant="secondary">Not Generated</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading tests...</span>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative w-full">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by client name, ID, test ID, or status..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {TEST_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Test Documents</DialogTitle>
            <DialogDescription>
              The documents will be sent to the client. You can also CC them to
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
                value={directorEmails}
                onChange={(e) => setDirectorEmails(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Multiple emails can be separated by commas or spaces
              </p>
            </div>
            {currentTest && (
              <div className="text-sm">
                <p>
                  <strong>Test ID:</strong> {currentTest.testId}
                </p>
                <p>
                  <strong>Client:</strong> {currentTest.clientName}
                </p>
                <p>
                  <strong>Client Email:</strong> {currentTest.emailId}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEmailDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendEmailWithCC}
              disabled={emailSending}
              className="dark:hover:bg-[#E8E8E8] dark:bg-white dark:text-black"
            >
              {emailSending ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Documents"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <label htmlFor="reportCcEmails" className="text-sm font-medium">
                Director Emails (CC)
              </label>
              <Input
                id="reportCcEmails"
                placeholder="Enter email addresses separated by commas or spaces"
                value={reportDirectorEmails}
                onChange={(e) => setReportDirectorEmails(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Multiple emails can be separated by commas or spaces
              </p>
            </div>
            {currentTest && (
              <div className="text-sm">
                <p>
                  <strong>Test ID:</strong> {currentTest.testId}
                </p>
                <p>
                  <strong>Client:</strong> {currentTest.clientName}
                </p>
                <p>
                  <strong>Client Email:</strong> {currentTest.emailId}
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
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Report"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCompleteDialogOpen}
        onOpenChange={setIsCompleteDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Test as Complete</DialogTitle>
            <DialogDescription>
              Please check all the details before marking this test as complete.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {testToComplete && (
            <div className="mb-4 text-sm">
              <p>
                <strong>Test ID:</strong> {testToComplete.testId}
              </p>
              <p>
                <strong>Client:</strong> {testToComplete.clientName}
              </p>
              <p>
                <strong>Status:</strong> {testToComplete.status}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCompleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkComplete}
              disabled={completingTest}
              className="text-white bg-green-600 hover:bg-green-700"
            >
              {completingTest ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Completing...
                </>
              ) : (
                "Complete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Test ID</TableHead>
            <TableHead className="w-[200px]">Client Name</TableHead>
            <TableHead
              className="w-[200px] cursor-pointer"
              onClick={() =>
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
              }
            >
              Date
              {sortOrder === "asc" ? (
                <ChevronUp className="inline ml-2 w-4 h-4" />
              ) : (
                <ChevronDown className="inline ml-2 w-4 h-4" />
              )}
            </TableHead>
            <TableHead className="w-[300px]">Status</TableHead>
            <TableHead className="w-[250px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedTests.map((test) => (
            <TableRow key={test._id}>
              <TableCell>{test.testId}</TableCell>
              <TableCell className="font-medium">{test.clientName}</TableCell>
              <TableCell>{test.date}</TableCell>
              <TableCell className={getStatusColor(test.status)}>
                {test.status || "No status"}
              </TableCell>
              <TableCell className="flex justify-start space-x-2">
                {renderActions(test)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

TestTable.displayName = "TestTable";
