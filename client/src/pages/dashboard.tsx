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
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [invoiceStats, setInvoiceStats] = useState({
    total: 0,
    paid: 0,
    overdue: 0,
    draft: 0,
  });

  // Fetch invoices
  const { data: invoices = [] } = useQuery({
    queryKey: ["/api/invoices"],
  });

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
  });

  // Calculate statistics and set recent invoices
  useEffect(() => {
    if (invoices?.length > 0) {
      // Set recent invoices (latest 5)
      const sorted = [...invoices].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setRecentInvoices(sorted.slice(0, 5));

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
      
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex">
          <Sidebar className="w-64" />
          <main className="flex-1 md:ml-64 p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                  <p className="text-gray-500">
                    Welcome back, {user?.fullName || "User"}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <UpgradeBanner minimal />
                  <Button onClick={() => navigate("/invoices/create")}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Invoice
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Invoices</p>
                        <p className="text-2xl font-bold mt-1">{invoiceStats.total}</p>
                      </div>
                      <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <File className="h-6 w-6 text-primary-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Paid Invoices</p>
                        <p className="text-2xl font-bold mt-1">{invoiceStats.paid}</p>
                      </div>
                      <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Banknote className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Overdue</p>
                        <p className="text-2xl font-bold mt-1">{invoiceStats.overdue}</p>
                      </div>
                      <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                        <CalendarDays className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Draft Invoices</p>
                        <p className="text-2xl font-bold mt-1">{invoiceStats.draft}</p>
                      </div>
                      <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <FileBarChart className="h-6 w-6 text-gray-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts & Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Monthly Revenue Chart */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Monthly Revenue</CardTitle>
                    <CardDescription>Your revenue for the current year</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <Chart 
                        data={getMonthlyData()}
                        index="name"
                        categories={["revenue"]}
                        colors={["primary"]}
                        valueFormatter={(value) => formatCurrency(value, "USD")}
                        showLegend={false}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Clients Summary */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Clients</CardTitle>
                      <Link href="/clients">
                        <Button variant="ghost" size="sm" className="text-primary h-8">
                          View All <ArrowUpRight className="ml-1 h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {clients && clients.length > 0 ? (
                        <>
                          <div className="text-2xl font-bold flex items-center">
                            <Users className="text-primary-500 mr-2 h-6 w-6" />
                            {clients.length}
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                              clients total
                            </span>
                          </div>
                          <div className="space-y-2">
                            {clients.slice(0, 5).map((client) => (
                              <div key={client.id} className="flex items-center justify-between">
                                <div className="text-sm truncate max-w-[180px]">{client.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {client.country || "N/A"}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-6 text-center">
                          <Users className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">No clients yet</p>
                          <Link href="/clients/create">
                            <Button variant="outline" size="sm" className="mt-4">
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
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Recent Invoices</CardTitle>
                      <Link href="/invoices">
                        <Button variant="ghost" size="sm" className="text-primary h-8">
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
                                item.status === "paid" ? "bg-green-100 text-green-800" :
                                item.status === "overdue" ? "bg-red-100 text-red-800" :
                                "bg-gray-100 text-gray-800"
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
                        <File className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No invoices yet</p>
                        <Link href="/invoices/create">
                          <Button variant="outline" size="sm" className="mt-4">
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
