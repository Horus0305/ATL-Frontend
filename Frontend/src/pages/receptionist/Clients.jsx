import { ClientTable } from "@/components/ClientTable";
import { UpdateModal } from "@/components/UpdateModal";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, API_URLS } from "@/config/api";

export default function Clients() {
    const tableRef = useRef(null);
    const navigate = useNavigate();

    const handleClientAdded = async () => {
        // Refresh the table
        if (tableRef.current) {
            tableRef.current.refreshTable();
        }

        try {
            // Force refresh stats
            await apiRequest(API_URLS.getReceptionistStats);
            
            // Navigate to dashboard to show updated stats
            navigate("/receptionist");
        } catch (error) {
            console.error("Error refreshing stats:", error);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Clients</h2>
            <div className="mb-4">
                <UpdateModal 
                    heading="Add Client"
                    btnHeading="Add Client"
                    onSuccess={handleClientAdded}
                    className="bg-black hover:bg-black/90 text-white"
                    isClient={true}
                />
            </div>
            <div className="grid gap-4 w-max">
                <ClientTable ref={tableRef} />
            </div>
        </div>
    );
} 