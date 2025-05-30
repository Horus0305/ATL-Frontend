import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { TestForm } from "@/components/TestForm";

export default function AddTest() {
    const navigate = useNavigate();

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <div className="h-full p-6  border rounded-lg shadow-sm dark:bg-black">
            <div className="flex items-center mb-6">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleBack}
                    className="mr-2"
                >
                    <ArrowLeft className="w-4 h-4 " />
                </Button>
                <h2 className="text-2xl font-bold dark:text-white">Add New Test</h2>
            </div>
            
            <div className="space-y-6">
                <TestForm/>
            </div>
        </div>
    );
} 