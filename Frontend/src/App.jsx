import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import AddResults from "@/pages/results/AddResults";

function App({ children }) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="app-theme">
      {children}
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
