'use client'

import { useEffect, useState } from 'react'
import { Bell, X, Package } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { notifications as notificationsApi } from '@/app/lib/api'
import { formatDateTime } from '@/app/lib/utils'

interface AdminNotification {
  notification_id: string
  type: string
  title: string
  message: string
  actor_user_id?: string | null
  reference_id?: string | null
  created_at: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const data = await notificationsApi.getAll()
      setNotifications(data)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    
    // Poll every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  const unreadCount = notifications.length

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-96 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Notifications
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No notifications
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((item) => (
                  <div
                    key={item.notification_id}
                    className="px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                        <Package className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {item.message}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {formatDateTime(item.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-2">
              <button
                onClick={fetchNotifications}
                className="w-full text-center text-xs text-emerald-600 hover:text-emerald-700 font-medium py-1"
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
