import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2 } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("property_owner");
  const { login, register } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login.mutateAsync({ username, password });
      } else {
        await register.mutateAsync({ username, password, fullName, email, phone, role });
      }
    } catch (err: any) {
      const msg = err?.message || "Something went wrong";
      const cleaned = msg.replace(/^\d+:\s*/, "");
      let parsed = cleaned;
      try {
        const obj = JSON.parse(cleaned);
        parsed = obj.message || cleaned;
      } catch {}
      toast({ title: "Error", description: parsed, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-app-title">PropManager</h1>
          <p className="text-muted-foreground mt-1">Multi-Owner Property Management & Rent Settlement</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle data-testid="text-auth-title">{isLogin ? "Sign In" : "Create Account"}</CardTitle>
            <CardDescription>
              {isLogin ? "Enter your credentials to access your properties" : "Register to start managing your properties"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      data-testid="input-fullname"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      data-testid="input-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      data-testid="input-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger data-testid="select-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="property_owner">Property Owner</SelectItem>
                        <SelectItem value="co_owner">Co-Owner</SelectItem>
                        <SelectItem value="accountant">Accountant</SelectItem>
                        <SelectItem value="tenant">Tenant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  data-testid="input-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  data-testid="input-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                data-testid="button-submit-auth"
                disabled={login.isPending || register.isPending}
              >
                {login.isPending || register.isPending ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                data-testid="button-toggle-auth"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
              </button>
            </div>
            {isLogin && (
              <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium mb-1">Demo Accounts:</p>
                <p><span className="text-muted-foreground">Admin:</span> admin / admin123</p>
                <p><span className="text-muted-foreground">Owner:</span> ahmed_owner / owner123</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
