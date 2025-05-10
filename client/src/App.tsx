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

// Quotation Pages
import QuotationsPage from "@/pages/quotations";
import CreateQuotationPage from "@/pages/quotations/create";
import QuotationDetailsPage from "@/pages/quotations/[id]";

// Materials Pages
import MaterialsPage from "@/pages/materials";

// Terms & Conditions Pages
import TermsPage from "@/pages/terms";

// Documents Page
import DocumentsPage from "@/pages/documents";

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
      
      {/* Quotation Routes */}
      <Route path="/quotations">
        <PrivateRoute>
          <QuotationsPage />
        </PrivateRoute>
      </Route>
      
      <Route path="/quotations/create">
        <PrivateRoute>
          <CreateQuotationPage />
        </PrivateRoute>
      </Route>
      
      <Route path="/quotations/:id">
        {(params) => (
          <PrivateRoute>
            <QuotationDetailsPage id={params.id} />
          </PrivateRoute>
        )}
      </Route>
      
      {/* Invoice Routes */}
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
      
      {/* Client Routes */}
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
      
      {/* Materials Routes */}
      <Route path="/materials">
        <PrivateRoute>
          <MaterialsPage />
        </PrivateRoute>
      </Route>
      
      {/* Terms Routes */}
      <Route path="/terms">
        <PrivateRoute>
          <TermsPage />
        </PrivateRoute>
      </Route>
      
      {/* Documents Route */}
      <Route path="/documents">
        <PrivateRoute>
          <DocumentsPage />
        </PrivateRoute>
      </Route>
      
      {/* Settings Route */}
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
