'use client'

import { useState } from 'react'
import Link from 'next/link'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { CalendarEventData } from './page'

interface CalendarClientProps {
  initialEvents: CalendarEventData[]
}

export function CalendarClient({ initialEvents }: CalendarClientProps) {
  const [viewMode, setViewMode] = useState<'Day' | 'Week' | 'Month'>('Day')
  
  // Start with today or the date of the first booking if available
  const today = new Date()
  const [selectedDate, setSelectedDate] = useState<Date>(today)

  // Generate 7-day strip centered around the selected week
  const startOfWeek = new Date(selectedDate)
  const dayIndex = (startOfWeek.getDay() + 6) % 7 // Monday = 0
  startOfWeek.setDate(startOfWeek.getDate() - dayIndex)

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(d.getDate() + i)
    return d
  })

  // Filter events for selected date (including multi-day reservations spanning this date)
  const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0)
  const endOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59, 999)
  const dayEvents = initialEvents.filter((e) => {
    const s = new Date(e.startAt)
    const end = new Date(e.endAt)
    return end >= startOfDay && s <= endOfDay
  })

  // FullCalendar event items mapping
  const fcEvents = initialEvents.map((b) => ({
    id: b.id,
    title: `${b.eventName} (${b.venueName})`,
    start: b.startAt,
    end: b.endAt,
  }))

  const hours = [
    { label: '9:00 AM', hour: 9 },
    { label: '10:00 AM', hour: 10 },
    { label: '11:00 AM', hour: 11 },
    { label: '12:00 PM', hour: 12 },
    { label: '1:00 PM', hour: 13, isRecess: true },
    { label: '2:00 PM', hour: 14 },
    { label: '3:00 PM', hour: 15 },
    { label: '4:00 PM', hour: 16 },
    { label: '5:00 PM', hour: 17 },
  ]

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="relative">
      {/* Calendar Screen Top Bar */}
      <section className="flex justify-between items-center mb-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">Calendar</h1>
          <p className="font-body-sm text-body-sm text-outline">Campus event schedule and venue allocations</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/book"
            aria-label="Book a venue"
            className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-sm active:scale-95 transition-all hover:bg-primary"
          >
            <span className="material-symbols-outlined text-[22px]">add</span>
          </Link>
        </div>
      </section>

      {/* Segmented View Mode Selector */}
      <section className="mb-4">
        <div className="bg-surface-container p-1 rounded-xl flex items-center justify-between text-body-sm font-body-sm max-w-sm">
          {(['Day', 'Week', 'Month'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex-1 py-1.5 rounded-lg text-center font-label-md text-label-md transition-all ${
                viewMode === mode
                  ? 'bg-primary-container text-on-primary shadow-sm font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </section>

      {viewMode === 'Month' ? (
        /* FullCalendar Month Grid */
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm p-4">
          <style jsx global>{`
            .fc {
              --fc-page-bg-color: transparent;
              --fc-neutral-bg-color: #fff7ed;
              --fc-neutral-text-color: #292524;
              --fc-border-color: #e7ded4;
              --fc-button-text-color: #fff;
              --fc-button-bg-color: #ff6835;
              --fc-button-border-color: #ff6835;
              --fc-button-hover-bg-color: #c94b24;
              --fc-button-hover-border-color: #c94b24;
              --fc-button-active-bg-color: #c94b24;
              --fc-button-active-border-color: #c94b24;
              --fc-event-bg-color: #fff0e8;
              --fc-event-border-color: #ffe4d4;
              --fc-event-text-color: #c94b24;
              --fc-today-bg-color: #fff0e8;
              font-family: var(--font-sans);
            }
            .fc-event {
              border-radius: 6px;
              padding: 2px 4px;
              font-weight: 600;
              font-size: 0.75rem;
            }
            .fc-toolbar-title {
              font-size: 1.15rem !important;
              font-weight: 700 !important;
            }
            .fc-button {
              border-radius: 0.75rem !important;
              padding: 0.4rem 0.8rem !important;
              font-weight: 600 !important;
              text-transform: capitalize !important;
            }
            @media (max-width: 640px) {
              .fc .fc-toolbar {
                display: flex !important;
                flex-direction: column !important;
                gap: 0.625rem !important;
                align-items: center !important;
              }
              .fc .fc-toolbar-chunk {
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                flex-wrap: wrap !important;
                gap: 0.25rem !important;
              }
              .fc-toolbar-title {
                font-size: 1.05rem !important;
                text-align: center !important;
              }
              .fc-button {
                padding: 0.35rem 0.6rem !important;
                font-size: 0.78rem !important;
              }
              .fc .fc-col-header-cell-cushion {
                font-size: 0.75rem !important;
                padding: 2px 1px !important;
              }
              .fc .fc-daygrid-day-number {
                font-size: 0.75rem !important;
                padding: 2px !important;
              }
            }
          `}</style>
          <div className="overflow-x-auto no-scrollbar">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek',
              }}
              events={fcEvents}
              height="auto"
              aspectRatio={1.4}
              dayMaxEvents={3}
            />
          </div>
        </div>
      ) : (
        /* Stitch 7-Day Strip and Timeline Schedule (Day and Week views) */
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm p-4 sm:p-6">
          {/* 7-Day Horizontal Strip */}
          <section className="mb-5 pb-3 border-b border-surface-container">
            <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-1">
              {weekDays.map((dateObj, idx) => {
                const isSelected = dateObj.toDateString() === selectedDate.toDateString()
                return (
                  <button
                    key={dateObj.toISOString()}
                    onClick={() => setSelectedDate(dateObj)}
                    className={`flex flex-col items-center justify-center min-w-[46px] py-2 px-1.5 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-primary-container text-on-primary shadow-md scale-105'
                        : 'hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <span
                      className={`font-label-sm text-label-sm font-medium ${
                        isSelected ? 'text-white/90' : 'text-outline'
                      }`}
                    >
                      {dayNames[idx]}
                    </span>
                    <span
                      className={`font-headline-sm text-headline-sm font-bold mt-1 ${
                        isSelected ? 'text-white' : 'text-on-surface'
                      }`}
                    >
                      {dateObj.getDate()}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Schedule Header Context */}
          <section className="mb-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="font-label-lg text-label-lg font-bold text-on-surface">
                {selectedDate.toLocaleDateString('en-IN', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <span className="w-2 h-2 rounded-full bg-primary-container"></span>
            </div>
            <span className="font-label-sm text-label-sm text-outline font-medium">
              {dayEvents.length} {dayEvents.length === 1 ? 'Reservation' : 'Reservations'}
            </span>
          </section>

          {/* Hourly Timeline Canvas */}
          <section className="space-y-4">
            {hours.map((h) => {
              if (h.isRecess) {
                return (
                  <div key={h.label} className="flex items-center gap-3 py-1">
                    <div className="w-16 text-right font-label-sm text-label-sm font-medium text-outline/70">
                      {h.label}
                    </div>
                    <div className="flex-1 border-t border-dashed border-outline-variant/60"></div>
                    <span className="font-label-sm text-label-sm text-outline/80 italic px-2">
                      Campus Recess / Maintenance
                    </span>
                    <div className="flex-1 border-t border-dashed border-outline-variant/60"></div>
                  </div>
                )
              }

              // Find events that overlap or start in this hour
              const eventsInHour = dayEvents.filter((ev) => {
                const s = new Date(ev.startAt)
                const e = new Date(ev.endAt)
                const slotStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), h.hour, 0, 0)
                const slotEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), h.hour + 1, 0, 0)
                return s < slotEnd && e > slotStart
              })

              return (
                <div key={h.label} className="flex items-start gap-3">
                  <div className="w-16 pt-1 text-right font-label-sm text-label-sm font-semibold text-outline tracking-tight">
                    {h.label}
                  </div>
                  <div className="flex-1 relative">
                    {eventsInHour.length > 0 ? (
                      <div className="space-y-2">
                        {eventsInHour.map((ev) => {
                          const isSameDay = new Date(ev.startAt).toDateString() === new Date(ev.endAt).toDateString()
                          const sTime = isSameDay
                            ? new Date(ev.startAt).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : `${new Date(ev.startAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}, ${new Date(ev.startAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                          const eTime = isSameDay
                            ? new Date(ev.endAt).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : `${new Date(ev.endAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}, ${new Date(ev.endAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`

                          return (
                            <Link
                              key={ev.id}
                              href={`/venues/${ev.venueId}`}
                              className="block"
                            >
                              <article className="bg-surface-container-low border border-outline-variant/80 rounded-xl p-3.5 shadow-sm hover:border-primary-container transition-all cursor-pointer group">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                                      <span className="font-label-sm text-label-sm font-semibold text-primary">
                                        {sTime} – {eTime}
                                      </span>
                                    </div>
                                    <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface leading-snug group-hover:text-primary transition-colors">
                                      {ev.eventName}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-2 text-on-surface-variant font-body-sm text-body-sm">
                                      <span className="material-symbols-outlined text-[16px] text-primary">
                                        apartment
                                      </span>
                                      <span>
                                        {ev.venueName} · {ev.deptCode}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="bg-surface-container-lowest px-2.5 py-1 rounded-full text-primary font-semibold border border-outline-variant/50 text-[11px] uppercase tracking-wider">
                                    Confirmed
                                  </span>
                                </div>
                              </article>
                            </Link>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="border-t border-dashed border-outline-variant/50 h-8 flex items-center">
                        <span className="text-[11px] text-outline/50 pl-2">Available</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </section>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-20 right-6 z-40">
        <Link
          href="/dashboard/book"
          aria-label="Add new booking"
          className="w-14 h-14 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-lg shadow-primary-container/30 hover:scale-105 active:scale-95 transition-all duration-150 group"
        >
          <span className="material-symbols-outlined text-3xl transition-transform duration-200 group-hover:rotate-90">
            add
          </span>
        </Link>
      </div>
    </div>
  )
}
