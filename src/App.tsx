import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PermissionProtectedRoute } from "@/components/PermissionProtectedRoute";
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
import AccountantPermissions from "./pages/AccountantPermissions";
import UserAccountsManagement from "./pages/UserAccountsManagement";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import TechnicianProfile from "./pages/TechnicianProfile";
import AdminDashboard from "./pages/AdminDashboard";
import Contracts from "./pages/Contracts";
import Discounts from "./pages/Discounts";
import SecuritySettings from "./pages/SecuritySettings";
import CustomerContact from "./pages/CustomerContact";
import AgentsManagement from "./pages/AgentsManagement";
import AgentDashboard from "./pages/AgentDashboard";
import CustomerAuth from "./pages/CustomerAuth";
import Auth from "./pages/Auth";
import PendingApproval from "./pages/PendingApproval";
import PhoneAuth from "./pages/PhoneAuth";
import Features from "./pages/Features";
import CustomerTicketTracking from "./pages/CustomerTicketTracking";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/phone-auth" element={<PhoneAuth />} />
              <Route path="/customer-login" element={<CustomerAuth />} />
              <Route path="/pending-approval" element={<PendingApproval />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              {/* صفحة الميزات - عامة */}
              <Route path="/features" element={<Features />} />
              {/* بوابة العميل - عامة للبحث أو محمية للعملاء */}
              <Route path="/contact" element={<CustomerContact />} />
              {/* الصفحة الرئيسية للعميل والمدير */}
              <Route path="/my-portal" element={
                <ProtectedRoute allowedRoles={['client', 'admin']}>
                  <Index />
                </ProtectedRoute>
              } />
              {/* صفحة تتبع الطلب للعميل */}
              <Route path="/ticket/:ticketId" element={
                <ProtectedRoute allowedRoles={['client']}>
                  <CustomerTicketTracking />
                </ProtectedRoute>
              } />
              {/* إدارة الوكلاء - للمدير فقط */}
              <Route path="/agents" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AgentsManagement />
                </ProtectedRoute>
              } />
              {/* لوحة تحكم الوكيل */}
              <Route path="/agent-dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AgentDashboard />
                </ProtectedRoute>
              } />
              {/* لوحة الأدمن الشاملة */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              {/* لوحة المحاسب - للمحاسب أو المدير */}
              <Route path="/accountant" element={
                <ProtectedRoute allowedRoles={['accountant', 'admin']}>
                  <AccountantDashboard />
                </ProtectedRoute>
              } />
              <Route path="/accountant/permissions" element={
                <ProtectedRoute allowedRoles={['accountant', 'admin']}>
                  <AccountantPermissions />
                </ProtectedRoute>
              } />
              {/* صفحات المحاسب والمدير */}
              <Route path="/dashboard" element={
                <PermissionProtectedRoute permission="view_dashboard">
                  <Dashboard />
                </PermissionProtectedRoute>
              } />
              <Route path="/invoices" element={
                <PermissionProtectedRoute permission="view_invoices">
                  <Invoices />
                </PermissionProtectedRoute>
              } />
              <Route path="/vouchers" element={
                <PermissionProtectedRoute permission="view_vouchers">
                  <Vouchers />
                </PermissionProtectedRoute>
              } />
              <Route path="/contracts" element={
                <PermissionProtectedRoute permission="view_invoices">
                  <Contracts />
                </PermissionProtectedRoute>
              } />
              <Route path="/discounts" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Discounts />
                </ProtectedRoute>
              } />
              <Route path="/inventory" element={
                <PermissionProtectedRoute permission="view_inventory">
                  <Inventory />
                </PermissionProtectedRoute>
              } />
              {/* صفحات المدير فقط */}
              <Route path="/portal" element={<ProtectedRoute allowedRoles={['admin']}><CustomerPortal /></ProtectedRoute>} />
              <Route path="/plans" element={<ProtectedRoute allowedRoles={['admin']}><Plans /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute allowedRoles={['admin']}><Notifications /></ProtectedRoute>} />
              <Route path="/tracking" element={<ProtectedRoute allowedRoles={['admin']}><EmployeeTracking /></ProtectedRoute>} />
              <Route path="/schedule" element={<ProtectedRoute allowedRoles={['admin']}><Schedule /></ProtectedRoute>} />
              <Route path="/subscribers" element={
                <PermissionProtectedRoute permission="view_subscribers">
                  <Subscribers />
                </PermissionProtectedRoute>
              } />
              <Route path="/maintenance" element={
                <PermissionProtectedRoute permission="view_maintenance">
                  <Maintenance />
                </PermissionProtectedRoute>
              } />
              <Route path="/technician" element={
                <ProtectedRoute allowedRoles={['technician']}>
                  <TechnicianDashboard />
                </ProtectedRoute>
              } />
              <Route path="/technician/profile" element={
                <ProtectedRoute allowedRoles={['technician']}>
                  <TechnicianProfile />
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <PermissionProtectedRoute permission="view_reports">
                  <Reports />
                </PermissionProtectedRoute>
              } />
              <Route path="/employees" element={<ProtectedRoute allowedRoles={['admin']}><Employees /></ProtectedRoute>} />
              <Route path="/import" element={<ProtectedRoute allowedRoles={['admin']}><DataImport /></ProtectedRoute>} />
              <Route path="/roles" element={<ProtectedRoute allowedRoles={['admin']}><RoleManagement /></ProtectedRoute>} />
              <Route path="/permissions" element={<ProtectedRoute allowedRoles={['admin']}><PermissionsManagement /></ProtectedRoute>} />
              <Route path="/accounts" element={<ProtectedRoute allowedRoles={['admin']}><UserAccountsManagement /></ProtectedRoute>} />
              {/* توافق مع رابط قديم */}
              <Route path="/user-accounts" element={<Navigate to="/accounts" replace />} />
              <Route path="/security" element={<ProtectedRoute><SecuritySettings /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
