import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { GraduationCap, LayoutDashboard, BookOpen, Calendar, Award, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const Navigation = () => {
  const { signOut, userRole } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const links = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/resources', label: 'Resources', icon: BookOpen },
    { path: '/timetable', label: 'Timetable', icon: Calendar },
    { path: '/scholarships', label: 'Scholarships', icon: Award },
  ];

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-[var(--shadow-soft)]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2 font-bold text-xl">
            <div className="bg-primary rounded-full p-2">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span>Gradigy</span>
          </Link>

          <div className="flex items-center space-x-1">
            {links.map((link) => (
              <Link key={link.path} to={link.path}>
                <Button
                  variant={isActive(link.path) ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'flex items-center space-x-2',
                    isActive(link.path) && 'shadow-[var(--shadow-soft)]'
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{link.label}</span>
                </Button>
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-muted rounded-full text-sm">
              <span className="font-medium capitalize">{userRole}</span>
            </div>
            <Button variant="outline" size="sm" onClick={signOut} className="flex items-center space-x-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
