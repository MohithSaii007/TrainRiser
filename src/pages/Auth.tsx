import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Mail, Lock, User, Phone } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const Auth = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrors({});

    const result = loginSchema.safeParse(loginForm);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setLoginErrors(errors);
      return;
    }

    setIsLoading(true);
    const { error } = await login(loginForm.email, loginForm.password);
    setIsLoading(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success("Login successful!");
      navigate("/");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterErrors({});

    const result = registerSchema.safeParse(registerForm);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setRegisterErrors(errors);
      return;
    }

    setIsLoading(true);
    const { error } = await register(
      registerForm.email,
      registerForm.password,
      registerForm.name,
      registerForm.phone
    );
    setIsLoading(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success("Registration successful!");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto animate-fade-in">
          <div className="glass-card p-8">
            <h1 className="text-2xl font-bold text-center text-foreground mb-6">
              Welcome to TrainRiser
            </h1>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="Enter your email"
                        value={loginForm.email}
                        onChange={(e) =>
                          setLoginForm({ ...loginForm, email: e.target.value })
                        }
                        className="pl-10 bg-background/50"
                      />
                    </div>
                    {loginErrors.email && (
                      <p className="text-sm text-destructive">{loginErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) =>
                          setLoginForm({ ...loginForm, password: e.target.value })
                        }
                        className="pl-10 bg-background/50"
                      />
                    </div>
                    {loginErrors.password && (
                      <p className="text-sm text-destructive">{loginErrors.password}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full btn-primary-gradient" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={registerForm.name}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, name: e.target.value })
                        }
                        className="pl-10 bg-background/50"
                      />
                    </div>
                    {registerErrors.name && (
                      <p className="text-sm text-destructive">{registerErrors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="Enter your email"
                        value={registerForm.email}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, email: e.target.value })
                        }
                        className="pl-10 bg-background/50"
                      />
                    </div>
                    {registerErrors.email && (
                      <p className="text-sm text-destructive">{registerErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={registerForm.phone}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, phone: e.target.value })
                        }
                        className="pl-10 bg-background/50"
                      />
                    </div>
                    {registerErrors.phone && (
                      <p className="text-sm text-destructive">{registerErrors.phone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Create a password"
                        value={registerForm.password}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, password: e.target.value })
                        }
                        className="pl-10 bg-background/50"
                      />
                    </div>
                    {registerErrors.password && (
                      <p className="text-sm text-destructive">{registerErrors.password}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-confirm"
                        type="password"
                        placeholder="Confirm your password"
                        value={registerForm.confirmPassword}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, confirmPassword: e.target.value })
                        }
                        className="pl-10 bg-background/50"
                      />
                    </div>
                    {registerErrors.confirmPassword && (
                      <p className="text-sm text-destructive">{registerErrors.confirmPassword}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full btn-primary-gradient" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Auth;
