import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreditCard, Plus } from "lucide-react";
import { useState } from "react";

function formatPKR(amount: number) {
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

export default function Payments() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [source, setSource] = useState("manual");
  const [tenantName, setTenantName] = useState("");

  const { data: payments = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/payments"] });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/payments", {
        amount,
        date,
        referenceNumber: referenceNumber || null,
        source,
        tenantName: tenantName || null,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: data.status === "matched" ? "Payment matched to invoice!" : "Payment recorded",
        description: data.status === "matched" ? "Auto-matched to an existing invoice" : "Payment added as unmatched",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setOpen(false);
      setAmount("");
      setReferenceNumber("");
      setTenantName("");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <CreditCard className="w-6 h-6" />
            Payments
          </h1>
          <p className="text-muted-foreground">Payment tracking and invoice matching</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-payment">
              <Plus className="w-4 h-4 mr-2" />
              Add Payment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Amount (PKR)</Label>
                <Input
                  type="number"
                  data-testid="input-payment-amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 80000"
                />
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  data-testid="input-payment-date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Reference Number</Label>
                <Input
                  data-testid="input-payment-reference"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Bank reference or receipt #"
                />
              </div>
              <div>
                <Label>Source</Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger data-testid="select-payment-source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tenant Name (for matching)</Label>
                <Input
                  data-testid="input-payment-tenant"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  placeholder="e.g. Ahmed Khan"
                />
              </div>
              <Button
                className="w-full"
                data-testid="button-submit-payment"
                onClick={() => createMutation.mutate()}
                disabled={!amount || createMutation.isPending}
              >
                {createMutation.isPending ? "Processing..." : "Record Payment"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : payments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No payments recorded yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Matched Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p: any) => (
                  <TableRow key={p.id} data-testid={`row-payment-${p.id}`}>
                    <TableCell>{p.date}</TableCell>
                    <TableCell className="font-medium">{formatPKR(parseFloat(p.amount))}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.source}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{p.referenceNumber || "-"}</TableCell>
                    <TableCell>{p.tenantName || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "matched" ? "default" : "secondary"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{p.matchedInvoiceId ? `#${p.matchedInvoiceId}` : "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
