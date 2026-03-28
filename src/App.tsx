import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PermissionProtectedRoute } from "@/components/PermissionProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AccountantDashboard = lazy(() => import("./pages/AccountantDashboard"));
const CustomerPortal = lazy(() => import("./pages/CustomerPortal"));
const Plans = lazy(() => import("./pages/Plans"));
const Notifications = lazy(() => import("./pages/Notifications"));
const EmployeeTracking = lazy(() => import("./pages/EmployeeTracking"));
const Schedule = lazy(() => import("./pages/Schedule"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Subscribers = lazy(() => import("./pages/Subscribers"));
const Invoices = lazy(() => import("./pages/Invoices"));
const Vouchers = lazy(() => import("./pages/Vouchers"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Employees = lazy(() => import("./pages/Employees"));
const DataImport = lazy(() => import("./pages/DataImport"));
const RoleManagement = lazy(() => import("./pages/RoleManagement"));
const PermissionsManagement = lazy(() => import("./pages/PermissionsManagement"));
const AccountantPermissions = lazy(() => import("./pages/AccountantPermissions"));
const UserAccountsManagement = lazy(() => import("./pages/UserAccountsManagement"));
const TechnicianDashboard = lazy(() => import("./pages/TechnicianDashboard"));
const TechnicianProfile = lazy(() => import("./pages/TechnicianProfile"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Contracts = lazy(() => import("./pages/Contracts"));
const Discounts = lazy(() => import("./pages/Discounts"));
const SecuritySettings = lazy(() => import("./pages/SecuritySettings"));
const CustomerContact = lazy(() => import("./pages/CustomerContact"));
const AgentsManagement = lazy(() => import("./pages/AgentsManagement"));
const AgentDashboard = lazy(() => import("./pages/AgentDashboard"));
const CustomerAuth = lazy(() => import("./pages/CustomerAuth"));
const Auth = lazy(() => import("./pages/Auth"));
const PendingApproval = lazy(() => import("./pages/PendingApproval"));
const PhoneAuth = lazy(() => import("./pages/PhoneAuth"));
const Features = lazy(() => import("./pages/Features"));
const CustomerTicketTracking = lazy(() => import("./pages/CustomerTicketTracking"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SMSNotifications = lazy(() => import("./pages/SMSNotifications"));
const AuditLog = lazy(() => import("./pages/AuditLog"));
const AdminSecurityDashboard = lazy(() => import("./pages/AdminSecurityDashboard"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/phone-auth" element={<PhoneAuth />} />
                <Route path="/customer-login" element={<CustomerAuth />} />
                <Route path="/pending-approval" element={<PendingApproval />} />
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/features" element={<Features />} />
                <Route path="/contact" element={<CustomerContact />} />
                <Route path="/my-portal" element={
                  <ProtectedRoute allowedRoles={['client', 'admin']}><Index /></ProtectedRoute>
                } />
                <Route path="/ticket/:ticketId" element={
                  <ProtectedRoute allowedRoles={['client']}><CustomerTicketTracking /></ProtectedRoute>
                } />
                <Route path="/agents" element={
                  <ProtectedRoute allowedRoles={['admin']}><AgentsManagement /></ProtectedRoute>
                } />
                <Route path="/agent-dashboard" element={
                  <ProtectedRoute allowedRoles={['admin']}><AgentDashboard /></ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
                } />
                <Route path="/accountant" element={
                  <ProtectedRoute allowedRoles={['accountant', 'admin']}><AccountantDashboard /></ProtectedRoute>
                } />
                <Route path="/accountant/permissions" element={
                  <ProtectedRoute allowedRoles={['accountant', 'admin']}><AccountantPermissions /></ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <PermissionProtectedRoute permission="view_dashboard"><Dashboard /></PermissionProtectedRoute>
                } />
                <Route path="/invoices" element={
                  <PermissionProtectedRoute permission="view_invoices"><Invoices /></PermissionProtectedRoute>
                } />
                <Route path="/vouchers" element={
                  <PermissionProtectedRoute permission="view_vouchers"><Vouchers /></PermissionProtectedRoute>
                } />
                <Route path="/contracts" element={
                  <PermissionProtectedRoute permission="view_invoices"><Contracts /></PermissionProtectedRoute>
                } />
                <Route path="/discounts" element={
                  <ProtectedRoute allowedRoles={['admin']}><Discounts /></ProtectedRoute>
                } />
                <Route path="/inventory" element={
                  <PermissionProtectedRoute permission="view_inventory"><Inventory /></PermissionProtectedRoute>
                } />
                <Route path="/portal" element={<ProtectedRoute allowedRoles={['admin']}><CustomerPortal /></ProtectedRoute>} />
                <Route path="/plans" element={<ProtectedRoute allowedRoles={['admin']}><Plans /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute allowedRoles={['admin']}><Notifications /></ProtectedRoute>} />
                <Route path="/tracking" element={<ProtectedRoute allowedRoles={['admin']}><EmployeeTracking /></ProtectedRoute>} />
                <Route path="/schedule" element={<ProtectedRoute allowedRoles={['admin']}><Schedule /></ProtectedRoute>} />
                <Route path="/subscribers" element={
                  <PermissionProtectedRoute permission="view_subscribers"><Subscribers /></PermissionProtectedRoute>
                } />
                <Route path="/maintenance" element={
                  <PermissionProtectedRoute permission="view_maintenance"><Maintenance /></PermissionProtectedRoute>
                } />
                <Route path="/technician" element={
                  <ProtectedRoute allowedRoles={['technician']}><TechnicianDashboard /></ProtectedRoute>
                } />
                <Route path="/technician/profile" element={
                  <ProtectedRoute allowedRoles={['technician']}><TechnicianProfile /></ProtectedRoute>
                } />
                <Route path="/reports" element={
                  <PermissionProtectedRoute permission="view_reports"><Reports /></PermissionProtectedRoute>
                } />
                <Route path="/employees" element={<ProtectedRoute allowedRoles={['admin']}><Employees /></ProtectedRoute>} />
                <Route path="/import" element={<ProtectedRoute allowedRoles={['admin']}><DataImport /></ProtectedRoute>} />
                <Route path="/roles" element={<ProtectedRoute allowedRoles={['admin']}><RoleManagement /></ProtectedRoute>} />
                <Route path="/permissions" element={<ProtectedRoute allowedRoles={['admin']}><PermissionsManagement /></ProtectedRoute>} />
                <Route path="/accounts" element={<ProtectedRoute allowedRoles={['admin']}><UserAccountsManagement /></ProtectedRoute>} />
                <Route path="/user-accounts" element={<Navigate to="/accounts" replace />} />
                <Route path="/security" element={<ProtectedRoute><SecuritySettings /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/sms" element={<ProtectedRoute allowedRoles={['admin']}><SMSNotifications /></ProtectedRoute>} />
                <Route path="/audit-log" element={<ProtectedRoute allowedRoles={['admin']}><AuditLog /></ProtectedRoute>} />
                <Route path="/admin-security" element={<ProtectedRoute allowedRoles={['admin']}><AdminSecurityDashboard /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
