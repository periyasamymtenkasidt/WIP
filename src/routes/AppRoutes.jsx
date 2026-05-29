import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import ProtectedRoute from "./ProtectedRoute";
import ErrorBoundary from "../components/ErrorBoundary";

// Eagerly loaded routes
import Login from "../pages/auth/Login";
import ForgotPassword from "../pages/auth/ForgotPassword";
import Dashboard from "../pages/dashboard/Dashboard";
import Signout from "../pages/Signout";
import NotFound from "../pages/NotFound";

// Lazy loaded routes
const Leads = lazy(() => import("../pages/leads/Leads"));
const LeadEdit = lazy(() => import("../pages/leads/LeadEdit"));
const Client = lazy(() => import("../pages/clients/Client"));
const ClientProfile = lazy(() => import("../pages/clients/ClientProfile"));
const Accounts = lazy(() => import("../pages/Accounts"));
const Pipeline = lazy(() => import("../pages/Pipeline"));
const Analytics = lazy(() => import("../pages/Analytics"));
const Reports = lazy(() => import("../pages/Reports"));
const Support = lazy(() => import("../pages/Support"));
const Deals = lazy(() => import("../pages/deals/Deals"));
const Projects = lazy(() => import("../pages/projects/Projects"));
const ProjectDetail = lazy(() => import("../pages/projects/ProjectDetail"));
const Master=lazy(()=>import("../pages/master/Master"));
const ProposalMaster=lazy(()=>import("../pages/master/proposalMaster/ProposalMaster"));
const ItemLibrary=lazy(()=>import("../pages/master/itemMaster/ItemLibrary"));
const TermsAndConditions=lazy(()=>import("../pages/master/termsAndConditions/TermsAndConditions"));
const BOQList = lazy(() => import("../pages/boq/BOQList"));
const Settings = lazy(() => import("../pages/settings/Settings"));
const BOQEditor = lazy(() => import("../pages/boq/BOQEditor"));

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen">
  <div className="w-10 h-10 border-4 border-black/10 border-t-blue-500 rounded-full animate-spin"></div>
  </div>
);

const AppRoutes = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="leads">
                <Route index element={<Leads />} />
                <Route path=":id" element={<LeadEdit />} />
              </Route>
              <Route path="clients">
                <Route index element={<Client />} />
                <Route path=":id" element={<ClientProfile />} />
              </Route>
              <Route path="projects">
                <Route index element={<Projects />} />
                <Route path=":id" element={<ProjectDetail />} />
              </Route>
              <Route path="boq">
                <Route index element={<BOQList />} />
                <Route path=":id" element={<BOQEditor />} />
              </Route>
              <Route path="master">
                <Route index element={<Master />} />
                <Route path=":id" element={<ProposalMaster />} />
                <Route path=":id" element={<ItemLibrary />} />
                <Route path=":id" element={<TermsAndConditions />} />
              </Route>
              <Route path="deals" element={<Deals />} />
              <Route path="accounts" element={<Accounts />} />
              <Route path="pipeline" element={<Pipeline />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="reports" element={<Reports />} />
              <Route path="support" element={<Support />} />
              <Route path="settings" element={<Settings />} />
              <Route path="signout" element={<Signout />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default AppRoutes;
