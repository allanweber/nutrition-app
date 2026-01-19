import Link from 'next/link';
import { redirect } from 'next/navigation';
import { 
  Home, 
  Search, 
  FileText, 
  Target, 
  Settings,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/session';
import { DashboardHeader } from '@/components/dashboard-header';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
    {
      name: 'Food Search',
      href: '/foods/search',
      icon: Search,
    },
    {
      name: 'Food Log',
      href: '/food-log',
      icon: FileText,
    },
    {
      name: 'Goals',
      href: '/goals',
      icon: Target,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        user={{
          name: user.name,
          email: user.email,
          image: user.image,
        }}
        navigation={navigation.map(({ name, href }) => ({ name, href }))}
      />

      <main className="flex">
        {/* Sidebar navigation - visible on lg+ screens */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
              <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                <nav className="mt-5 flex-1 px-2 space-y-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      <item.icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
