'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { events as eventsApi } from '@/app/lib/api'

interface AddEventModalProps {
  isOpen: boolean
  onClose: () => void
  onEventAdded: () => void
  selectedDate?: Date
}

export default function AddEventModal({ isOpen, onClose, onEventAdded, selectedDate }: AddEventModalProps) {
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState(
    selectedDate 
      ? selectedDate.toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  )
  const [eventTime, setEventTime] = useState('12:00')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!eventName.trim()) {
      toast.error('Please enter an event name')
      return
    }

    setIsSubmitting(true)
    try {
      await eventsApi.create({
        event_name: eventName,
        event_date: eventDate,
        event_time: eventTime,
      })
      
      toast.success('Event created successfully')
      setEventName('')
      setEventDate(new Date().toISOString().split('T')[0])
      setEventTime('12:00')
      onEventAdded()
      onClose()
    } catch (error: any) {
      console.error('Error creating event:', error)
      toast.error('Failed to create event')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Add New Event</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" strokeLinecap="round"/>
                <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" strokeLinecap="round"/>
                <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Event Name
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Enter event name..."
              className="w-full px-4 py-3 border-2 border-[#1F764D]/20 rounded-xl focus:outline-none focus:border-[#1F764D] transition-colors text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Date
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[#1F764D]/20 rounded-xl focus:outline-none focus:border-[#1F764D] transition-colors text-gray-900"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  <polyline points="12 6 12 12 16 14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Time
              </label>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[#1F764D]/20 rounded-xl focus:outline-none focus:border-[#1F764D] transition-colors text-gray-900 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-br from-[#13452D] to-[#1F764D] text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <span className="text-xl">+</span>
                Add Event
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
