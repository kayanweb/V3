import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { LangProvider } from "@/contexts/lang-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

// Auth pages
import LoginPage from "@/pages/login/page";
import SignupPage from "@/pages/signup/page";
import ForgotPasswordPage from "@/pages/forgot-password/page";
import ChangePasswordPage from "@/pages/change-password/page";
import PendingApprovalPage from "@/pages/pending-approval/page";
import SetupPage from "@/pages/setup/page";

// Dashboard pages
import DashboardPage from "@/pages/dashboard/page";
import StaffPage from "@/pages/staff/page";
import StaffAddPage from "@/pages/staff/add/page";
import StaffDetailPage from "@/pages/staff/[id]/page";
import StaffAttendancePage from "@/pages/staff/attendance/page";
import StaffPerformancePage from "@/pages/staff/performance/page";
import StaffOvertimePage from "@/pages/staff/overtime/page";
import StaffSchedulePage from "@/pages/staff/schedule/page";
import DepartmentsPage from "@/pages/departments/page";
import DepartmentDetailPage from "@/pages/departments/[id]/page";
import DepartmentBedsPage from "@/pages/departments/beds/page";
import DepartmentPatientsPage from "@/pages/departments/patients/page";
import DepartmentIsolationPage from "@/pages/departments/isolation/page";
import EmployeesPage from "@/pages/employees/page";
import InventoryPage from "@/pages/inventory/page";
import EquipmentPage from "@/pages/equipment/page";
import ReportsPage from "@/pages/reports/page";
import ReportCreatePage from "@/pages/reports/create/page";
import ReportDetailPage from "@/pages/reports/[id]/page";
import AnalyticsPage from "@/pages/analytics/page";
import AbsencePage from "@/pages/absence/page";
import AnnouncementsPage from "@/pages/announcements/page";
import AppraisalsPage from "@/pages/appraisals/page";
import ArchivePage from "@/pages/archive/page";
import ContactPage from "@/pages/contact/page";
import EmergencyPage from "@/pages/emergency/page";
import EmergencyResponsePage from "@/pages/emergency/response/page";
import EWSPage from "@/pages/ews/page";
import HandoverPage from "@/pages/handover/page";
import IncidentsPage from "@/pages/incidents/page";
import LeaveAbsencePage from "@/pages/leave-absence/page";
import MaintenancePage from "@/pages/maintenance/page";
import MealsPage from "@/pages/meals/page";
import MessagesPage from "@/pages/messages/page";
import MonthlyRosterPage from "@/pages/monthly-roster/page";
import NotificationsPage from "@/pages/notifications/page";
import PayrollPage from "@/pages/payroll/page";
import PoliciesPage from "@/pages/policies/page";
import PreferencesPage from "@/pages/preferences/page";
import QualityPage from "@/pages/quality/page";
import RosterPage from "@/pages/roster/page";
import StaffPortalPage from "@/pages/staff-portal/page";
import TasksPage from "@/pages/tasks/page";
import TrainingPage from "@/pages/training/page";
import VacationsPage from "@/pages/vacations/page";
import VitalsPage from "@/pages/vitals/page";
import WorkflowsPage from "@/pages/workflows/page";
import AdminUsersPage from "@/pages/admin/users/page";
import AdminPendingUsersPage from "@/pages/admin/pending-users/page";
import AdminRolesPage from "@/pages/admin/roles/page";
import AdminSettingsPage from "@/pages/admin/settings/page";
import AdminLogsPage from "@/pages/admin/logs/page";

const queryClient = new QueryClient();

function DashboardRoutes() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/staff" component={StaffPage} />
        <Route path="/staff/add" component={StaffAddPage} />
        <Route path="/staff/attendance" component={StaffAttendancePage} />
        <Route path="/staff/performance" component={StaffPerformancePage} />
        <Route path="/staff/overtime" component={StaffOvertimePage} />
        <Route path="/staff/schedule" component={StaffSchedulePage} />
        <Route path="/staff/:id" component={StaffDetailPage} />
        <Route path="/departments" component={DepartmentsPage} />
        <Route path="/departments/beds" component={DepartmentBedsPage} />
        <Route path="/departments/patients" component={DepartmentPatientsPage} />
        <Route path="/departments/isolation" component={DepartmentIsolationPage} />
        <Route path="/departments/:id" component={DepartmentDetailPage} />
        <Route path="/employees" component={EmployeesPage} />
        <Route path="/inventory" component={InventoryPage} />
        <Route path="/equipment" component={EquipmentPage} />
        <Route path="/reports" component={ReportsPage} />
        <Route path="/reports/create" component={ReportCreatePage} />
        <Route path="/reports/:id" component={ReportDetailPage} />
        <Route path="/analytics" component={AnalyticsPage} />
        <Route path="/absence" component={AbsencePage} />
        <Route path="/announcements" component={AnnouncementsPage} />
        <Route path="/appraisals" component={AppraisalsPage} />
        <Route path="/archive" component={ArchivePage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/emergency" component={EmergencyPage} />
        <Route path="/emergency/response" component={EmergencyResponsePage} />
        <Route path="/ews" component={EWSPage} />
        <Route path="/handover" component={HandoverPage} />
        <Route path="/incidents" component={IncidentsPage} />
        <Route path="/leave-absence" component={LeaveAbsencePage} />
        <Route path="/maintenance" component={MaintenancePage} />
        <Route path="/meals" component={MealsPage} />
        <Route path="/messages" component={MessagesPage} />
        <Route path="/monthly-roster" component={MonthlyRosterPage} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/payroll" component={PayrollPage} />
        <Route path="/policies" component={PoliciesPage} />
        <Route path="/preferences" component={PreferencesPage} />
        <Route path="/quality" component={QualityPage} />
        <Route path="/roster" component={RosterPage} />
        <Route path="/staff-portal" component={StaffPortalPage} />
        <Route path="/tasks" component={TasksPage} />
        <Route path="/training" component={TrainingPage} />
        <Route path="/vacations" component={VacationsPage} />
        <Route path="/vitals" component={VitalsPage} />
        <Route path="/workflows" component={WorkflowsPage} />
        <Route path="/admin/users" component={AdminUsersPage} />
        <Route path="/admin/pending-users" component={AdminPendingUsersPage} />
        <Route path="/admin/roles" component={AdminRolesPage} />
        <Route path="/admin/settings" component={AdminSettingsPage} />
        <Route path="/admin/logs" component={AdminLogsPage} />
        <Route path="/change-password" component={ChangePasswordPage} />
      </Switch>
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/dashboard" />} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/pending-approval" component={PendingApprovalPage} />
      <Route path="/setup" component={SetupPage} />
      <Route component={DashboardRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <LangProvider>
              <NotificationProvider>
                <Router />
                <Toaster richColors position="top-left" dir="rtl" />
              </NotificationProvider>
            </LangProvider>
          </AuthProvider>
        </ThemeProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
