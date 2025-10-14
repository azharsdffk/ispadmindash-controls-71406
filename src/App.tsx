import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import AccountantDashboard from "./pages/AccountantDashboard";
import CustomerPortal from "./pages/CustomerPortal";
import Plans from "./pages/Plans";
import Notifications from "./pages/Notifications";
import EmployeeTracking from "./pages/EmployeeTracking";
import Schedule from "./pages/Schedule";
import Inventory from "./pages/Inventory";
import Subscribers from "./pages/Subscribers";
import Invoices from "./pages/Invoices";
import Vouchers from "./pages/Vouchers";
import Maintenance from "./pages/Maintenance";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Employees from "./pages/Employees";
import DataImport from "./pages/DataImport";
import RoleManagement from "./pages/RoleManagement";
import PermissionsManagement from "./pages/PermissionsManagement";
import UserAccountsManagement from "./pages/UserAccountsManagement";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/accountant" element={<ProtectedRoute allowedRoles={['accountant', 'admin']}><AccountantDashboard /></ProtectedRoute>} />
            {/* صفحات المحاسب والمدير */}
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'accountant']}><Dashboard /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute allowedRoles={['admin', 'accountant']}><Invoices /></ProtectedRoute>} />
            <Route path="/vouchers" element={<ProtectedRoute allowedRoles={['admin', 'accountant']}><Vouchers /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute allowedRoles={['admin', 'accountant']}><Inventory /></ProtectedRoute>} />
            {/* صفحات المدير فقط */}
            <Route path="/portal" element={<ProtectedRoute allowedRoles={['admin']}><CustomerPortal /></ProtectedRoute>} />
            <Route path="/plans" element={<ProtectedRoute allowedRoles={['admin']}><Plans /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute allowedRoles={['admin']}><Notifications /></ProtectedRoute>} />
            <Route path="/tracking" element={<ProtectedRoute allowedRoles={['admin']}><EmployeeTracking /></ProtectedRoute>} />
            <Route path="/schedule" element={<ProtectedRoute allowedRoles={['admin']}><Schedule /></ProtectedRoute>} />
            <Route path="/subscribers" element={<ProtectedRoute allowedRoles={['admin']}><Subscribers /></ProtectedRoute>} />
            <Route path="/maintenance" element={<ProtectedRoute allowedRoles={['admin']}><Maintenance /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin']}><Reports /></ProtectedRoute>} />
            <Route path="/employees" element={<ProtectedRoute allowedRoles={['admin']}><Employees /></ProtectedRoute>} />
            <Route path="/import" element={<ProtectedRoute allowedRoles={['admin']}><DataImport /></ProtectedRoute>} />
            <Route path="/roles" element={<ProtectedRoute allowedRoles={['admin']}><RoleManagement /></ProtectedRoute>} />
            <Route path="/permissions" element={<ProtectedRoute allowedRoles={['admin']}><PermissionsManagement /></ProtectedRoute>} />
            <Route path="/accounts" element={<ProtectedRoute allowedRoles={['admin']}><UserAccountsManagement /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
