import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function JobCard({ data }) {
  if (!data || !data.test) {
    return null;
  }

  return (
    <div className="mt-4 font-sans">
      <h4 className="text-center text-xl font-semibold mb-4">
        Avant Tech Lab and Research Centre Private Ltd
      </h4>

      <div className="p-5">
        <div className="text-base">
          <p><span className="font-semibold">Date: </span>{data.date}</p>
          <p><span className="font-semibold">Department: </span>{data.department}</p>
          {data.status && (
            <p className="mt-2">
              <span className="font-semibold">Status: </span>
              <span className={
                data.status === 'approved' 
                  ? 'text-green-600'
                  : data.status === 'rejected'
                  ? 'text-red-600'
                  : 'text-yellow-600'
              }>
                {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
              </span>
            </p>
          )}
          {data.remark && (
            <p className="mt-2">
              <span className="font-semibold">Remark: </span>
              <span className="text-gray-600">{data.remark}</span>
            </p>
          )}
        </div>
        
        <p className="text-base my-4">
          Please find the below mentioned details of the samples and kindly proceed as per the sheet
        </p>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ATL ID</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Test</TableHead>
              <TableHead>Standards</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.test.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.atlId}</TableCell>
                <TableCell>{item.material}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>
                  {Array.isArray(item.tests) 
                    ? item.tests.map(t => t.test).join(", ")
                    : item.testToBePerformed}
                </TableCell>
                <TableCell>
                  {Array.isArray(item.tests)
                    ? item.tests.map(t => t.standard).join(", ")
                    : item.testStandards}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default JobCard; 