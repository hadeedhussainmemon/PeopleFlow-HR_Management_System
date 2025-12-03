import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ToastProvider } from '@/components/ui/Toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  CalendarDays,
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ShieldCheck
  , Moon, Sun} from 'lucide-react';
import { Button } from '@/components/ui/button';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/calendar', label: 'Calendar', icon: CalendarDays },
    { path: '/apply-leave', label: 'Apply for Leave', icon: Calendar },
  ];

  if (user?.role === 'manager' || user?.role === 'admin') {
    navItems.push({ path: '/team-requests', label: 'Team Requests', icon: Users });
  }

  if (user?.role === 'admin') {
    navItems.push({ path: '/admin-dashboard', label: 'Admin Dashboard', icon: ShieldCheck });
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out glass-card
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
              PF
            </div>
            PeopleFlow
          </h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                ${isActive(item.path) 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }
              `}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}`} />
              <AvatarFallback>{user?.firstName?.[0]}{user?.lastName?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate capitalize">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const Navbar = ({ onMenuClick, theme, toggleTheme }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <Button variant="ghost" className="h-8 w-8" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu size={20} />
        </Button>
        <h1 className="text-lg font-semibold text-foreground md:hidden">PeopleFlow</h1>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}`} />
                <AvatarFallback>{user?.firstName?.[0]}{user?.lastName?.[0]}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('dark');

  // Persist theme and respect system preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored) {
        setTheme(stored);
        if (stored === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      } else {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
        if (prefersDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      /* ignore */
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    try {
      localStorage.setItem('theme', newTheme);
      if (newTheme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    } catch (e) {}
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} theme={theme} toggleTheme={toggleTheme} />
        <ToastProvider>
          <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </ToastProvider>
      </div>
    </div>
  );
};

export default Layout;
