import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { UpgradeBanner } from "@/components/subscription/upgrade-banner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Chart } from "@/components/ui/chart";
import { Helmet } from "react-helmet-async";
import {
  File,
  Users,
  ArrowUpRight,
  FileBarChart,
  Plus,
  CalendarDays,
  CreditCard,
  Banknote,
  Building,
  Globe,
  MailIcon,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import type { Invoice } from "../../../shared/schema";

interface Client {
  id: number;
  name: string;
  country?: string;
}

interface ChartData {
  name: string;
  revenue: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [invoiceStats, setInvoiceStats] = useState({
    total: 0,
    paid: 0,
    overdue: 0,
    draft: 0,
  });

  // Fetch invoices
  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  // Fetch clients
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Calculate statistics and set recent invoices
  useEffect(() => {
    if (invoices?.length > 0) {
      // Set recent invoices (latest 5)
      const sorted = [...invoices].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const typedRecentInvoices: Invoice[] = sorted.slice(0, 5);
      setRecentInvoices(typedRecentInvoices);

      // Calculate statistics
      const stats = {
        total: invoices.length,
        paid: invoices.filter(inv => inv.status === "paid").length,
        overdue: invoices.filter(inv => inv.status === "overdue").length,
        draft: invoices.filter(inv => inv.status === "draft").length,
      };
      setInvoiceStats(stats);
    }
  }, [invoices]);

  // Calculate monthly revenue for chart
  const getMonthlyData = () => {
    if (!invoices?.length) return [];

    const currentYear = new Date().getFullYear();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Initialize monthly data
    const monthlyData = monthNames.map((name) => ({
      name,
      revenue: 0,
    }));
    
    // Sum up invoices by month
    invoices
      .filter(inv => inv.status === "paid" && new Date(inv.invoiceDate).getFullYear() === currentYear)
      .forEach(inv => {
        const month = new Date(inv.invoiceDate).getMonth();
        monthlyData[month].revenue += parseFloat(inv.total.toString());
      });
    
    return monthlyData;
  };

  return (
    <>
      <Helmet>
        <title>Dashboard | InvoiceFlow</title>
        <meta name="description" content="View your invoice statistics, recent activity, and manage your business from one central dashboard." />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Header />
        <div className="flex h-[calc(100vh-64px)]">
          <div className="w-64 flex-shrink-0">
            <Sidebar />
          </div>
          <main className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              {/* Header Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      Welcome back, {user?.fullName || "User"}
                    </p>
                  </div>
                  <Button 
                    onClick={() => navigate("/invoices/create")}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Invoice
                  </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-none">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Invoices</p>
                          <h3 className="text-2xl font-bold mt-2">{invoiceStats.total}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <File className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-none">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Paid Invoices</p>
                          <h3 className="text-2xl font-bold mt-2">{invoiceStats.paid}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <Banknote className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-none">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
                          <h3 className="text-2xl font-bold mt-2">{invoiceStats.overdue}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                          <CalendarDays className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-none">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Draft Invoices</p>
                          <h3 className="text-2xl font-bold mt-2">{invoiceStats.draft}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                          <FileBarChart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Charts & Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Monthly Revenue Chart */}
                <Card className="lg:col-span-2 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-none">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Monthly Revenue</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">Your revenue for the current year</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <Chart
                        data={getMonthlyData()}
                        index="name"
                        categories={["revenue"]}
                        colors={["blue"]}
                        valueFormatter={(value: number) => formatCurrency(value, "USD")}
                        showLegend={false}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Clients Summary */}
                <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-none">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Clients</CardTitle>
                      <Link href="/clients">
                        <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 h-8">
                          View All <ArrowUpRight className="ml-1 h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {clients && clients.length > 0 ? (
                        <>
                          <div className="text-2xl font-bold flex items-center text-gray-900 dark:text-gray-100">
                            <Users className="text-blue-600 dark:text-blue-400 mr-2 h-6 w-6" />
                            {clients.length}
                            <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">
                              clients total
                            </span>
                          </div>
                          <div className="space-y-2">
                            {clients.slice(0, 5).map((client) => (
                              <div key={client.id} className="flex items-center justify-between">
                                <div className="text-sm truncate max-w-[180px] text-gray-900 dark:text-gray-100">{client.name}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {client.country || "N/A"}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-6 text-center">
                          <Users className="h-8 w-8 text-gray-400 dark:text-gray-600 mb-2" />
                          <p className="text-gray-600 dark:text-gray-400">No clients yet</p>
                          <Link href="/clients/create">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-4 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50"
                            >
                              <Plus className="mr-2 h-3 w-3" />
                              Add Client
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Invoices */}
              <div className="mb-6">
                <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-none">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Invoices</CardTitle>
                      <Link href="/invoices">
                        <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 h-8">
                          View All <ArrowUpRight className="ml-1 h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {recentInvoices.length > 0 ? (
                      <DataTable
                        data={recentInvoices}
                        columns={[
                          {
                            header: "Invoice #",
                            accessorKey: "invoiceNumber",
                          },
                          {
                            header: "Client",
                            accessorKey: "clientId",
                            cell: (item) => {
                              const client = clients.find(c => c.id === item.clientId);
                              return client?.name || "Unknown";
                            }
                          },
                          {
                            header: "Date",
                            accessorKey: "invoiceDate",
                            cell: (item) => formatDate(item.invoiceDate, "PP")
                          },
                          {
                            header: "Amount",
                            accessorKey: "total",
                            cell: (item) => formatCurrency(item.total, item.currency)
                          },
                          {
                            header: "Status",
                            accessorKey: "status",
                            cell: (item) => (
                              <span className={`text-xs py-1 px-2 rounded-full ${
                                item.status === "paid" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400" :
                                item.status === "overdue" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400" :
                                "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400"
                              }`}>
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                              </span>
                            )
                          }
                        ]}
                        onRowClick={(item) => navigate(`/invoices/${item.id}`)}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center">
                        <File className="h-8 w-8 text-gray-400 dark:text-gray-600 mb-2" />
                        <p className="text-gray-600 dark:text-gray-400">No invoices yet</p>
                        <Link href="/invoices/create">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-4 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50"
                          >
                            <Plus className="mr-2 h-3 w-3" />
                            Create Invoice
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </div>
      
      <UpgradeBanner />
    </>
  );
}
