'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Building2,
  CalendarCheck,
  Bell,
  Database,
  Shield,
  Save,
  RotateCcw,
  Info,
  Lock,
  Landmark,
  Server,
  Layers,
  Cpu,
} from 'lucide-react'

interface SystemInfoData {
  appVersion: string
  nextVersion: string
  reactVersion: string
  dbStatus: 'Connected' | 'Degraded' | 'Disconnected'
  dbLatencyMs?: number
  nodeVersion: string
  venueCount: number
  timezone: string
}

interface SettingsClientProps {
  systemInfo: SystemInfoData
}

interface SettingsState {
  appName: string
  institutionName: string
  logoUrl: string
  requireHodApproval: boolean
  requireAdminApproval: boolean
  maxAdvanceDays: string
  minNoticeHours: string
  defaultDurationHours: string
  inAppNotifications: boolean
  realtimeAlerts: boolean
  notifyOnSubmission: boolean
  notifyOnDecision: boolean
}

const DEFAULT_SETTINGS: SettingsState = {
  appName: 'Venuity',
  institutionName: 'Campus Operations & Facilities',
  logoUrl: '',
  requireHodApproval: true,
  requireAdminApproval: true,
  maxAdvanceDays: '90',
  minNoticeHours: '2',
  defaultDurationHours: '2',
  inAppNotifications: true,
  realtimeAlerts: true,
  notifyOnSubmission: true,
  notifyOnDecision: true,
}

const STORAGE_KEY = 'venuity_admin_settings_v1'

export function SettingsClient({ systemInfo }: SettingsClientProps) {
  const [settings, setSettings] = useState<SettingsState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
        }
      } catch {
        // Storage unavailable or parsing error
      }
    }
    return DEFAULT_SETTINGS
  })
  const [isSaved, setIsSaved] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const handleInputChange = (field: keyof SettingsState, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
    setIsSaved(false)
    setSaveMessage(null)
  }

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
    setIsSaved(false)
    setSaveMessage('Settings restored to system defaults.')
    setTimeout(() => setSaveMessage(null), 4000)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {}
    setIsSaved(true)
    setSaveMessage(
      'Preferences saved for this administrator session. Note: System-wide database persistence for custom configuration overrides is not provisioned in the database schema (no settings table exists). Global policies currently follow code and database migration defaults.'
    )
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Save / Status Notice */}
      {saveMessage && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-start gap-3 shadow-sm transition-all ${
            isSaved
              ? 'bg-amber-50/80 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <Info className="size-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">{isSaved ? 'Session Preferences Updated' : 'System Notice'}</p>
            <p className="text-xs leading-relaxed text-amber-800">{saveMessage}</p>
          </div>
        </div>
      )}

      {/* SECTION 1: General Settings */}
      <section className="bg-surface-container-lowest rounded-2xl border border-[#E7DED4] p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#E7DED4]">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Building2 className="size-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-on-surface">General Settings</h2>
            <p className="text-xs text-outline">Application identity, institution branding, and campus localization</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Application Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="appName" className="text-xs font-semibold uppercase tracking-wider text-on-surface">
              Application Name
            </label>
            <input
              id="appName"
              type="text"
              required
              value={settings.appName}
              onChange={(e) => handleInputChange('appName', e.target.value)}
              className="h-11 bg-surface-container-lowest border border-[#E7DED4] rounded-xl px-4 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-xs"
            />
            <span className="text-[11px] text-outline">The name displayed on the portal header and browser title.</span>
          </div>

          {/* Institution Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="institutionName" className="text-xs font-semibold uppercase tracking-wider text-on-surface">
              Institution / Campus Name
            </label>
            <input
              id="institutionName"
              type="text"
              required
              value={settings.institutionName}
              onChange={(e) => handleInputChange('institutionName', e.target.value)}
              className="h-11 bg-surface-container-lowest border border-[#E7DED4] rounded-xl px-4 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-xs"
            />
            <span className="text-[11px] text-outline">The governing institution or facilities department.</span>
          </div>

          {/* Institution Logo / Emblem */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="logoUrl" className="text-xs font-semibold uppercase tracking-wider text-on-surface">
              Institution Logo (Optional URL)
            </label>
            <input
              id="logoUrl"
              type="url"
              placeholder="https://example.edu/logo.png"
              value={settings.logoUrl}
              onChange={(e) => handleInputChange('logoUrl', e.target.value)}
              className="h-11 bg-surface-container-lowest border border-[#E7DED4] rounded-xl px-4 text-sm text-on-surface placeholder:text-outline/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-xs"
            />
            <span className="text-[11px] text-outline">External HTTPS URL for custom institution logo.</span>
          </div>

          {/* Current Logo Preview */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface">
              Current Brand Emblem
            </span>
            <div className="h-11 flex items-center gap-3 px-3 rounded-xl border border-[#E7DED4] bg-surface-container-low">
              {settings.logoUrl ? (
                <Image
                  src={settings.logoUrl}
                  alt="Institution Logo"
                  width={28}
                  height={28}
                  unoptimized
                  className="h-7 w-auto object-contain rounded"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-[#FF6835] text-white flex items-center justify-center shadow-xs">
                  <Landmark className="size-4 text-white" />
                </div>
              )}
              <span className="text-xs font-medium text-on-surface">
                {settings.appName} Campus Emblem
              </span>
            </div>
            <span className="text-[11px] text-outline">Default Venuity emblem active if no custom URL specified.</span>
          </div>

          {/* Campus Timezone */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface">
              Campus Timezone
            </span>
            <div className="h-11 flex items-center justify-between px-4 rounded-xl border border-[#E7DED4] bg-surface-container-low text-xs sm:text-sm text-on-surface">
              <span className="font-mono font-medium">{systemInfo.timezone} (UTC+05:30)</span>
              <span className="text-xs text-outline italic">Locked to Campus Standard Time</span>
            </div>
            <span className="text-[11px] text-outline">
              All venue reservation start and end timestamps are scheduled and displayed in this timezone.
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 2: Booking Settings */}
      <section className="bg-surface-container-lowest rounded-2xl border border-[#E7DED4] p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#E7DED4]">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <CalendarCheck className="size-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-on-surface">Booking Settings</h2>
            <p className="text-xs text-outline">Reservation policies, review requirements, and schedule constraints</p>
          </div>
        </div>

        {/* Backend Enforced Features Info Callout */}
        <div className="p-3.5 rounded-xl bg-[#FFF7ED] border border-[#FF6835]/30 space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-primary shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">
              Core Backend Engine Capabilities (Active & Enforced)
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
            <div className="p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30">
              <p className="font-semibold text-on-surface">Double-Booking Guard</p>
              <p className="text-[11px] text-outline mt-0.5">PostgreSQL GiST exclusion constraint active.</p>
            </div>
            <div className="p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30">
              <p className="font-semibold text-on-surface">Multi-Day Reservations</p>
              <p className="text-[11px] text-outline mt-0.5">Continuous interval reservations enabled.</p>
            </div>
            <div className="p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30">
              <p className="font-semibold text-on-surface">Maintenance Blocking</p>
              <p className="text-[11px] text-outline mt-0.5">Automated maintenance window conflict checks.</p>
            </div>
          </div>
        </div>

        {/* Approval Requirements Toggles */}
        <div className="space-y-3 pt-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-outline">Approval Workflows</h3>

          {/* HOD Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#E7DED4] bg-surface-container-lowest hover:bg-surface-container-low/40 transition-colors">
            <div className="space-y-0.5 pr-4">
              <p className="text-sm font-semibold text-on-surface">Require Department HOD Approval</p>
              <p className="text-xs text-outline">
                Requests submitted for department-assigned venues require Head of Department review before confirmation.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.requireHodApproval}
              onChange={(e) => handleInputChange('requireHodApproval', e.target.checked)}
              className="w-5 h-5 rounded text-primary accent-primary focus:ring-0 cursor-pointer"
            />
          </div>

          {/* Admin Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#E7DED4] bg-surface-container-lowest hover:bg-surface-container-low/40 transition-colors">
            <div className="space-y-0.5 pr-4">
              <p className="text-sm font-semibold text-on-surface">Require Administrator Review for Shared Venues</p>
              <p className="text-xs text-outline">
                Auditoriums and campus-wide venues require central system administrator approval.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.requireAdminApproval}
              onChange={(e) => handleInputChange('requireAdminApproval', e.target.checked)}
              className="w-5 h-5 rounded text-primary accent-primary focus:ring-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Advance Booking Constraints */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="maxAdvanceDays" className="text-xs font-semibold uppercase tracking-wider text-on-surface">
              Max Advance Horizon
            </label>
            <select
              id="maxAdvanceDays"
              value={settings.maxAdvanceDays}
              onChange={(e) => handleInputChange('maxAdvanceDays', e.target.value)}
              className="h-11 bg-surface-container-lowest border border-[#E7DED4] rounded-xl px-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="30">30 Days ahead</option>
              <option value="60">60 Days ahead</option>
              <option value="90">90 Days ahead (Default)</option>
              <option value="180">180 Days ahead</option>
              <option value="365">1 Year ahead</option>
            </select>
            <span className="text-[11px] text-outline">How far in advance users may submit requests.</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="minNoticeHours" className="text-xs font-semibold uppercase tracking-wider text-on-surface">
              Minimum Notice Period
            </label>
            <select
              id="minNoticeHours"
              value={settings.minNoticeHours}
              onChange={(e) => handleInputChange('minNoticeHours', e.target.value)}
              className="h-11 bg-surface-container-lowest border border-[#E7DED4] rounded-xl px-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="1">1 Hour notice</option>
              <option value="2">2 Hours notice (Default)</option>
              <option value="6">6 Hours notice</option>
              <option value="24">24 Hours notice</option>
            </select>
            <span className="text-[11px] text-outline">Minimum advance lead time before start time.</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="defaultDurationHours" className="text-xs font-semibold uppercase tracking-wider text-on-surface">
              Default Form Duration
            </label>
            <select
              id="defaultDurationHours"
              value={settings.defaultDurationHours}
              onChange={(e) => handleInputChange('defaultDurationHours', e.target.value)}
              className="h-11 bg-surface-container-lowest border border-[#E7DED4] rounded-xl px-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="1">1 Hour slot</option>
              <option value="2">2 Hours slot (Default)</option>
              <option value="4">4 Hours slot</option>
              <option value="8">Full Day (8 Hours)</option>
            </select>
            <span className="text-[11px] text-outline">Pre-filled duration in the booking form.</span>
          </div>
        </div>
      </section>

      {/* SECTION 3: Notification Settings */}
      <section className="bg-surface-container-lowest rounded-2xl border border-[#E7DED4] p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#E7DED4]">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Bell className="size-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-on-surface">Notification Settings</h2>
            <p className="text-xs text-outline">Channel dispatch preferences and event alerts</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* In-App Notifications */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#E7DED4] bg-surface-container-lowest hover:bg-surface-container-low/40 transition-colors">
            <div className="space-y-0.5 pr-4">
              <p className="text-sm font-semibold text-on-surface">In-App Notification Bell</p>
              <p className="text-xs text-outline">
                Record notifications directly in the system database and display in the navigation bell.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.inAppNotifications}
              onChange={(e) => handleInputChange('inAppNotifications', e.target.checked)}
              className="w-5 h-5 rounded text-primary accent-primary focus:ring-0 cursor-pointer"
            />
          </div>

          {/* Realtime channel */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#E7DED4] bg-surface-container-lowest hover:bg-surface-container-low/40 transition-colors">
            <div className="space-y-0.5 pr-4">
              <p className="text-sm font-semibold text-on-surface">Real-Time Supabase WebSocket Broadcasts</p>
              <p className="text-xs text-outline">
                Instantly trigger in-browser toast alerts without requiring manual page reload.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.realtimeAlerts}
              onChange={(e) => handleInputChange('realtimeAlerts', e.target.checked)}
              className="w-5 h-5 rounded text-primary accent-primary focus:ring-0 cursor-pointer"
            />
          </div>

          {/* Submission alert */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#E7DED4] bg-surface-container-lowest hover:bg-surface-container-low/40 transition-colors">
            <div className="space-y-0.5 pr-4">
              <p className="text-sm font-semibold text-on-surface">Booking Submission Confirmations</p>
              <p className="text-xs text-outline">
                Send an immediate confirmation notification when a booking request is submitted.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifyOnSubmission}
              onChange={(e) => handleInputChange('notifyOnSubmission', e.target.checked)}
              className="w-5 h-5 rounded text-primary accent-primary focus:ring-0 cursor-pointer"
            />
          </div>

          {/* Decision alert */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#E7DED4] bg-surface-container-lowest hover:bg-surface-container-low/40 transition-colors">
            <div className="space-y-0.5 pr-4">
              <p className="text-sm font-semibold text-on-surface">Approval & Rejection Decision Notices</p>
              <p className="text-xs text-outline">
                Notify the requester immediately when their request is approved or rejected by a reviewer.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifyOnDecision}
              onChange={(e) => handleInputChange('notifyOnDecision', e.target.checked)}
              className="w-5 h-5 rounded text-primary accent-primary focus:ring-0 cursor-pointer"
            />
          </div>
        </div>

        {/* External Gateways Status */}
        <div className="pt-2 border-t border-[#E7DED4]/60">
          <h3 className="text-xs font-bold uppercase tracking-wider text-outline mb-2.5">External Gateway Connectors</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-[#E7DED4] bg-surface-container-low/50 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-on-surface">Email Delivery (SMTP)</p>
                <p className="text-[11px] text-outline">Requires external SMTP credentials</p>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
                Unconfigured
              </span>
            </div>
            <div className="p-3 rounded-xl border border-[#E7DED4] bg-surface-container-low/50 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-on-surface">SMS Notifications</p>
                <p className="text-[11px] text-outline">Requires SMS gateway provider</p>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
                Unconfigured
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: System Information */}
      <section className="bg-surface-container-lowest rounded-2xl border border-[#E7DED4] p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#E7DED4]">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Database className="size-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-on-surface">System Information</h2>
            <p className="text-xs text-outline">Runtime environment, database connectivity status, and framework metrics</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* App Version */}
          <div className="p-3.5 rounded-xl border border-[#E7DED4] bg-surface-container-lowest space-y-1">
            <span className="text-xs font-semibold text-outline flex items-center gap-1">
              <Layers className="size-3.5 text-primary" />
              App Version
            </span>
            <p className="text-sm font-bold text-on-surface">v{systemInfo.appVersion}</p>
            <p className="text-[11px] text-outline">Venuity Core App</p>
          </div>

          {/* Framework */}
          <div className="p-3.5 rounded-xl border border-[#E7DED4] bg-surface-container-lowest space-y-1">
            <span className="text-xs font-semibold text-outline flex items-center gap-1">
              <Server className="size-3.5 text-primary" />
              Next.js & React
            </span>
            <p className="text-sm font-bold text-on-surface">Next {systemInfo.nextVersion}</p>
            <p className="text-[11px] text-outline">React {systemInfo.reactVersion}</p>
          </div>

          {/* Database Connection */}
          <div className="p-3.5 rounded-xl border border-[#E7DED4] bg-surface-container-lowest space-y-1">
            <span className="text-xs font-semibold text-outline flex items-center gap-1">
              <Database className="size-3.5 text-primary" />
              Database Status
            </span>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  systemInfo.dbStatus === 'Connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className="text-sm font-bold text-on-surface">{systemInfo.dbStatus}</span>
            </div>
            <p className="text-[11px] text-outline">
              {systemInfo.dbLatencyMs ? `Latency: ~${systemInfo.dbLatencyMs} ms` : 'PostgreSQL Pool: Operational'}
            </p>
          </div>

          {/* Node Runtime */}
          <div className="p-3.5 rounded-xl border border-[#E7DED4] bg-surface-container-lowest space-y-1">
            <span className="text-xs font-semibold text-outline flex items-center gap-1">
              <Cpu className="size-3.5 text-primary" />
              Runtime
            </span>
            <p className="text-sm font-bold text-on-surface">Node {systemInfo.nodeVersion}</p>
            <p className="text-[11px] text-outline">Server-side execution</p>
          </div>
        </div>

        {/* Security / Non-exposure confirmation card */}
        <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-start gap-3">
          <Lock className="size-4.5 text-outline shrink-0 mt-0.5" />
          <div className="text-xs text-outline space-y-0.5">
            <p className="font-semibold text-on-surface">Security & Privacy Assurance</p>
            <p>
              Database connection strings, service role credentials, and session tokens are strictly isolated on the server runtime and are not accessible or exposed to client settings.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 5: Controls (Save & Reset) */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleReset}
          className="h-11 px-5 rounded-xl border border-[#E7DED4] bg-surface-container-lowest text-xs sm:text-sm font-semibold text-outline hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer active:scale-95 flex items-center gap-2"
        >
          <RotateCcw className="size-4" />
          <span>Reset Changes</span>
        </button>
        <button
          type="submit"
          className="h-11 px-6 rounded-xl bg-primary hover:bg-[#C94B24] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
        >
          <Save className="size-4" />
          <span>Save Changes</span>
        </button>
      </div>
    </form>
  )
}

