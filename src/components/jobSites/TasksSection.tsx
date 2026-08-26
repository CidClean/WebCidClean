import { useEffect, useState, type FormEvent } from 'react'
import { createTask, deleteTask, listTasksForJobSite, updateTask } from '../../api/jobSiteTasks'
import { listAssignmentsForJobSite } from '../../api/staff'
import type { JobStaffAssignmentWithStaff } from '../../api/staff'
import { Button } from '../ui/Button'
import { Field, Input } from '../ui/Input'
import { Select } from '../ui/Select'
import {
  TASK_RECURRENCES,
  TASK_RECURRENCE_LABELS,
  WEEKDAYS,
  WEEKDAY_LABELS,
  type JobSiteTask,
  type TaskRecurrence,
  type Weekday,
} from '../../types/models'

export function TasksSection({ jobSiteId }: { jobSiteId: string }) {
  const [tasks, setTasks] = useState<JobSiteTask[]>([])
  const [staff, setStaff] = useState<JobStaffAssignmentWithStaff[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  function refresh() {
    setLoading(true)
    Promise.all([listTasksForJobSite(jobSiteId), listAssignmentsForJobSite(jobSiteId)])
      .then(([t, a]) => {
        setTasks(t)
        setStaff(a.filter((x) => !x.end_date))
      })
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [jobSiteId])

  const weeklyTasks = tasks.filter((t) => t.recurrence === 'weekly')
  const monthlyTasks = tasks.filter((t) => t.recurrence === 'monthly')

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Cleaning tasks that recur weekly or monthly for this job site, each with a staff member responsible.
      </p>
      <div className="flex justify-end">
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Done Adding Tasks' : 'Add Task'}</Button>
      </div>
      {showForm && <TaskForm jobSiteId={jobSiteId} staff={staff} onCreated={refresh} />}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-gray-500">No recurring tasks yet.</p>
      ) : (
        <div className="space-y-4">
          {weeklyTasks.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Weekly</p>
              <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                {weeklyTasks.map((t) => (
                  <TaskRow key={t.id} task={t} staff={staff} onChanged={refresh} />
                ))}
              </div>
            </div>
          )}
          {monthlyTasks.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Monthly</p>
              <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                {monthlyTasks.map((t) => (
                  <TaskRow key={t.id} task={t} staff={staff} onChanged={refresh} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TaskForm({
  jobSiteId,
  staff,
  onCreated,
}: {
  jobSiteId: string
  staff: JobStaffAssignmentWithStaff[]
  onCreated: () => void
}) {
  const [title, setTitle] = useState('')
  const [recurrence, setRecurrence] = useState<TaskRecurrence>('weekly')
  const [weekday, setWeekday] = useState<Weekday>('mon')
  const [dayOfMonth, setDayOfMonth] = useState('1')
  const [assignedStaffId, setAssignedStaffId] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await createTask({
        job_site_id: jobSiteId,
        title: title.trim(),
        recurrence,
        weekday: recurrence === 'weekly' ? weekday : null,
        day_of_month: recurrence === 'monthly' ? Math.max(1, Math.min(31, Number(dayOfMonth) || 1)) : null,
        assigned_staff_id: assignedStaffId || null,
        notes: notes.trim() || null,
      })
      setTitle('')
      setNotes('')
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <Field label="Title">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Polish stainless steel equipment" />
      </Field>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Field label="Recurrence">
          <Select value={recurrence} onChange={(e) => setRecurrence(e.target.value as TaskRecurrence)}>
            {TASK_RECURRENCES.map((r) => (
              <option key={r} value={r}>
                {TASK_RECURRENCE_LABELS[r]}
              </option>
            ))}
          </Select>
        </Field>
        {recurrence === 'weekly' ? (
          <Field label="Day of week">
            <Select value={weekday} onChange={(e) => setWeekday(e.target.value as Weekday)}>
              {WEEKDAYS.map((d) => (
                <option key={d} value={d}>
                  {WEEKDAY_LABELS[d]}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <Field label="Day of month">
            <Input type="number" min="1" max="31" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} />
          </Field>
        )}
        <Field label="Assigned to">
          <Select value={assignedStaffId} onChange={(e) => setAssignedStaffId(e.target.value)}>
            <option value="">Unassigned</option>
            {staff.map((a) => (
              <option key={a.staff_id} value={a.staff_id}>
                {a.staff?.first_name} {a.staff?.last_name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Notes (optional)">
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any extra detail" />
      </Field>
      <Button type="submit" disabled={submitting || !title.trim()}>
        {submitting ? 'Saving...' : 'Add Task'}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  )
}

function TaskRow({
  task,
  staff,
  onChanged,
}: {
  task: JobSiteTask
  staff: JobStaffAssignmentWithStaff[]
  onChanged: () => void
}) {
  const [editingStaff, setEditingStaff] = useState(false)
  const [assignedStaffId, setAssignedStaffId] = useState(task.assigned_staff_id ?? '')
  const [saving, setSaving] = useState(false)

  const assignee = staff.find((a) => a.staff_id === task.assigned_staff_id)?.staff

  async function handleReassign() {
    setSaving(true)
    try {
      await updateTask(task.id, { assigned_staff_id: assignedStaffId || null })
      setEditingStaff(false)
      onChanged()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    await deleteTask(task.id)
    onChanged()
  }

  return (
    <div className="p-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-gray-900 truncate">{task.title}</p>
        <p className="text-xs text-gray-400">
          {task.recurrence === 'weekly' ? WEEKDAY_LABELS[task.weekday as Weekday] : `Day ${task.day_of_month} of month`}
          {task.notes ? ` · ${task.notes}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {editingStaff ? (
          <>
            <Select value={assignedStaffId} onChange={(e) => setAssignedStaffId(e.target.value)} className="w-40">
              <option value="">Unassigned</option>
              {staff.map((a) => (
                <option key={a.staff_id} value={a.staff_id}>
                  {a.staff?.first_name} {a.staff?.last_name}
                </option>
              ))}
            </Select>
            <button onClick={handleReassign} disabled={saving} className="text-xs text-blue-600 hover:underline">
              Save
            </button>
          </>
        ) : (
          <button onClick={() => setEditingStaff(true)} className="text-xs text-gray-600 hover:underline">
            {assignee ? `${assignee.first_name} ${assignee.last_name}` : 'Unassigned'}
          </button>
        )}
        <button onClick={handleDelete} className="text-gray-300 hover:text-red-500 transition-colors" aria-label={`Remove ${task.title}`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
