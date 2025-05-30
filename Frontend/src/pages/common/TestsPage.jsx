import { TestTable } from "@/components/common/TestTable";
import { useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TestsPage() {
    const tableRef = useRef(null);
    const { user } = useAuth();
    const navigate = useNavigate();
    const isReceptionist = user.role === 3;

    const handleAddTest = () => {
        navigate('/receptionist/materialTests/addTest');
    };

    return (
        <div className="w-max">
            <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Tests</h2>
                {user.role === 3 && (
                    <Button 
                        onClick={handleAddTest}
                        className="ml-4 bg-black hover:bg-black/90"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Test
                    </Button>
                )}
            </div>
            <div className="grid gap-4">
                <TestTable ref={tableRef} />
            </div>
        </div>
    );
} 