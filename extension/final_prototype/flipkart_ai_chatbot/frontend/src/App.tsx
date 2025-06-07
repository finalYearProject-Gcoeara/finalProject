import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import LandingPage from "./components/LandingPage"; // Import your new Landing.tsx
import DashboardView from "./components/DashboardView";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/home" element={<LandingPage />} /> 
          <Route path="/" element={<DashboardView />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App; 