import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Property, Unit } from "@shared/schema";
import {
  Building2,
  Plus,
  MapPin,
  Home,
  Trash2,
  Edit,
  ChevronDown,
  ChevronRight,
  Users2,
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
  DialogTrigger,
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

function PropertyFormDialog({
  open,
  onOpenChange,
  editProperty,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editProperty?: Property;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(editProperty?.name || "");
  const [address, setAddress] = useState(editProperty?.address || "");
  const [type, setType] = useState(editProperty?.type || "residential");
  const [ownershipType, setOwnershipType] = useState(
    editProperty?.ownershipType || "single",
  );
  const [totalUnits, setTotalUnits] = useState(
    String(editProperty?.totalUnits || 1),
  );

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editProperty) {
        return apiRequest("PATCH", `/api/properties/${editProperty.id}`, data);
      }
      return apiRequest("POST", "/api/properties", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: editProperty ? "Property updated" : "Property created",
        description: `${name} has been ${editProperty ? "updated" : "added"} successfully.`,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      address,
      type,
      ownershipType,
      totalUnits: parseInt(totalUnits),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editProperty ? "Edit Property" : "Add New Property"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Property Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sunset Heights"
              required
              data-testid="input-property-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full address"
              required
              data-testid="input-property-address"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger data-testid="select-property-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ownership</Label>
              <Select value={ownershipType} onValueChange={setOwnershipType}>
                <SelectTrigger data-testid="select-ownership-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Owner</SelectItem>
                  <SelectItem value="multi">Multi Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalUnits">Total Units</Label>
            <Input
              id="totalUnits"
              type="number"
              min="1"
              value={totalUnits}
              onChange={(e) => setTotalUnits(e.target.value)}
              data-testid="input-total-units"
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={createMutation.isPending}
            data-testid="button-save-property"
          >
            {createMutation.isPending
              ? "Saving..."
              : editProperty
                ? "Update Property"
                : "Add Property"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UnitFormDialog({
  open,
  onOpenChange,
  propertyId,
  editUnit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: number;
  editUnit?: Unit;
}) {
  const { toast } = useToast();
  const [unitName, setUnitName] = useState(editUnit?.unitName || "");
  const [monthlyRent, setMonthlyRent] = useState(
    editUnit?.monthlyRent || "0",
  );

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (editUnit) {
        return apiRequest("PATCH", `/api/units/${editUnit.id}`, data);
      }
      return apiRequest("POST", "/api/units", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/properties", propertyId, "units"],
      });
      toast({
        title: editUnit ? "Unit updated" : "Unit created",
        description: `${unitName} has been ${editUnit ? "updated" : "added"}.`,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ propertyId, unitName, monthlyRent });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editUnit ? "Edit Unit" : "Add New Unit"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="unitName">Unit Name</Label>
            <Input
              id="unitName"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              placeholder="e.g. Apt 101"
              required
              data-testid="input-unit-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rent">Monthly Rent (PKR)</Label>
            <Input
              id="rent"
              type="number"
              min="0"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(e.target.value)}
              data-testid="input-unit-rent"
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
            data-testid="button-save-unit"
          >
            {mutation.isPending ? "Saving..." : editUnit ? "Update" : "Add Unit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PropertyCard({ property }: { property: Property }) {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [unitFormOpen, setUnitFormOpen] = useState(false);
  const [editUnit, setEditUnit] = useState<Unit | undefined>();
  const { toast } = useToast();

  const { data: propertyUnits, isLoading: unitsLoading } = useQuery<Unit[]>({
    queryKey: ["/api/properties", property.id, "units"],
    enabled: expanded,
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/properties/${property.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Property deleted" });
    },
  });

  const deleteUnitMutation = useMutation({
    mutationFn: (unitId: number) =>
      apiRequest("DELETE", `/api/units/${unitId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/properties", property.id, "units"],
      });
      toast({ title: "Unit deleted" });
    },
  });

  const totalRent =
    propertyUnits?.reduce(
      (sum, u) => sum + parseFloat(u.monthlyRent),
      0,
    ) || 0;

  return (
    <>
      <Card className="hover-elevate" data-testid={`card-property-${property.id}`}>
        <CardContent className="p-0">
          <div
            className="flex items-center justify-between gap-3 p-4 cursor-pointer"
            onClick={() => setExpanded(!expanded)}
            data-testid={`button-expand-property-${property.id}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold truncate">
                  {property.name}
                </h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{property.address}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="secondary">
                {property.type === "residential" ? "Residential" : "Commercial"}
              </Badge>
              {property.ownershipType === "multi" && (
                <Badge variant="outline">
                  <Users2 className="h-3 w-3 mr-1" />
                  Multi-Owner
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {property.totalUnits} units
              </span>
              {expanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>

          {expanded && (
            <div className="border-t px-4 pb-4">
              <div className="flex items-center justify-between gap-2 py-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Units ({propertyUnits?.length || 0})
                  {totalRent > 0 && (
                    <span className="ml-2 normal-case text-foreground">
                      Total: {formatCurrency(totalRent)}/mo
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditOpen(true);
                    }}
                    data-testid={`button-edit-property-${property.id}`}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        data-testid={`button-delete-property-${property.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Property?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete {property.name} and all
                          its units, tenants, and invoices.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate()}
                          data-testid="button-confirm-delete"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditUnit(undefined);
                      setUnitFormOpen(true);
                    }}
                    data-testid={`button-add-unit-${property.id}`}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Unit
                  </Button>
                </div>
              </div>

              {unitsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : propertyUnits && propertyUnits.length > 0 ? (
                <div className="space-y-2">
                  {propertyUnits.map((unit) => (
                    <div
                      key={unit.id}
                      className="flex items-center justify-between gap-2 p-3 rounded-md bg-muted/50"
                      data-testid={`row-unit-${unit.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {unit.unitName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {formatCurrency(unit.monthlyRent)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          /mo
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditUnit(unit);
                            setUnitFormOpen(true);
                          }}
                          data-testid={`button-edit-unit-${unit.id}`}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            deleteUnitMutation.mutate(unit.id)
                          }
                          data-testid={`button-delete-unit-${unit.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No units yet. Add units to start managing tenants.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <PropertyFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editProperty={property}
      />
      <UnitFormDialog
        open={unitFormOpen}
        onOpenChange={(open) => {
          setUnitFormOpen(open);
          if (!open) setEditUnit(undefined);
        }}
        propertyId={property.id}
        editUnit={editUnit}
      />
    </>
  );
}

export default function Properties() {
  const [formOpen, setFormOpen] = useState(false);
  const { data: propertiesList, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-properties-title">
            Properties
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your property portfolio
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} data-testid="button-add-property">
          <Plus className="h-4 w-4 mr-1" />
          Add Property
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-md" />
          ))}
        </div>
      ) : propertiesList && propertiesList.length > 0 ? (
        <div className="space-y-3">
          {propertiesList.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No properties yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first property to get started
            </p>
            <Button onClick={() => setFormOpen(true)} data-testid="button-add-first-property">
              <Plus className="h-4 w-4 mr-1" />
              Add Property
            </Button>
          </CardContent>
        </Card>
      )}

      <PropertyFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
