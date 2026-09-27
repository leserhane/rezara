import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "./components/protected-route";
import { BusinessApprovalGate } from "./components/business-approval-gate";

// Pages
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import ReservationsList from "./pages/reservations/index";
import NewReservation from "./pages/reservations/new";
import ReservationDetails from "./pages/reservations/[id]";
import CalendarView from "./pages/calendar";
import Payments from "./pages/payments";
import Settings from "./pages/settings";
import AdminPanel from "./pages/admin";
import PublicPaymentPage from "./pages/public/payment-page";
import PaymentSuccess from "./pages/public/payment-success";
import PaymentCancelled from "./pages/public/payment-cancelled";
import NotFound from "./pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function HomeRedirect() {
  return <Redirect to="/dashboard" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/login" component={Login} />
      
      {/* Public Routes */}
      <Route path="/r/:linkId" component={PublicPaymentPage} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/payment-cancelled" component={PaymentCancelled} />

      {/* Protected Routes */}
      <Route path="/dashboard">
        <ProtectedRoute><BusinessApprovalGate><Dashboard /></BusinessApprovalGate></ProtectedRoute>
      </Route>
      <Route path="/reservations">
        <ProtectedRoute><BusinessApprovalGate><ReservationsList /></BusinessApprovalGate></ProtectedRoute>
      </Route>
      <Route path="/reservations/new">
        <ProtectedRoute><BusinessApprovalGate><NewReservation /></BusinessApprovalGate></ProtectedRoute>
      </Route>
      <Route path="/reservations/:id">
        <ProtectedRoute><BusinessApprovalGate><ReservationDetails /></BusinessApprovalGate></ProtectedRoute>
      </Route>
      <Route path="/calendar">
        <ProtectedRoute><BusinessApprovalGate><CalendarView /></BusinessApprovalGate></ProtectedRoute>
      </Route>
      <Route path="/payments">
        <ProtectedRoute><BusinessApprovalGate><Payments /></BusinessApprovalGate></ProtectedRoute>
      </Route>
      {/* Not gated: owners must be able to complete their profile while awaiting approval. */}
      <Route path="/settings">
        <ProtectedRoute><Settings /></ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute><AdminPanel /></ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
