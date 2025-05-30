"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { apiRequest, API_URLS } from "@/config/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { generateIds, formatTestsWithIds } from "@/utils/idGenerator";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  customerName: z.string().min(2, { message: "Customer name is required" }),
  customerEmail: z.string().email({ message: "Invalid email address" }),
  customerContact: z
    .string()
    .min(10, { message: "Valid contact number is required" }),
  customerAddress: z.string().min(1, { message: "Address is required" }),
  materialType: z.string().optional(),
  materialId: z.string().optional(),
  quantity: z.string().optional(),
  testType: z.string().optional(),
  testToBePerformed: z.array(z.string()).optional(),
  testStandards: z.string().optional(),
  allMaterialReceived: z.string(),
  requirements: z.object({
    testMethods: z.string(),
    laboratoryCapability: z.string(),
    appropriateTestMethods: z.string(),
    decisionRule: z.string(),
    externalProvider: z.string(),
  }),
});

const getUniqueValues = (array, key) => {
  return [...new Set(array.map((item) => item[key]))];
};

const getFilteredParameters = (testScope, materialType, group) => {
  const parameters = testScope
    .filter(
      (scope) => scope.material_tested === materialType && scope.group === group
    )
    .map((scope) => ({
      parameter: scope.parameters,
      method: scope.test_method,
    }));

  // Remove duplicates by parameter name
  return Array.from(
    new Map(parameters.map((item) => [item.parameter, item])).values()
  );
};

export function TestForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testScope, setTestScope] = useState([]);
  const [uniqueMaterials, setUniqueMaterials] = useState([]);
  const [uniqueGroups, setUniqueGroups] = useState([]);
  const [availableParameters, setAvailableParameters] = useState([]);
  const [localMaterialTests, setLocalMaterialTests] = useState([]);
  const [existingTestCount, setExistingTestCount] = useState(0);
  const [currentAtlId, setCurrentAtlId] = useState(null);
  const [materialAtlIds, setMaterialAtlIds] = useState({});
  const [isTestSelectOpen, setIsTestSelectOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerContact: "",
      customerAddress: "",
      materialType: "",
      materialId: "",
      quantity: "",
      testType: "",
      testToBePerformed: [],
      testStandards: "",
      allMaterialReceived: "no",
      requirements: {
        testMethods: "no",
        laboratoryCapability: "no",
        appropriateTestMethods: "no",
        decisionRule: "no",
        externalProvider: "no",
      },
    },
  });

  useEffect(() => {
    fetchClients();
    fetchTestScope();
    fetchExistingTestCount();
  }, []);

  useEffect(() => {
    if (testScope.length > 0) {
      setUniqueMaterials(getUniqueValues(testScope, "material_tested"));
      setUniqueGroups(getUniqueValues(testScope, "group"));
    }
  }, [testScope]);

  const fetchClients = async () => {
    try {
      const response = await apiRequest(API_URLS.getAllClients);
      if (response.ok) {
        setClients(response.clients);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTestScope = async () => {
    try {
      console.log("Fetching test scope from:", API_URLS.getTestScope);
      const response = await apiRequest(API_URLS.getTestScope);
      if (response.ok) {
        console.log("Test scope data:", response.testScope);
        setTestScope(response.testScope);
      } else {
        console.error("Failed to fetch test scope:", response.error);
      }
    } catch (error) {
      console.error("Error fetching test scope:", error);
      setTestScope([]);
    }
  };

  const fetchExistingTestCount = async () => {
    try {
      const response = await apiRequest(API_URLS.getAllTests);
      if (response.ok) {
        const allTests = response.tests;
        const now = new Date();
        const currentYear = now.getFullYear().toString().slice(-2);
        const currentMonth = String(now.getMonth() + 1).padStart(2, "0");

        // Filter tests for current month and year
        const currentMonthTests = allTests.filter((test) => {
          return test.testId.includes(`ATL/${currentYear}/${currentMonth}`);
        });

        setExistingTestCount(currentMonthTests.length);
      }
    } catch (error) {
      console.error("Error fetching test count:", error);
      setExistingTestCount(0);
    }
  };

  const handleClientSelection = (value) => {
    const selectedClient = clients.find((client) => client._id === value);
    if (selectedClient) {
      form.reset({
        ...form.getValues(),
        customerName: value,
        customerEmail: selectedClient.emailid,
        customerContact: selectedClient.contactno,
        customerAddress: selectedClient.address,
      });
    }
  };

  const handleMaterialTypeChange = (value) => {
    form.setValue("materialType", value);
    form.setValue("testType", "");
    form.setValue("testToBePerformed", []);
    form.setValue("testStandards", "");
  };

  const handleTestTypeChange = (value) => {
    const materialType = form.getValues("materialType");
    form.setValue("testType", value);
    form.setValue("testToBePerformed", []);
    form.setValue("testStandards", "");

    const filteredParams = getFilteredParameters(
      testScope,
      materialType,
      value
    );
    setAvailableParameters(filteredParams);
  };

  const handleTestStandardsChange = (value) => {
    form.setValue("testStandards", value);

    // Parse the comma-separated standards
    const standardsArray = value
      .split(",")
      .map((std) => std.trim())
      .filter(Boolean);

    // Get the current tests to be performed
    const testsToBePerformed = form.getValues("testToBePerformed");

    // If we have more standards than tests, only use up to the number of tests
    const limitedStandards = standardsArray.slice(0, testsToBePerformed.length);

    // If we have fewer standards than tests, pad with empty strings
    while (limitedStandards.length < testsToBePerformed.length) {
      limitedStandards.push("");
    }
  };

  const handleTestToBePerformedChange = (values) => {
    const previousTests = form.getValues("testToBePerformed");
    form.setValue("testToBePerformed", values);

    // Get current standards as array
    const currentStandards = form
      .getValues("testStandards")
      .split(",")
      .map((std) => std.trim())
      .filter(Boolean);

    // If we're adding tests
    if (values.length > previousTests.length) {
      // For new tests, find default standards from availableParameters
      const newTests = values.filter((test) => !previousTests.includes(test));
      const newStandards = newTests.map((test) => {
        const selectedParam = availableParameters.find(
          (param) => param.parameter === test
        );
        return selectedParam?.method || "";
      });

      // Combine with existing standards
      const updatedStandards = [...currentStandards, ...newStandards];
      // Limit to the length of values
      const limitedStandards = updatedStandards.slice(0, values.length);
      form.setValue("testStandards", limitedStandards.join(", "));
    }
    // If we're removing tests, remove corresponding standards
    else if (values.length < previousTests.length) {
      // Find removed tests
      const removedTestIndexes = [];
      previousTests.forEach((test, index) => {
        if (!values.includes(test)) {
          removedTestIndexes.push(index);
        }
      });

      // Filter out standards for removed tests
      const updatedStandards = currentStandards.filter(
        (_, index) => !removedTestIndexes.includes(index)
      );

      // Set updated standards string
      form.setValue("testStandards", updatedStandards.join(", "));
    }
  };

  const addMaterial = async () => {
    const materialType = form.getValues("materialType");
    const materialId = form.getValues("materialId");
    const quantity = form.getValues("quantity");
    const testType = form.getValues("testType");
    const testToBePerformed = form.getValues("testToBePerformed");
    const testStandards = form.getValues("testStandards");

    if (
      !materialType ||
      !materialId ||
      !quantity ||
      !testType ||
      !testToBePerformed?.length ||
      !testStandards
    ) {
      toast({
        title: "Error",
        description: "Please fill in all material fields before adding.",
        variant: "destructive",
      });
      return;
    }

    try {
      // If this is the first material being added
      if (localMaterialTests.length === 0) {
        const { testId, atlIds } = await generateIds(existingTestCount);
        setCurrentAtlId(testId);

        // Set the ATL ID for this material type
        setMaterialAtlIds((prev) => ({
          ...prev,
          [materialType]: atlIds[0],
        }));

        // Split the testStandards string into an array
        const standardsArray = testStandards
          .split(",")
          .map((std) => std.trim());

        // Map each test to its corresponding standard
        const tests = testToBePerformed.map((test, index) => ({
          test,
          standard: standardsArray[index] || "", // Use the standard at the same index or empty string if not available
        }));

        const newMaterialTest = {
          atlId: atlIds[0],
          materialType,
          materialId,
          quantity,
          testType,
          testToBePerformed: testToBePerformed.join(", "),
          testStandards,
          tests, // Use the updated tests array
        };

        setLocalMaterialTests([newMaterialTest]);
      } else {
        // For subsequent materials, check if we already have an ATL ID for this material type
        let atlId;

        if (materialAtlIds[materialType]) {
          // Use existing ATL ID for this material type
          atlId = materialAtlIds[materialType];
        } else {
          // Generate new ATL ID for this new material type
          const now = new Date();
          const year = now.getFullYear().toString().slice(-2);
          const month = String(now.getMonth() + 1).padStart(2, "0");

          // Get the highest number from existing ATL IDs
          const existingNumbers = Object.values(materialAtlIds).map((id) =>
            parseInt(id.split("/").pop())
          );
          const maxNumber = Math.max(...existingNumbers, 0);

          // Generate new ATL ID with next sequential number
          atlId = `ATL/${year}/${month}/${maxNumber + 1}`;

          // Store the new ATL ID for this material type
          setMaterialAtlIds((prev) => ({
            ...prev,
            [materialType]: atlId,
          }));
        }

        // Split the testStandards string into an array
        const standardsArray = testStandards
          .split(",")
          .map((std) => std.trim());

        // Map each test to its corresponding standard
        const tests = testToBePerformed.map((test, index) => ({
          test,
          standard: standardsArray[index] || "", // Use the standard at the same index or empty string if not available
        }));

        const newMaterialTest = {
          atlId,
          materialType,
          materialId,
          quantity,
          testType,
          testToBePerformed: testToBePerformed.join(", "),
          testStandards,
          tests, // Use the updated tests array
        };

        setLocalMaterialTests((prev) => [...prev, newMaterialTest]);
      }

      // Reset form fields
      form.setValue("materialType", "");
      form.setValue("materialId", "");
      form.setValue("quantity", "");
      form.setValue("testType", "");
      form.setValue("testToBePerformed", []);
      form.setValue("testStandards", "");
      setAvailableParameters([]);
    } catch (error) {
      console.error("Error adding material:", error);
      toast({
        title: "Error",
        description: "Failed to generate IDs for the material",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMaterial = (index) => {
    const materialToDelete = localMaterialTests[index];
    const materialType = materialToDelete.materialType;

    // Check if this was the only entry for this material type
    const remainingMaterialTests = localMaterialTests.filter(
      (_, i) => i !== index
    );
    const hasSameMaterial = remainingMaterialTests.some(
      (test) => test.materialType === materialType
    );

    if (!hasSameMaterial) {
      // Remove the ATL ID for this material type if it's no longer used
      setMaterialAtlIds((prev) => {
        const newIds = { ...prev };
        delete newIds[materialType];
        return newIds;
      });
    }

    setLocalMaterialTests(remainingMaterialTests);
  };

  const handleUpdateMaterial = (index) => {
    const materialToUpdate = localMaterialTests[index];

    form.setValue("materialType", materialToUpdate.materialType);
    form.setValue("materialId", materialToUpdate.materialId);
    form.setValue("quantity", materialToUpdate.quantity);
    form.setValue("testType", materialToUpdate.testType);
    form.setValue(
      "testToBePerformed",
      materialToUpdate.testToBePerformed.split(", ")
    );
    form.setValue("testStandards", materialToUpdate.testStandards);

    handleDeleteMaterial(index);
  };

  const handleClearForm = () => {
    form.reset();
    setLocalMaterialTests([]);
    setCurrentAtlId(null);
  };

  async function onSubmit(values) {
    if (localMaterialTests.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one material test before submitting",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use the new formatTestsWithIds function for final submission
      const { testId, formattedTests } = await formatTestsWithIds(
        localMaterialTests,
        existingTestCount
      );

      const now = new Date();
      const formattedDate = now.toISOString().split("T")[0];

      const payload = {
        clientId: values.customerName,
        clientName: clients.find((c) => c._id === values.customerName)
          ?.clientname,
        contactNo: values.customerContact,
        emailId: values.customerEmail,
        address: values.customerAddress,
        testId: testId,
        date: formattedDate,
        tests: formattedTests.map((test) => ({
          atlId: test.atlId,
          material: test.materialType,
          materialId: test.materialId,
          date: formattedDate,
          quantity: test.quantity,
          testType: test.testType,
          tests: test.tests.map((t) => ({
            test: t.test,
            standard: t.standard,
            testResult: "",
            unit: "",
          })),
          reporturl: "",
        })),
        materialAtlIds: formattedTests.map((test) => test.atlId),
        requirements: values.requirements,
        materialReceived: values.allMaterialReceived === "yes" ? 1 : 0,
        status: "Test Data Entered",
        rorStatus: 0,
        proformaStatus: 0,
        jobCards: {
          chemical: { status: 0, remark: "" },
          mechanical: { status: 0, remark: "" },
        },
      };

      const response = await apiRequest(API_URLS.createMaterialTest, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Material test created successfully",
        });
        handleClearForm();
        // Navigate back to the material test page
        navigate(-1);
      }
    } catch (error) {
      console.error("Error creating material test:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create material test",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="p-6 mx-auto space-y-8 max-w-4lg"
      >
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleClientSelection(value);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client._id} value={client._id}>
                          {client.clientname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="customerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Email ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="email@example.com"
                        {...field}
                        disabled
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Contact number" {...field} disabled />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="customerAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter address" {...field} disabled />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Material Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="materialType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Type</FormLabel>
                    <Select
                      onValueChange={handleMaterialTypeChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select material" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {uniqueMaterials.map((material) => (
                          <SelectItem key={material} value={material}>
                            {material}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="materialId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Material ID" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter quantity" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="testType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type of Test</FormLabel>
                    <Select
                      onValueChange={handleTestTypeChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select test type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {uniqueGroups.map((group) => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="testToBePerformed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test To be Performed</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="justify-between w-full"
                        >
                          {field.value?.length > 0
                            ? `${field.value.length} tests selected`
                            : "Select tests"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0" align="start">
                        <div className="p-2 space-y-2">
                          {availableParameters.map((param, index) => (
                            <div
                              key={`${param.parameter}-${index}`}
                              className="flex items-center p-1 space-x-2 rounded cursor-pointer hover:bg-accent"
                              onClick={() => {
                                const checked = !field.value.includes(
                                  param.parameter
                                );
                                const newValue = checked
                                  ? [...field.value, param.parameter]
                                  : field.value.filter(
                                      (v) => v !== param.parameter
                                    );
                                handleTestToBePerformedChange(newValue);
                              }}
                            >
                              <Checkbox
                                checked={field.value.includes(param.parameter)}
                                onCheckedChange={(checked) => {
                                  const newValue = checked
                                    ? [...field.value, param.parameter]
                                    : field.value.filter(
                                        (v) => v !== param.parameter
                                      );
                                  handleTestToBePerformedChange(newValue);
                                }}
                              />
                              <label className="flex-grow text-sm cursor-pointer">
                                {param.parameter}
                              </label>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    {field.value?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {field.value.map((value, index) => (
                          <div
                            key={index}
                            className="flex gap-1 items-center px-3 py-1 text-sm rounded-full bg-secondary"
                          >
                            <span>{value}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newValue = field.value.filter(
                                  (v) => v !== value
                                );
                                handleTestToBePerformedChange(newValue);
                              }}
                              className="ml-1 text-muted-foreground hover:text-foreground"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="testStandards"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test Standards</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter test standards" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="allMaterialReceived"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>All Material Received?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-row space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="yes" />
                        </FormControl>
                        <FormLabel className="font-normal">Yes</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="no" />
                        </FormControl>
                        <FormLabel className="font-normal">No</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        <Button
          type="button"
          onClick={addMaterial}
          className="w-full md:w-auto dark:hover:bg-[#E8E8E8] dark:bg-white dark:text-black"
        >
          Add Material
        </Button>

        {localMaterialTests.length > 0 && (
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ATL ID</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Material ID</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Test Type</TableHead>
                  <TableHead>Test to be done</TableHead>
                  <TableHead>Test Standards</TableHead>
                  <TableHead>Update</TableHead>
                  <TableHead>Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localMaterialTests.map((test, index) => (
                  <TableRow key={index}>
                    <TableCell>{test.atlId}</TableCell>
                    <TableCell>{test.materialType}</TableCell>
                    <TableCell>{test.materialId}</TableCell>
                    <TableCell>{test.quantity}</TableCell>
                    <TableCell>{test.testType}</TableCell>
                    <TableCell>{test.testToBePerformed}</TableCell>
                    <TableCell>{test.testStandards}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateMaterial(index)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteMaterial(index)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Other Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                name: "testMethods",
                label:
                  "Test methods, are adequately defined, documented and understood",
              },
              {
                name: "laboratoryCapability",
                label:
                  "The Laboratory has the capability and resources to meet the requirements",
              },
              {
                name: "appropriateTestMethods",
                label:
                  "Appropriate test methods as per NABL accreditation is selected and capable of meeting the customer requirements",
              },
              {
                name: "decisionRule",
                label: "Application of decision rule required",
              },
              {
                name: "externalProvider",
                label: "External provider services used",
              },
            ].map((requirement) => (
              <FormField
                key={requirement.name}
                control={form.control}
                name={`requirements.${requirement.name}`}
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>{requirement.label}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-row space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="yes" />
                          </FormControl>
                          <FormLabel className="font-normal">Yes</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="no" />
                          </FormControl>
                          <FormLabel className="font-normal">No</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
            ))}
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full md:w-auto dark:hover:bg-[#E8E8E8] dark:bg-white dark:text-black"
        >
          Add Material Test
        </Button>
      </form>
    </Form>
  );
}
