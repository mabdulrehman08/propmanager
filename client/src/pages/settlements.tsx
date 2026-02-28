import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, TrendingUp, Clock, Calculator } from "lucide-react";
import { useState } from "react";

function formatPKR(amount: number) {
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

export default function Settlements() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));

  const { data: properties = [] } = useQuery<any[]>({ queryKey: ["/api/properties"] });
  const { data: mySettlements = [] } = useQuery<any[]>({ queryKey: ["/api/settlements/my"] });

  const propertySettlementsQuery = useQuery<any[]>({
    queryKey: ["/api/properties", selectedProperty, "settlements"],
    queryFn: async () => {
      if (!selectedProperty) return [];
      const res = await fetch(`/api/properties/${selectedProperty}/settlements`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedProperty,
  });

  const propertyUsersQuery = useQuery<any[]>({
    queryKey: ["/api/properties", selectedProperty, "users"],
    queryFn: async () => {
      if (!selectedProperty) return [];
      const res = await fetch(`/api/properties/${selectedProperty}/users`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedProperty,
  });

  const calculateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/properties/${selectedProperty}/calculate-settlements`, {
        month: parseInt(selectedMonth),
        year: parseInt(selectedYear),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Settlements calculated" });
      queryClient.invalidateQueries({ queryKey: ["/api/properties", selectedProperty, "settlements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settlements/my"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const totalEarned = mySettlements.reduce((s: number, os: any) => s + parseFloat(os.ownerShare || "0"), 0);
  const totalDistributed = mySettlements.reduce((s: number, os: any) => s + parseFloat(os.amountDistributed || "0"), 0);
  const pending = totalEarned - totalDistributed;

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Owner Settlements</h1>
        <p className="text-muted-foreground">Multi-owner rent distribution and settlement tracking</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-xl font-bold" data-testid="text-total-earned">{formatPKR(totalEarned)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Distributed</p>
                <p className="text-xl font-bold" data-testid="text-total-distributed">{formatPKR(totalDistributed)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Settlement</p>
                <p className="text-xl font-bold" data-testid="text-pending-settlement">{formatPKR(pending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Calculate Settlements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <p className="text-sm mb-1 text-muted-foreground">Property</p>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger className="w-[250px]" data-testid="select-settlement-property">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm mb-1 text-muted-foreground">Month</p>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[120px]" data-testid="select-settlement-month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm mb-1 text-muted-foreground">Year</p>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[100px]" data-testid="select-settlement-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => 2015 + i).map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              data-testid="button-calculate-settlements"
              onClick={() => calculateMutation.mutate()}
              disabled={!selectedProperty || calculateMutation.isPending}
            >
              {calculateMutation.isPending ? "Calculating..." : "Calculate"}
            </Button>
          </div>

          {selectedProperty && propertyUsersQuery.data && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">Owners</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Owner</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Ownership %</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {propertyUsersQuery.data
                    .filter((pu: any) => pu.role === "property_owner" || pu.role === "co_owner")
                    .map((pu: any) => (
                    <TableRow key={pu.id} data-testid={`row-owner-${pu.id}`}>
                      <TableCell>{pu.userName}</TableCell>
                      <TableCell>
                        <Badge variant={pu.role === "property_owner" ? "default" : "secondary"}>
                          {pu.role.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{pu.ownershipPercent}%</TableCell>
                      <TableCell>
                        <Badge variant={pu.status === "approved" ? "default" : "destructive"}>
                          {pu.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {propertySettlementsQuery.data && propertySettlementsQuery.data.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">Settlement History</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Total Rent</TableHead>
                    <TableHead>Owner Share</TableHead>
                    <TableHead>Distributed</TableHead>
                    <TableHead>Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {propertySettlementsQuery.data.map((s: any) => (
                    <TableRow key={s.id} data-testid={`row-settlement-${s.id}`}>
                      <TableCell>{months[s.month - 1]} {s.year}</TableCell>
                      <TableCell>{formatPKR(parseFloat(s.totalRent))}</TableCell>
                      <TableCell>{formatPKR(parseFloat(s.ownerShare))}</TableCell>
                      <TableCell>{formatPKR(parseFloat(s.amountDistributed))}</TableCell>
                      <TableCell className="font-medium">{formatPKR(parseFloat(s.balance))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
