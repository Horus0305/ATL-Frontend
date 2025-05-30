import React from "react";
import { Card } from "@/components/ui/card";

const DashboardStats = ({ stats }) => {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card className="flex flex-col items-center justify-center p-4 bg-blue-100 border border-blue-300 rounded-lg shadow-lg">
                <h3 className="text-md font-semibold text-blue-800">Total Clients</h3>
                <p className="text-3xl font-bold text-blue-900">{stats.totalClients}</p>
            </Card>
            <Card className="flex flex-col items-center justify-center p-4 bg-green-100 border border-green-300 rounded-lg shadow-lg">
                <h3 className="text-md font-semibold text-green-800">Total Tests</h3>
                <p className="text-3xl font-bold text-green-900">{stats.totalTests}</p>
            </Card>
            <Card className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg shadow-lg">
                <h3 className="text-md font-semibold text-center text-yellow-800">Status</h3>
                <ul className="space-y-1">
                    {Object.entries(stats.statuses).map(([status, count]) => (
                        <li key={status} className="flex justify-between w-full text-yellow-900">
                            <span>{status}</span>
                            <span>{count}</span>
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    );
};

export default DashboardStats; 