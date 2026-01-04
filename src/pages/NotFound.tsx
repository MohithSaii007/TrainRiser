import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-black text-primary">404</h1>
        <p className="mb-6 text-xl text-muted-foreground">Oops! Page not found</p>
        <Link 
          to="/" 
          className="inline-block px-8 py-3 rounded-xl btn-primary-gradient font-bold hover:scale-105 transition-transform"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
