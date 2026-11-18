'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Shield,
  Eye,
  Building2,
  X,
  ArrowUpDown,
  RotateCcw,
  Check,
  Copy,
  Info,
  UserCheck,
  UserX,
  GraduationCap,
  Award,
  AlertTriangle,
  Lock,
} from 'lucide-react'
import { updateUserRoleAction, toggleUserStatusAction } from './actions'

export interface AdminUser {
  id: string
  fullName: string
  email: string
  role: 'ADMIN' | 'HOD' | 'FACULTY' | string
  active: boolean
  departmentId: string | null
  departmentName: string | null
  departmentCode: string | null
  createdAt: string
  updatedAt: string
}

export interface DepartmentOption {
  id: string
  name: string
  code: string
}

interface UsersAdminClientProps {
  initialUsers: AdminUser[]
  departments: DepartmentOption[]
  currentAdminId: string
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatDateTime(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

export function UsersAdminClient({
  initialUsers,
  departments,
  currentAdminId,
}: UsersAdminClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [sortOption, setSortOption] = useState<string>('created_desc')

  // Modals state
  const [viewingUser, setViewingUser] = useState<AdminUser | null>(null)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [editRole, setEditRole] = useState<'FACULTY' | 'HOD' | 'ADMIN'>('FACULTY')
  const [editDeptId, setEditDeptId] = useState<string>('')
  const [editActive, setEditActive] = useState<boolean>(true)
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string
    message: string
    actionLabel: string
    onConfirm: () => void
  } | null>(null)

  // Feedback banner
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'warning'
    message: string
  } | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Metrics summary
  const counts = useMemo(() => {
    let faculty = 0
    let hod = 0
    let admin = 0
    let active = 0
    let inactive = 0

    initialUsers.forEach((u) => {
      if (u.role === 'ADMIN') admin++
      else if (u.role === 'HOD') hod++
      else if (u.role === 'FACULTY') faculty++

      if (u.active) active++
      else inactive++
    })

    return {
      total: initialUsers.length,
      faculty,
      hod,
      admin,
      active,
      inactive,
    }
  }, [initialUsers])

  // Filtered & sorted users list
  const filteredUsers = useMemo(() => {
    return initialUsers
      .filter((u) => {
        // Search text matching name, email, or id
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const nameMatch = u.fullName.toLowerCase().includes(q)
          const emailMatch = u.email.toLowerCase().includes(q)
          const idMatch = u.id.toLowerCase().includes(q)
          const deptMatch = u.departmentName?.toLowerCase().includes(q) || false
          if (!nameMatch && !emailMatch && !idMatch && !deptMatch) return false
        }

        // Role filter
        if (roleFilter !== 'ALL' && u.role !== roleFilter) {
          return false
        }

        // Department filter
        if (departmentFilter !== 'ALL') {
          if (departmentFilter === 'NONE' && u.departmentId !== null) return false
          if (departmentFilter !== 'NONE' && u.departmentId !== departmentFilter) return false
        }

        // Status filter
        if (statusFilter === 'ACTIVE' && !u.active) return false
        if (statusFilter === 'INACTIVE' && u.active) return false

        return true
      })
      .sort((a, b) => {
        if (sortOption === 'name_asc') {
          return a.fullName.localeCompare(b.fullName)
        }
        if (sortOption === 'name_desc') {
          return b.fullName.localeCompare(a.fullName)
        }
        if (sortOption === 'created_asc') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        }
        // default: created_desc
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [initialUsers, searchQuery, roleFilter, departmentFilter, statusFilter, sortOption])

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('')
    setRoleFilter('ALL')
    setDepartmentFilter('ALL')
    setStatusFilter('ALL')
    setSortOption('created_desc')
  }

  // Copy ID helper
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  // Open edit modal
  const handleOpenEdit = (user: AdminUser) => {
    setEditingUser(user)
    setEditRole((user.role as 'FACULTY' | 'HOD' | 'ADMIN') || 'FACULTY')
    setEditDeptId(user.departmentId || '')
    setEditActive(user.active)
    setFeedback(null)
  }

  // Submit edit form
  const handleSaveUserChanges = () => {
    if (!editingUser) return

    const isSelf = editingUser.id === currentAdminId
    if (isSelf && editRole !== 'ADMIN') {
      setFeedback({
        type: 'warning',
        message: 'You cannot remove ADMIN privileges from your own account.',
      })
      return
    }

    if (isSelf && !editActive) {
      setFeedback({
        type: 'warning',
        message: 'You cannot deactivate your own account.',
      })
      return
    }

    setConfirmDialog({
      title: 'Confirm Profile Changes',
      message: `Are you sure you want to update ${editingUser.fullName}'s account to role "${editRole}" and status "${editActive ? 'Active' : 'Inactive'}"?`,
      actionLabel: 'Confirm Update',
      onConfirm: async () => {
        setConfirmDialog(null)
        startTransition(async () => {
          // If role changed or dept changed
          const roleChanged = editRole !== editingUser.role || editDeptId !== (editingUser.departmentId || '')
          const statusChanged = editActive !== editingUser.active

          let success = true
          let errMessage = ''

          if (roleChanged) {
            const res = await updateUserRoleAction(editingUser.id, editRole, editDeptId || null)
            if (res.error) {
              success = false
              errMessage = res.error
            }
          }

          if (success && statusChanged) {
            const res = await toggleUserStatusAction(editingUser.id, editActive)
            if (res.error) {
              success = false
              errMessage = res.error
            }
          }

          if (success) {
            setFeedback({
              type: 'success',
              message: `Successfully updated account settings for ${editingUser.fullName}.`,
            })
            setEditingUser(null)
            router.refresh()
          } else {
            setFeedback({
              type: 'error',
              message: errMessage || 'Failed to update account settings.',
            })
          }
        })
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {/* Total Users */}
        <div className="rounded-2xl border border-[#E7DED4] bg-surface-container-lowest p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-outline mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Users</span>
            <Users className="size-4.5 text-primary" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-on-surface">{counts.total}</p>
          <p className="text-[11px] text-outline mt-0.5">Platform accounts</p>
        </div>

        {/* Faculty */}
        <div className="rounded-2xl border border-[#E7DED4] bg-surface-container-lowest p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-outline mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Faculty</span>
            <GraduationCap className="size-4.5 text-stone-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-stone-800">{counts.faculty}</p>
          <p className="text-[11px] text-outline mt-0.5">Standard booking access</p>
        </div>

        {/* HODs */}
        <div className="rounded-2xl border border-blue-200/80 bg-blue-50/40 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-blue-700 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">HODs</span>
            <Award className="size-4.5 text-blue-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-blue-900">{counts.hod}</p>
          <p className="text-[11px] text-blue-700/80 mt-0.5">Department approvers</p>
        </div>

        {/* Admins */}
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Admins</span>
            <Shield className="size-4.5 text-amber-700" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-900">{counts.admin}</p>
          <p className="text-[11px] text-amber-800/80 mt-0.5">Full console privileges</p>
        </div>

        {/* Active Accounts */}
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 sm:p-5 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-emerald-800 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Active</span>
            <UserCheck className="size-4.5 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-bold text-emerald-900">{counts.active}</p>
            {counts.inactive > 0 && (
              <span className="text-xs text-rose-700 font-medium">({counts.inactive} inactive)</span>
            )}
          </div>
          <p className="text-[11px] text-emerald-800/80 mt-0.5">Enabled platform logins</p>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-start gap-3 shadow-sm transition-all ${feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : feedback.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : feedback.type === 'warning' ? (
            <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="size-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs sm:text-sm">
            <p className="font-semibold">
              {feedback.type === 'success'
                ? 'Success'
                : feedback.type === 'warning'
                  ? 'Attention Required'
                  : 'Action Blocked'}
            </p>
            <p className="mt-0.5 leading-relaxed">{feedback.message}</p>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Search and Filters Card */}
      <div className="bg-surface-container-lowest rounded-2xl border border-[#E7DED4] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-outline" />
            <input
              type="text"
              placeholder="Search by name, email, department, or user ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10.5 pl-10 pr-9 rounded-xl border border-[#E7DED4] bg-surface-container-lowest text-xs sm:text-sm text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Role Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="size-3.5 text-outline hidden sm:inline" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-10.5 rounded-xl border border-[#E7DED4] bg-surface-container-lowest px-3 text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="FACULTY">Faculty</option>
                <option value="HOD">HOD</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="h-10.5 rounded-xl border border-[#E7DED4] bg-surface-container-lowest px-3 text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary cursor-pointer max-w-[170px] truncate"
            >
              <option value="ALL">All Departments</option>
              <option value="NONE">Unassigned (Campus Wide)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10.5 rounded-xl border border-[#E7DED4] bg-surface-container-lowest px-3 text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>

            {/* Sort Filter */}
            <div className="flex items-center gap-1">
              <ArrowUpDown className="size-3.5 text-outline hidden sm:inline" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="h-10.5 rounded-xl border border-[#E7DED4] bg-surface-container-lowest px-3 text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="created_desc">Newest First</option>
                <option value="created_asc">Oldest First</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
              </select>
            </div>

            {/* Reset Filters button */}
            {(searchQuery || roleFilter !== 'ALL' || departmentFilter !== 'ALL' || statusFilter !== 'ALL' || sortOption !== 'created_desc') && (
              <button
                onClick={handleResetFilters}
                className="h-10.5 px-3 rounded-xl border border-[#E7DED4] bg-surface-container-low text-xs font-semibold text-outline hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer flex items-center gap-1.5"
                title="Reset all filters"
              >
                <RotateCcw className="size-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Summary */}
        <div className="flex items-center justify-between text-xs text-outline pt-1 border-t border-[#E7DED4]/60">
          <span>
            Showing <strong className="text-on-surface font-semibold">{filteredUsers.length}</strong> of{' '}
            <strong className="text-on-surface font-semibold">{initialUsers.length}</strong> registered users
          </span>
          {isPending && <span className="text-primary font-medium flex items-center gap-1">Updating...</span>}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-[#E7DED4] shadow-xs overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-surface-container text-outline flex items-center justify-center mx-auto mb-3">
              <UserX className="size-6" />
            </div>
            <h3 className="text-base font-bold text-on-surface">No users match your criteria</h3>
            <p className="text-xs text-outline mt-1 max-w-sm mx-auto">
              Try adjusting your search terms, role filters, or department selection.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-[#C94B24] transition-all cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#E7DED4] bg-surface-container-low/50 text-outline text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7DED4]">
                {filteredUsers.map((user) => {
                  const isCurrentAdmin = user.id === currentAdminId
                  const initials = user.fullName
                    ? user.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()
                    : 'U'

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-surface-container-low/40 transition-colors group"
                    >
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${user.role === 'ADMIN'
                                ? 'bg-[#FF6835] text-white shadow-xs'
                                : user.role === 'HOD'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-stone-200 text-stone-700'
                              }`}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-on-surface">{user.fullName}</span>
                              {isCurrentAdmin && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-outline">{user.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* User ID (Copyable) */}
                      <td className="py-3.5 px-4 font-mono text-xs text-outline">
                        <button
                          onClick={() => handleCopyId(user.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer group/copy"
                          title="Click to copy full UUID"
                        >
                          <span>{user.id.substring(0, 8)}...</span>
                          {copiedId === user.id ? (
                            <Check className="size-3 text-emerald-600" />
                          ) : (
                            <Copy className="size-3 text-outline/60 group-hover/copy:text-on-surface" />
                          )}
                        </button>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4">
                        {user.departmentName ? (
                          <div className="space-y-0.5">
                            <span className="text-xs font-medium text-on-surface block">
                              {user.departmentName}
                            </span>
                            {user.departmentCode && (
                              <span className="inline-block text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-container text-outline">
                                {user.departmentCode}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-outline italic">Campus Wide / None</span>
                        )}
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        {user.role === 'ADMIN' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200/80">
                            <Shield className="size-3 text-amber-700" />
                            ADMIN
                          </span>
                        ) : user.role === 'HOD' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200/80">
                            <Award className="size-3 text-blue-700" />
                            HOD
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200/80">
                            <GraduationCap className="size-3 text-stone-600" />
                            FACULTY
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {user.active ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td className="py-3.5 px-4 text-xs text-outline">
                        <span title={formatDateTime(user.createdAt)}>{formatDate(user.createdAt)}</span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingUser(user)}
                            className="p-1.5 rounded-lg border border-[#E7DED4] text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                            title="View User Details"
                          >
                            <Eye className="size-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="px-2.5 py-1 rounded-lg bg-surface-container text-xs font-medium text-on-surface hover:bg-primary hover:text-white transition-colors cursor-pointer"
                            title="Manage Role and Status"
                          >
                            Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW DETAILS MODAL */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl border border-[#E7DED4] shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E7DED4] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-xs ${viewingUser.role === 'ADMIN'
                      ? 'bg-[#FF6835]'
                      : viewingUser.role === 'HOD'
                        ? 'bg-blue-600'
                        : 'bg-stone-600'
                    }`}
                >
                  {viewingUser.fullName
                    ? viewingUser.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()
                    : 'U'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">{viewingUser.fullName}</h3>
                  <p className="text-xs text-outline">{viewingUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingUser(null)}
                className="p-1.5 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-3 rounded-xl bg-surface-container-low border border-[#E7DED4]/60">
                  <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block">
                    Assigned Role
                  </span>
                  <div className="mt-1 flex items-center gap-1.5">
                    {viewingUser.role === 'ADMIN' ? (
                      <span className="font-bold text-amber-900 flex items-center gap-1">
                        <Shield className="size-3.5 text-amber-700" /> Administrator
                      </span>
                    ) : viewingUser.role === 'HOD' ? (
                      <span className="font-bold text-blue-900 flex items-center gap-1">
                        <Award className="size-3.5 text-blue-700" /> Head of Department
                      </span>
                    ) : (
                      <span className="font-bold text-stone-800 flex items-center gap-1">
                        <GraduationCap className="size-3.5 text-stone-600" /> Faculty Member
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-container-low border border-[#E7DED4]/60">
                  <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block">
                    Account Status
                  </span>
                  <div className="mt-1 flex items-center gap-1.5">
                    {viewingUser.active ? (
                      <span className="font-bold text-emerald-800 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active & Verified
                      </span>
                    ) : (
                      <span className="font-bold text-rose-800 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-500" /> Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Department */}
              <div className="p-3.5 rounded-xl border border-[#E7DED4] bg-surface-container-lowest space-y-1">
                <span className="text-[11px] font-semibold text-outline uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="size-3 text-primary" />
                  Department Assignment
                </span>
                <p className="font-semibold text-on-surface">
                  {viewingUser.departmentName || 'No specific department assigned (Campus Wide)'}
                </p>
                {viewingUser.departmentCode && (
                  <p className="text-xs text-outline">Department Code: {viewingUser.departmentCode}</p>
                )}
              </div>

              {/* Unique ID */}
              <div className="p-3.5 rounded-xl border border-[#E7DED4] bg-surface-container-lowest space-y-1">
                <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block">
                  Supabase Auth User ID
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-on-surface break-all select-all">
                    {viewingUser.id}
                  </span>
                  <button
                    onClick={() => handleCopyId(viewingUser.id)}
                    className="p-1 rounded text-outline hover:text-on-surface ml-2 shrink-0 cursor-pointer"
                    title="Copy UUID"
                  >
                    {copiedId === viewingUser.id ? (
                      <Check className="size-4 text-emerald-600" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-3 text-xs text-outline pt-1">
                <div>
                  <span className="block font-medium">Account Created:</span>
                  <span className="text-on-surface">{formatDateTime(viewingUser.createdAt)}</span>
                </div>
                <div>
                  <span className="block font-medium">Last Profile Update:</span>
                  <span className="text-on-surface">{formatDateTime(viewingUser.updatedAt)}</span>
                </div>
              </div>

              {/* Permissions explanation */}
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-start gap-2.5 text-xs text-outline">
                <Info className="size-4 text-primary shrink-0 mt-0.5" />
                <p>
                  {viewingUser.role === 'ADMIN'
                    ? 'Administrators possess campus-wide authorization to configure venues, manage booking requests, inspect audit logs, and oversee platform settings.'
                    : viewingUser.role === 'HOD'
                      ? 'Heads of Department review and authorize booking requests submitted for venues affiliated with their department.'
                      : 'Faculty members can search venue availability and submit booking requests across authorized campus facilities.'}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E7DED4] bg-surface-container-low/40 flex items-center justify-between">
              <button
                onClick={() => {
                  const target = viewingUser
                  setViewingUser(null)
                  handleOpenEdit(target)
                }}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-[#C94B24] text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Manage Role / Status
              </button>
              <button
                onClick={() => setViewingUser(null)}
                className="px-4 py-2 rounded-xl border border-[#E7DED4] text-xs font-semibold text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER ROLE & STATUS MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl border border-[#E7DED4] shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-[#E7DED4] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-on-surface">Manage User Permissions</h3>
                <p className="text-xs text-outline">{editingUser.fullName} ({editingUser.email})</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs sm:text-sm">
              {/* Self warning */}
              {editingUser.id === currentAdminId && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5 text-xs">
                  <Lock className="size-4 text-amber-700 shrink-0 mt-0.5" />
                  <p>
                    <strong>Self-Account Safety:</strong> You are currently logged into this administrative account.
                    To prevent accidental administrative lockout, self-demotion and self-deactivation are disabled.
                  </p>
                </div>
              )}

              {/* Role Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface uppercase tracking-wider block">
                  Account Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['FACULTY', 'HOD', 'ADMIN'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      disabled={editingUser.id === currentAdminId && r !== 'ADMIN'}
                      onClick={() => setEditRole(r)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${editRole === r
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-2xs'
                          : 'border-[#E7DED4] bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
                        } ${editingUser.id === currentAdminId && r !== 'ADMIN' ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <span className="block text-xs font-bold">{r}</span>
                      <span className="text-[10px] text-outline block mt-0.5">
                        {r === 'ADMIN' ? 'Full Control' : r === 'HOD' ? 'Dept Reviewer' : 'Requester'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Department Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface uppercase tracking-wider block">
                  Assigned Department
                </label>
                <select
                  value={editDeptId}
                  onChange={(e) => setEditDeptId(e.target.value)}
                  className="w-full h-10.5 rounded-xl border border-[#E7DED4] bg-surface-container-lowest px-3 text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="">No Department / Campus Wide</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-outline block">
                  Faculty and HOD members should be assigned to their official campus department.
                </span>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#E7DED4] bg-surface-container-low">
                <div>
                  <p className="font-semibold text-on-surface text-xs sm:text-sm">Account Status</p>
                  <p className="text-[11px] text-outline">
                    {editActive ? 'User can log in and submit booking requests' : 'User login and booking are disabled'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={editActive}
                  disabled={editingUser.id === currentAdminId}
                  onChange={(e) => setEditActive(e.target.checked)}
                  className="w-5 h-5 rounded text-primary accent-primary focus:ring-0 cursor-pointer disabled:opacity-40"
                />
              </div>

              {/* Security info callout */}
              <div className="p-3 rounded-xl bg-surface-container-lowest border border-[#E7DED4] space-y-1 text-xs text-outline">
                <span className="font-semibold text-on-surface block">Authorization Architecture Note</span>
                <p className="text-[11px] leading-relaxed">
                  Role assignments and status toggles are authenticated securely on the server. The Supabase database
                  enforces Row Level Security (RLS) policies to protect integrity across all booking lifecycles.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#E7DED4] bg-surface-container-low/40 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl border border-[#E7DED4] text-xs font-semibold text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveUserChanges}
                disabled={isPending}
                className="px-5 py-2 rounded-xl bg-primary hover:bg-[#C94B24] text-white text-xs font-semibold transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isPending ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-60 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl border border-[#E7DED4] shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-on-surface">{confirmDialog.title}</h3>
                <p className="text-xs text-outline">Confirm administrative action</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl border border-[#E7DED4] text-xs font-semibold text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="px-5 py-2 rounded-xl bg-primary hover:bg-[#C94B24] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                {confirmDialog.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
