import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle } from "lucide-react";

export default function AuditLogs() {
  const { user } = useAuth();

  const { data: logs = [], isLoading, error } = useQuery<any[]>({
    queryKey: ["/api/audit-logs"],
    enabled: user?.role === "super_admin",
  });

  if (user?.role !== "super_admin") {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">Only Super Admins can view audit logs.</p>
        </div>
      </div>
    );
  }

  const actionColors: Record<string, string> = {
    create_property: "default",
    update_property: "secondary",
    delete_property: "destructive",
    mark_payment: "default",
    approve_access: "default",
    reconstruct_history: "secondary",
    add_payment: "default",
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <Shield className="w-6 h-6" />
          Audit Logs
        </h1>
        <p className="text-muted-foreground">Complete record of all financial and data changes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity ({logs.length} entries)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Record</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: any) => (
                  <TableRow key={log.id} data-testid={`row-audit-${log.id}`}>
                    <TableCell className="text-sm">{new Date(log.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{log.userId}</TableCell>
                    <TableCell>
                      <Badge variant={actionColors[log.action] as any || "outline"}>
                        {log.action.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{log.tableName}</TableCell>
                    <TableCell>#{log.recordId}</TableCell>
                    <TableCell className="max-w-[300px] truncate text-xs text-muted-foreground">
                      {log.newValue ? log.newValue.substring(0, 100) : "-"}
                    </TableCell>
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
