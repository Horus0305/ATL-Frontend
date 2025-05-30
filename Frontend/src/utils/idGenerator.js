import { apiRequest, API_URLS } from "@/config/api";

export const generateIds = async (existingTestCount, materialCount = 1) => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  // Generate test ID
  const testId = `ATL/${year}/${month}/T_${existingTestCount + 1}`;

  try {
    // Get the last ATL ID number for this month
    const response = await apiRequest(API_URLS.getLastAtlId, {
      method: 'POST',
      body: JSON.stringify({ year, month })
    });

    if (!response.ok) {
      throw new Error('Failed to get last ATL ID');
    }

    const lastNumber = response.lastNumber || 0;
    
    // Generate sequential ATL IDs
    const atlIds = [];
    for (let i = 1; i <= materialCount; i++) {
      atlIds.push(`ATL/${year}/${month}/${lastNumber + i}`);
    }

    return {
      testId,
      atlIds
    };
  } catch (error) {
    console.error('Error generating IDs:', error);
    throw error;
  }
};

// Add this new function for formatting multiple tests
export const formatTestsWithIds = async (tests, existingTestCount) => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  // Generate test ID
  const testId = `ATL/${year}/${month}/T_${existingTestCount + 1}`;

  try {
    // Get the last ATL ID number for this month
    const response = await apiRequest(API_URLS.getLastAtlId, {
      method: 'POST',
      body: JSON.stringify({ year, month })
    });

    if (!response.ok) {
      throw new Error('Failed to get last ATL ID');
    }

    const lastNumber = response.lastNumber || 0;
    
    // Create a map to store ATL IDs by material type
    const materialTypeIds = new Map();
    let currentNumber = lastNumber;

    // Generate sequential ATL IDs for each unique material type
    const formattedTests = tests.map(test => {
      if (!materialTypeIds.has(test.materialType)) {
        currentNumber++;
        materialTypeIds.set(test.materialType, `ATL/${year}/${month}/${currentNumber}`);
      }

      return {
        ...test,
        atlId: materialTypeIds.get(test.materialType),
        material: test.materialType
      };
    });

    return {
      testId,
      formattedTests,
      materialAtlIds: Array.from(materialTypeIds.values())
    };
  } catch (error) {
    console.error('Error generating IDs:', error);
    throw error;
  }
}; 