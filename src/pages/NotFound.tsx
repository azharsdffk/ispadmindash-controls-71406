import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <div className="relative">
          <h1 className="text-9xl font-bold text-primary/20">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              404
            </span>
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-foreground">الصفحة غير موجودة</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Button asChild variant="default">
            <Link to="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              الصفحة الرئيسية
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/my-portal" className="flex items-center gap-2">
              بوابة العميل
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
