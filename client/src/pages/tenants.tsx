import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Tenant, Unit, Property } from "@shared/schema";
import {
  Users,
  Plus,
  Phone,
  Mail,
  Calendar,
  Trash2,
  Edit,
  Search,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function formatCurrency(amount: string | number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
  }).format(typeof amount === "string" ? parseFloat(amount) : amount);
}

function TenantFormDialog({
  open,
  onOpenChange,
  allUnits,
  allProperties,
  editTenant,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allUnits: Unit[];
  allProperties: Property[];
  editTenant?: Tenant;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(editTenant?.name || "");
  const [phone, setPhone] = useState(editTenant?.phone || "");
  const [email, setEmail] = useState(editTenant?.email || "");
  const [unitId, setUnitId] = useState(
    editTenant?.unitId ? String(editTenant.unitId) : "",
  );
  const [leaseStart, setLeaseStart] = useState(editTenant?.leaseStart || "");
  const [leaseEnd, setLeaseEnd] = useState(editTenant?.leaseEnd || "");
  const [securityDeposit, setSecurityDeposit] = useState(
    editTenant?.securityDeposit || "0",
  );
  const [rentDueDay, setRentDueDay] = useState(
    String(editTenant?.rentDueDay || 1),
  );

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (editTenant) {
        return apiRequest("PATCH", `/api/tenants/${editTenant.id}`, data);
      }
      return apiRequest("POST", "/api/tenants", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: editTenant ? "Tenant updated" : "Tenant added",
        description: `${name} has been ${editTenant ? "updated" : "added"} successfully.`,
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

  const getPropertyName = (pId: number) =>
    allProperties.find((p) => p.id === pId)?.name || "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      name,
      phone: phone || null,
      email: email || null,
      unitId: parseInt(unitId),
      leaseStart,
      leaseEnd: leaseEnd || null,
      securityDeposit,
      rentDueDay: parseInt(rentDueDay),
      isActive: editTenant ? editTenant.isActive : 1,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editTenant ? "Edit Tenant" : "Add New Tenant"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenantName">Tenant Name</Label>
            <Input
              id="tenantName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
              data-testid="input-tenant-name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92-300-1234567"
                data-testid="input-tenant-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                data-testid="input-tenant-email"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Unit</Label>
            <Select value={unitId} onValueChange={setUnitId}>
              <SelectTrigger data-testid="select-tenant-unit">
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {allUnits.map((unit) => (
                  <SelectItem key={unit.id} value={String(unit.id)}>
                    {getPropertyName(unit.propertyId)} - {unit.unitName} (
                    {formatCurrency(unit.monthlyRent)}/mo)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leaseStart">Lease Start</Label>
              <Input
                id="leaseStart"
                type="date"
                value={leaseStart}
                onChange={(e) => setLeaseStart(e.target.value)}
                required
                data-testid="input-lease-start"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leaseEnd">Lease End</Label>
              <Input
                id="leaseEnd"
                type="date"
                value={leaseEnd}
                onChange={(e) => setLeaseEnd(e.target.value)}
                data-testid="input-lease-end"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deposit">Security Deposit (PKR)</Label>
              <Input
                id="deposit"
                type="number"
                min="0"
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(e.target.value)}
                data-testid="input-security-deposit"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDay">Rent Due Day</Label>
              <Input
                id="dueDay"
                type="number"
                min="1"
                max="28"
                value={rentDueDay}
                onChange={(e) => setRentDueDay(e.target.value)}
                data-testid="input-rent-due-day"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
            data-testid="button-save-tenant"
          >
            {mutation.isPending
              ? "Saving..."
              : editTenant
                ? "Update Tenant"
                : "Add Tenant"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Tenants() {
  const [formOpen, setFormOpen] = useState(false);
  const [editTenant, setEditTenant] = useState<Tenant | undefined>();
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const { data: tenantsList, isLoading } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
  });
  const { data: allUnits } = useQuery<Unit[]>({
    queryKey: ["/api/units"],
  });
  const { data: allProperties } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/tenants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Tenant deleted" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: number }) =>
      apiRequest("PATCH", `/api/tenants/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Tenant status updated" });
    },
  });

  const getUnitInfo = (unitId: number) => {
    const unit = allUnits?.find((u) => u.id === unitId);
    if (!unit) return { unitName: "Unknown", propertyName: "Unknown", rent: "0" };
    const prop = allProperties?.find((p) => p.id === unit.propertyId);
    return {
      unitName: unit.unitName,
      propertyName: prop?.name || "Unknown",
      rent: unit.monthlyRent,
    };
  };

  const filteredTenants = tenantsList?.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email?.toLowerCase().includes(search.toLowerCase()) ||
      t.phone?.includes(search),
  );

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-tenants-title">
            Tenants
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage tenants across all properties
          </p>
        </div>
        <Button
          onClick={() => {
            setEditTenant(undefined);
            setFormOpen(true);
          }}
          data-testid="button-add-tenant"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Tenant
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tenants by name, email, or phone..."
          className="pl-9"
          data-testid="input-search-tenants"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-md" />
          ))}
        </div>
      ) : filteredTenants && filteredTenants.length > 0 ? (
        <div className="space-y-3">
          {filteredTenants.map((tenant) => {
            const info = getUnitInfo(tenant.unitId);
            return (
              <Card key={tenant.id} className="hover-elevate" data-testid={`card-tenant-${tenant.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-sm font-bold text-primary">
                          {tenant.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </span>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold">
                            {tenant.name}
                          </h3>
                          <Badge variant={tenant.isActive === 1 ? "default" : "secondary"}>
                            {tenant.isActive === 1 ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {info.propertyName} - {info.unitName}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          {tenant.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {tenant.phone}
                            </span>
                          )}
                          {tenant.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {tenant.email}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(tenant.leaseStart).toLocaleDateString(
                              "en-US",
                              { month: "short", year: "numeric" },
                            )}
                            {tenant.leaseEnd &&
                              ` - ${new Date(tenant.leaseEnd).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right mr-2">
                        <p className="text-sm font-semibold">
                          {formatCurrency(info.rent)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Due: {tenant.rentDueDay}th
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={tenant.isActive === 1 ? "outline" : "default"}
                        onClick={() =>
                          toggleActiveMutation.mutate({
                            id: tenant.id,
                            isActive: tenant.isActive === 1 ? 0 : 1,
                          })
                        }
                        data-testid={`button-toggle-tenant-${tenant.id}`}
                      >
                        {tenant.isActive === 1 ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditTenant(tenant);
                          setFormOpen(true);
                        }}
                        data-testid={`button-edit-tenant-${tenant.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            data-testid={`button-delete-tenant-${tenant.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Tenant?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete {tenant.name} and
                              all their invoice records.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                deleteMutation.mutate(tenant.id)
                              }
                              data-testid="button-confirm-delete-tenant"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              {search ? "No matching tenants" : "No tenants yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search
                ? "Try adjusting your search"
                : "Add tenants to start tracking rent"}
            </p>
            {!search && (
              <Button
                onClick={() => {
                  setEditTenant(undefined);
                  setFormOpen(true);
                }}
                data-testid="button-add-first-tenant"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Tenant
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {allUnits && allProperties && (
        <TenantFormDialog
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditTenant(undefined);
          }}
          allUnits={allUnits}
          allProperties={allProperties}
          editTenant={editTenant}
        />
      )}
    </div>
  );
}
