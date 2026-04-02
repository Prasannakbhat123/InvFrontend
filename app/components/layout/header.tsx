'use client'

import { Search, User } from 'lucide-react'
import { Input } from '@/app/components/ui/input'
import { NotificationBell } from './NotificationBell'

interface HeaderProps {
  title: string
  subtitle?: string
  userName: string
  userRole: string
}

export function Header({ title, subtitle, userName, userRole }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search..."
              className="w-64 pl-10"
            />
          </div>

          {/* Notifications - Only for Admin */}
          {userRole.toLowerCase() === 'admin' && <NotificationBell />}

          {/* User Info */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500">{userRole}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
              <User className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}