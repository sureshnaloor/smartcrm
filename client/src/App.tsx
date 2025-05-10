import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/context/auth-context";
import LoginPage from "@/pages/auth/login";
import RegisterPage from "@/pages/auth/register";
import Dashboard from "@/pages/dashboard";
import InvoicesPage from "@/pages/invoices";
import CreateInvoicePage from "@/pages/invoices/create";
import InvoiceDetailsPage from "@/pages/invoices/[id]";
import ClientsPage from "@/pages/clients";
import CreateClientPage from "@/pages/clients/create";
import SettingsPage from "@/pages/settings";
import PrivateRoute from "@/components/auth/private-route";

function Router() {
  return (
    <Switch>
      {/* Auth routes */}
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      
      {/* Protected routes */}
      <Route path="/">
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      </Route>
      
      <Route path="/invoices">
        <PrivateRoute>
          <InvoicesPage />
        </PrivateRoute>
      </Route>
      
      <Route path="/invoices/create">
        <PrivateRoute>
          <CreateInvoicePage />
        </PrivateRoute>
      </Route>
      
      <Route path="/invoices/:id">
        {(params) => (
          <PrivateRoute>
            <InvoiceDetailsPage id={params.id} />
          </PrivateRoute>
        )}
      </Route>
      
      <Route path="/clients">
        <PrivateRoute>
          <ClientsPage />
        </PrivateRoute>
      </Route>
      
      <Route path="/clients/create">
        <PrivateRoute>
          <CreateClientPage />
        </PrivateRoute>
      </Route>
      
      <Route path="/settings">
        <PrivateRoute>
          <SettingsPage />
        </PrivateRoute>
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
