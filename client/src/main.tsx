import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Helmet, HelmetProvider } from "react-helmet-async";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <Helmet>
      <title>InvoiceFlow - Professional Invoice Management</title>
      <meta name="description" content="Generate professional invoices with international tax support, custom templates, and easy client management. Perfect for businesses of all sizes." />
      <meta property="og:title" content="InvoiceFlow - Professional Invoice Management" />
      <meta property="og:description" content="Create beautiful, tax-compliant invoices for clients worldwide. Free and premium plans available." />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="InvoiceFlow" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
    </Helmet>
    <App />
  </HelmetProvider>
);
