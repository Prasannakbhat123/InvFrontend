'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  ScanLine,
  LogOut,
  Leaf,
  Calendar,
  Settings,
  HelpCircle,
} from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { UserRole } from '@/app/lib/types'

interface SidebarProps {
  userRole: UserRole
  onLogout: () => void
}

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  roles: UserRole[]
  badge?: string
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    roles: ['ADMIN'],
  },
  {
    title: 'Products',
    href: '/admin/products',
    icon: Package,
    roles: ['ADMIN'],
  },
  {
    title: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart,
    roles: ['ADMIN'],
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    roles: ['ADMIN'],
  },
  {
    title: 'Employees',
    href: '/admin/employees',
    icon: Users,
    roles: ['ADMIN'],
  },
  {
    title: 'Dashboard',
    href: '/employee',
    icon: LayoutDashboard,
    roles: ['EMPLOYEE'],
  },
  {
    title: 'Scan Orders',
    href: '/employee/orders',
    icon: ScanLine,
    roles: ['EMPLOYEE'],
  },
  {
    title: 'Add Products',
    href: '/employee/products',
    icon: Package,
    roles: ['EMPLOYEE'],
  },
]

const generalItems: NavItem[] = [
  {
    title: 'Settings',
    href: '#',
    icon: Settings,
    roles: ['ADMIN', 'EMPLOYEE'],
  },
  {
    title: 'Help',
    href: '#',
    icon: HelpCircle,
    roles: ['ADMIN', 'EMPLOYEE'],
  },
]

export function Sidebar({ userRole, onLogout }: SidebarProps) {
  const pathname = usePathname()

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  )

  const filteredGeneralItems = generalItems.filter((item) =>
    item.roles.includes(userRole)
  )

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo Section */}
      <div className="p-6">
        <div className="flex items-center">
          <img
            src="/assets/logo.png"
            alt="Windscapes Landscaping"
            className="h-12 w-auto object-contain"
          />
        </div>
      </div>

      {/* Menu Section */}
      <nav className="flex-1 px-4">
        <div className="mb-4">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Menu
          </p>
          <div className="space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'text-gray-900'
                      : 'text-gray-900 hover:text-gray-900'
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[#13452D] to-[#1F764D]" />
                  )}
                  <Icon className="h-5 w-5" />
                  <span className="flex-1">{item.title}</span>
                  {item.badge && (
                    <span className="rounded-md bg-gradient-to-r from-[#13452D] to-[#1F764D] px-2 py-0.5 text-xs font-semibold text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        {/* General Section */}
        <div className="mt-8">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            General
          </p>
          <div className="space-y-1">

            <button
              onClick={onLogout}
              className="group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:text-gray-900"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}