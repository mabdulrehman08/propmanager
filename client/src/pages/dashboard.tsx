import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Home,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardStats {
  totalProperties: number;
  totalUnits: number;
  totalTenants: number;
  occupancyRate: number;
  totalMonthlyIncome: number;
  outstandingRent: number;
  totalCollectedAllTime: number;
  totalRentAllTime: number;
  last6Months: {
    month: string;
    year: number;
    collected: number;
    total: number;
  }[];
  upcomingExpirations: {
    tenantId: number;
    tenantName: string;
    leaseEnd: string;
    unitId: number;
  }[];
  ownerSettlementSummary: {
    totalEarned: number;
    totalDistributed: number;
    pendingSettlement: number;
  } | null;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  testId,
}: {
  title: string;
  value: string | number;
  icon: any;
  subtitle?: string;
  testId: string;
}) {
  return (
    <Card className="hover-elevate">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </span>
            <span className="text-2xl font-bold" data-testid={testId}>
              {value}
            </span>
            {subtitle && (
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            )}
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your property portfolio
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-[300px] lg:col-span-2 rounded-md" />
          <Skeleton className="h-[300px] rounded-md" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const occupancyData = [
    { name: "Occupied", value: stats.occupancyRate },
    { name: "Vacant", value: 100 - stats.occupancyRate },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your property portfolio
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Properties"
          value={stats.totalProperties}
          icon={Building2}
          subtitle={`${stats.totalUnits} total units`}
          testId="stat-properties"
        />
        <StatCard
          title="Active Tenants"
          value={stats.totalTenants}
          icon={Users}
          subtitle={`${stats.occupancyRate}% occupancy`}
          testId="stat-tenants"
        />
        <StatCard
          title="Monthly Income"
          value={formatCurrency(stats.totalMonthlyIncome)}
          icon={DollarSign}
          subtitle="Current month collected"
          testId="stat-income"
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(stats.outstandingRent)}
          icon={AlertTriangle}
          subtitle="Pending collection"
          testId="stat-outstanding"
        />
      </div>

      {(stats.totalCollectedAllTime > 0 || stats.ownerSettlementSummary) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Total Collected (All Time)
              </span>
              <p className="text-xl font-bold mt-1" data-testid="stat-all-time-collected">
                {formatCurrency(stats.totalCollectedAllTime)}
              </p>
              <p className="text-xs text-muted-foreground">
                of {formatCurrency(stats.totalRentAllTime)} expected
              </p>
            </CardContent>
          </Card>
          {stats.ownerSettlementSummary && (
            <>
              <Card>
                <CardContent className="p-5">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Your Total Share
                  </span>
                  <p className="text-xl font-bold mt-1" data-testid="stat-owner-earned">
                    {formatCurrency(stats.ownerSettlementSummary.totalEarned)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Distributed: {formatCurrency(stats.ownerSettlementSummary.totalDistributed)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Pending Settlement
                  </span>
                  <p className="text-xl font-bold mt-1 text-orange-600" data-testid="stat-owner-pending">
                    {formatCurrency(stats.ownerSettlementSummary.pendingSettlement)}
                  </p>
                  <p className="text-xs text-muted-foreground">Awaiting distribution</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Rent Collection Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.last6Months}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [
                      formatCurrency(value),
                      "",
                    ]}
                  />
                  <Bar
                    dataKey="total"
                    fill="hsl(var(--muted))"
                    radius={[4, 4, 0, 0]}
                    name="Expected"
                  />
                  <Bar
                    dataKey="collected"
                    fill="hsl(var(--chart-2))"
                    radius={[4, 4, 0, 0]}
                    name="Collected"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Home className="h-4 w-4 text-muted-foreground" />
              Occupancy Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-0">
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    <Cell fill="hsl(var(--chart-2))" />
                    <Cell fill="hsl(var(--muted))" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center -mt-4">
              <span className="text-3xl font-bold" data-testid="text-occupancy-rate">
                {stats.occupancyRate}%
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                Units occupied
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {stats.upcomingExpirations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Upcoming Lease Expirations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.upcomingExpirations.map((exp) => {
                const daysLeft = Math.ceil(
                  (new Date(exp.leaseEnd).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24),
                );
                return (
                  <div
                    key={exp.tenantId}
                    className="flex items-center justify-between gap-2 py-2 border-b last:border-0"
                    data-testid={`row-expiration-${exp.tenantId}`}
                  >
                    <div>
                      <p className="text-sm font-medium">{exp.tenantName}</p>
                      <p className="text-xs text-muted-foreground">
                        Expires{" "}
                        {new Date(exp.leaseEnd).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge
                      variant={daysLeft <= 30 ? "destructive" : "secondary"}
                    >
                      {daysLeft}d left
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
