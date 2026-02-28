import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { RentInvoice, Tenant, Unit, Property } from "@shared/schema";
import {
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  MinusCircle,
  RefreshCw,
  Filter,
  CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function formatCurrency(amount: string | number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
  }).format(typeof amount === "string" ? parseFloat(amount) : amount);
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function statusConfig(status: string) {
  switch (status) {
    case "paid":
      return {
        label: "Paid",
        icon: CheckCircle2,
        variant: "default" as const,
        color: "text-green-600 dark:text-green-400",
      };
    case "late":
      return {
        label: "Late",
        icon: Clock,
        variant: "secondary" as const,
        color: "text-yellow-600 dark:text-yellow-400",
      };
    case "partial":
      return {
        label: "Partial",
        icon: MinusCircle,
        variant: "outline" as const,
        color: "text-orange-600 dark:text-orange-400",
      };
    default:
      return {
        label: "Unpaid",
        icon: AlertCircle,
        variant: "destructive" as const,
        color: "text-red-600 dark:text-red-400",
      };
  }
}

function PaymentDialog({
  open,
  onOpenChange,
  invoice,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: RentInvoice;
}) {
  const { toast } = useToast();
  const [paidAmount, setPaidAmount] = useState(invoice.amount);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");

  const mutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("POST", `/api/invoices/${invoice.id}/pay`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Payment recorded",
        description: `Payment of ${formatCurrency(paidAmount)} has been recorded.`,
      });
      onOpenChange(false);
    },
    onError: (e: Error) => {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 rounded-md bg-muted/50">
            <p className="text-sm">
              Invoice: <span className="font-mono">{invoice.receiptNumber}</span>
            </p>
            <p className="text-sm">
              Amount Due:{" "}
              <span className="font-semibold">{formatCurrency(invoice.amount)}</span>
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paidAmount">Amount Received (PKR)</Label>
            <Input
              id="paidAmount"
              type="number"
              min="0"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              data-testid="input-paid-amount"
            />
          </div>
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger data-testid="select-payment-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="online">Online Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full"
            onClick={() =>
              mutation.mutate({ paidAmount, paymentMethod })
            }
            disabled={mutation.isPending}
            data-testid="button-confirm-payment"
          >
            {mutation.isPending ? "Processing..." : "Record Payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function RentCollection() {
  const { toast } = useToast();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [payInvoice, setPayInvoice] = useState<RentInvoice | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: invoices, isLoading } = useQuery<RentInvoice[]>({
    queryKey: ["/api/invoices"],
  });
  const { data: allTenants } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
  });
  const { data: allUnits } = useQuery<Unit[]>({
    queryKey: ["/api/units"],
  });
  const { data: allProperties } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const generateMutation = useMutation({
    mutationFn: (data: { month: number; year: number }) =>
      apiRequest("POST", "/api/invoices/generate", data),
    onSuccess: async (res) => {
      const result = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Invoices generated",
        description: `${result.generated} invoice(s) created for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}.`,
      });
    },
    onError: (e: Error) => {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  const getTenantName = (tenantId: number) =>
    allTenants?.find((t) => t.id === tenantId)?.name || "Unknown";

  const getUnitPropertyInfo = (unitId: number) => {
    const unit = allUnits?.find((u) => u.id === unitId);
    if (!unit) return { unitName: "Unknown", propertyName: "Unknown" };
    const prop = allProperties?.find((p) => p.id === unit.propertyId);
    return { unitName: unit.unitName, propertyName: prop?.name || "Unknown" };
  };

  const filteredInvoices = invoices?.filter((inv) => {
    const monthMatch =
      inv.month === selectedMonth && inv.year === selectedYear;
    const statusMatch =
      statusFilter === "all" || inv.status === statusFilter;
    return monthMatch && statusMatch;
  });

  const monthStats = filteredInvoices
    ? {
        total: filteredInvoices.length,
        paid: filteredInvoices.filter((i) => i.status === "paid").length,
        partial: filteredInvoices.filter((i) => i.status === "partial").length,
        unpaid: filteredInvoices.filter((i) => i.status === "unpaid").length,
        late: filteredInvoices.filter((i) => i.status === "late").length,
        totalAmount: filteredInvoices.reduce(
          (s, i) => s + parseFloat(i.amount),
          0,
        ),
        collectedAmount: filteredInvoices.reduce(
          (s, i) => s + parseFloat(i.paidAmount || "0"),
          0,
        ),
      }
    : null;

  const years = [];
  for (let y = now.getFullYear() - 1; y <= now.getFullYear() + 1; y++) {
    years.push(y);
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-bold"
            data-testid="text-rent-collection-title"
          >
            Rent Collection
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage monthly rent payments
          </p>
        </div>
        <Button
          onClick={() =>
            generateMutation.mutate({
              month: selectedMonth,
              year: selectedYear,
            })
          }
          disabled={generateMutation.isPending}
          data-testid="button-generate-invoices"
        >
          <RefreshCw
            className={`h-4 w-4 mr-1 ${generateMutation.isPending ? "animate-spin" : ""}`}
          />
          Generate Invoices
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select
          value={String(selectedMonth)}
          onValueChange={(v) => setSelectedMonth(parseInt(v))}
        >
          <SelectTrigger className="w-[140px]" data-testid="select-month">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTH_NAMES.map((m, i) => (
              <SelectItem key={i} value={String(i + 1)}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={String(selectedYear)}
          onValueChange={(v) => setSelectedYear(parseInt(v))}
        >
          <SelectTrigger className="w-[100px]" data-testid="select-year">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px]" data-testid="select-status-filter">
            <Filter className="h-3 w-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="late">Late</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {monthStats && monthStats.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="stat-paid-count">
                {monthStats.paid}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Paid</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="stat-unpaid-count">
                {monthStats.unpaid}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Unpaid</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold" data-testid="stat-total-amount">
                {formatCurrency(monthStats.totalAmount)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Total Expected
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="stat-collected-amount">
                {formatCurrency(monthStats.collectedAmount)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Collected</p>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
      ) : filteredInvoices && filteredInvoices.length > 0 ? (
        <div className="space-y-2">
          {filteredInvoices.map((invoice) => {
            const sc = statusConfig(invoice.status);
            const StatusIcon = sc.icon;
            const info = getUnitPropertyInfo(invoice.unitId);
            return (
              <Card
                key={invoice.id}
                className="hover-elevate"
                data-testid={`card-invoice-${invoice.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          invoice.status === "paid"
                            ? "bg-green-100 dark:bg-green-900/30"
                            : invoice.status === "unpaid"
                              ? "bg-red-100 dark:bg-red-900/30"
                              : "bg-yellow-100 dark:bg-yellow-900/30"
                        }`}
                      >
                        <StatusIcon className={`h-4 w-4 ${sc.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {getTenantName(invoice.tenantId)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {info.propertyName} - {info.unitName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatCurrency(invoice.amount)}
                        </p>
                        {invoice.paidAmount &&
                          parseFloat(invoice.paidAmount) > 0 &&
                          invoice.status !== "paid" && (
                            <p className="text-xs text-muted-foreground">
                              Paid: {formatCurrency(invoice.paidAmount)}
                            </p>
                          )}
                        {invoice.paidDate && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(invoice.paidDate).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" },
                            )}
                          </p>
                        )}
                      </div>
                      <Badge variant={sc.variant}>{sc.label}</Badge>
                      {invoice.status !== "paid" && (
                        <Button
                          size="sm"
                          onClick={() => setPayInvoice(invoice)}
                          data-testid={`button-pay-invoice-${invoice.id}`}
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          Pay
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              No invoices for this period
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Generate invoices for {MONTH_NAMES[selectedMonth - 1]}{" "}
              {selectedYear} to start tracking
            </p>
            <Button
              onClick={() =>
                generateMutation.mutate({
                  month: selectedMonth,
                  year: selectedYear,
                })
              }
              disabled={generateMutation.isPending}
              data-testid="button-generate-first-invoices"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Generate Invoices
            </Button>
          </CardContent>
        </Card>
      )}

      {payInvoice && (
        <PaymentDialog
          open={!!payInvoice}
          onOpenChange={(open) => {
            if (!open) setPayInvoice(null);
          }}
          invoice={payInvoice}
        />
      )}
    </div>
  );
}
