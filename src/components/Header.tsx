import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User, Train } from "lucide-react";

const Header = () => {
  const { user, logout, loading } = useAuth();

  return (
    <header className="px-6 py-5 flex justify-between items-center max-w-7xl mx-auto">
      <div className="flex items-center gap-8">
        <Link to="/" className="text-2xl font-black text-accent hover:text-primary transition-colors">
          TrainRiser
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/all-trains" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
            <Train className="w-4 h-4" />
            All Trains
          </Link>
          <Link to="/pnr-status" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
            PNR Status
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {loading ? null : user ? (
          <>
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              {user.name || user.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </>
        ) : (
          <>
            <Link to="/auth">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">
                Register
              </Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;