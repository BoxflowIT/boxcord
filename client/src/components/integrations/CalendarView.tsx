/**
 * Calendar view — full month grid with Outlook events.
 * Navigate months, click days to see events, open in Outlook.
 * Fully i18n.
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useCalendarEvents,
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
  useDeleteCalendarEvent
} from '../../hooks/queries/microsoft';
import { toast } from '../../store/notification';
import type { CalendarEvent } from '../../types';
import {
  ExternalLinkIcon,
  MapPinIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  CloseIcon,
  EditIcon,
  TrashIcon,
  VideoIcon
} from '../ui/Icons';

// ─── Date helpers ────────────────────────────────────────────────────────────

type TFunc = (key: string, opts?: Record<string, unknown>) => string;

function getWeekdays(t: TFunc): string[] {
  return [
    t('microsoft.weekdaysMon'),
    t('microsoft.weekdaysTue'),
    t('microsoft.weekdaysWed'),
    t('microsoft.weekdaysThu'),
    t('microsoft.weekdaysFri'),
    t('microsoft.weekdaysSat'),
    t('microsoft.weekdaysSun')
  ];
}

function getMonthNames(t: TFunc): string[] {
  return [
    t('microsoft.monthJan'),
    t('microsoft.monthFeb'),
    t('microsoft.monthMar'),
    t('microsoft.monthApr'),
    t('microsoft.monthMay'),
    t('microsoft.monthJun'),
    t('microsoft.monthJul'),
    t('microsoft.monthAug'),
    t('microsoft.monthSep'),
    t('microsoft.monthOct'),
    t('microsoft.monthNov'),
    t('microsoft.monthDec')
  ];
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

/** Get all days to display in the calendar grid (including padding from prev/next month). */
function getCalendarDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const startPad = (first.getDay() + 6) % 7;
  const days: Date[] = [];

  for (let i = startPad - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const totalRows = days.length > 35 ? 42 : 35;
  while (days.length < totalRows) {
    days.push(
      new Date(year, month + 1, days.length - daysInMonth - startPad + 1)
    );
  }

  return days;
}

/**
 * Format time from Graph API dateTime string.
 * With Prefer: outlook.timezone header, Graph returns times in the user's local timezone.
 */
function formatTime(dateStr: string): string {
  const match = dateStr.match(/T(\d{2}):(\d{2})/);
  if (match) return `${match[1]}:${match[2]}`;
  return dateStr;
}

/** Parse dateTime string into a local Date without timezone shift */
function parseEventDate(dateStr: string): Date {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (match) {
    return new Date(+match[1], +match[2] - 1, +match[3], +match[4], +match[5]);
  }
  return new Date(dateStr);
}

function formatEventRange(event: CalendarEvent, t: TFunc): string {
  if (event.isAllDay) return t('microsoft.allDay');
  return `${formatTime(event.start.dateTime)}–${formatTime(event.end.dateTime)}`;
}

// ─── Event dot colors (cycle through) ───────────────────────────────────────

const DOT_COLORS = [
  'bg-blue-400',
  'bg-green-400',
  'bg-purple-400',
  'bg-orange-400',
  'bg-pink-400',
  'bg-cyan-400',
  'bg-yellow-400'
];

const DOT_HEX = [
  '#3b82f6',
  '#22c55e',
  '#a855f7',
  '#f97316',
  '#ec4899',
  '#06b6d4',
  '#eab308'
];

function dotColor(index: number): string {
  return DOT_COLORS[index % DOT_COLORS.length];
}

// ─── Time slot helpers (Teams-style 30-min intervals) ────────────────────────

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

/** Snap an arbitrary HH:mm value to the nearest TIME_SLOTS entry (rounding down) */
function snapToSlot(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const snappedM = m >= 30 ? '30' : '00';
  return `${String(h).padStart(2, '0')}:${snappedM}`;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Get the next slot that's >= 30min after the given slot */
function defaultEndSlot(start: string): string {
  const idx = TIME_SLOTS.indexOf(start);
  return TIME_SLOTS[Math.min(idx + 1, TIME_SLOTS.length - 1)];
}

// ─── Custom time picker dropdown ─────────────────────────────────────────────

function TimeDropdown({
  label,
  value,
  onChange,
  minTime
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  minTime?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (open && activeRef.current) {
      activeRef.current.scrollIntoView({ block: 'center' });
    }
  }, [open]);

  const slots = minTime ? TIME_SLOTS.filter((s) => s > minTime) : TIME_SLOTS;

  return (
    <div className="flex-1" ref={containerRef}>
      <label className="text-xs text-boxflow-muted block mb-1">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full bg-boxflow-darker border border-boxflow-hover-50 rounded-lg px-3 py-2 text-sm text-white text-left hover:border-boxflow-muted focus:outline-none focus:border-blue-500 transition-colors flex items-center justify-between"
        >
          {value}
          <ChevronRightIcon
            size="sm"
            className={`transition-transform ${open ? 'rotate-90' : ''}`}
          />
        </button>
        {open && (
          <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-boxflow-dark border border-boxflow-hover-50 rounded-lg shadow-xl scrollbar-thin">
            {slots.map((slot) => (
              <button
                key={slot}
                type="button"
                ref={slot === value ? activeRef : undefined}
                onClick={() => {
                  onChange(slot);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                  slot === value
                    ? 'bg-blue-600 text-white'
                    : 'text-boxflow-muted hover:bg-boxflow-hover/40 hover:text-white'
                }
                `}
              >
                {slot}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Create Event Modal (Teams-style) ────────────────────────────────────────

function CreateEventModal({
  date,
  onClose,
  t
}: {
  date: Date;
  onClose: () => void;
  t: TFunc;
}) {
  const createEvent = useCreateCalendarEvent();

  const now = new Date();
  const currentSlot = snapToSlot(
    `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  );

  const [subject, setSubject] = useState('');
  const [startDate, setStartDate] = useState(toDateStr(date));
  const [startTime, setStartTime] = useState(currentSlot);
  const [endDate, setEndDate] = useState(toDateStr(date));
  const [endTime, setEndTime] = useState(defaultEndSlot(currentSlot));
  const [location, setLocation] = useState('');
  const [body, setBody] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [isOnlineMeeting, setIsOnlineMeeting] = useState(false);

  const handleStartTimeChange = (newStart: string) => {
    const oldStartIdx = TIME_SLOTS.indexOf(startTime);
    const oldEndIdx = TIME_SLOTS.indexOf(endTime);
    const duration = Math.max(oldEndIdx - oldStartIdx, 1);
    const newStartIdx = TIME_SLOTS.indexOf(newStart);
    const newEndIdx = Math.min(newStartIdx + duration, TIME_SLOTS.length - 1);

    setStartTime(newStart);
    setEndTime(TIME_SLOTS[newEndIdx]);
  };

  const handleStartDateChange = (d: string) => {
    setStartDate(d);
    if (d > endDate) setEndDate(d);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    createEvent.mutate(
      {
        subject: subject.trim(),
        start: isAllDay
          ? { dateTime: `${startDate}T00:00:00`, timeZone: tz }
          : { dateTime: `${startDate}T${startTime}:00`, timeZone: tz },
        end: isAllDay
          ? { dateTime: `${endDate}T23:59:59`, timeZone: tz }
          : { dateTime: `${endDate}T${endTime}:00`, timeZone: tz },
        location: location.trim() || undefined,
        body: body.trim() || undefined,
        isOnlineMeeting: isOnlineMeeting || undefined,
        isAllDay: isAllDay || undefined
      },
      {
        onSuccess: () => {
          toast.success(t('microsoft.eventCreated'));
          onClose();
        },
        onError: () => toast.error(t('microsoft.eventCreateError'))
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <form
        onSubmit={handleSubmit}
        className="bg-boxflow-dark border border-boxflow-hover-50 rounded-xl w-full max-w-lg p-6 space-y-4 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-base">
            {t('microsoft.newEvent')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-boxflow-muted hover:text-white transition-colors"
          >
            <CloseIcon size="sm" />
          </button>
        </div>

        <input
          type="text"
          placeholder={t('microsoft.addSubject')}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          autoFocus
          className="w-full bg-transparent border-0 border-b-2 border-boxflow-hover-50 focus:border-blue-500 rounded-none px-0 py-2 text-lg text-white placeholder-boxflow-muted focus:outline-none transition-colors"
        />

        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-boxflow-hover-50 rounded-full peer-checked:bg-blue-600 transition-colors" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform" />
          </div>
          <span className="text-sm text-boxflow-muted group-hover:text-white transition-colors">
            {t('microsoft.allDay')}
          </span>
        </label>

        <div className="space-y-3">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-xs text-boxflow-muted block mb-1">
                {t('microsoft.startDate')}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full bg-boxflow-darker border border-boxflow-hover-50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
              />
            </div>
            {!isAllDay && (
              <TimeDropdown
                label={t('microsoft.startTime')}
                value={startTime}
                onChange={handleStartTimeChange}
              />
            )}
          </div>

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-xs text-boxflow-muted block mb-1">
                {t('microsoft.endDate')}
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-boxflow-darker border border-boxflow-hover-50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
              />
            </div>
            {!isAllDay && (
              <TimeDropdown
                label={t('microsoft.endTime')}
                value={endTime}
                onChange={setEndTime}
                minTime={startDate === endDate ? startTime : undefined}
              />
            )}
          </div>
        </div>

        <div>
          <label className="text-xs text-boxflow-muted block mb-1">
            {t('microsoft.location')}
          </label>
          <div className="flex items-center gap-2">
            <MapPinIcon
              size="sm"
              className="text-boxflow-muted flex-shrink-0"
            />
            <input
              type="text"
              placeholder={t('microsoft.addLocation')}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1 bg-boxflow-darker border border-boxflow-hover-50 rounded-lg px-3 py-2 text-sm text-white placeholder-boxflow-muted focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-boxflow-muted block mb-1">
            {t('microsoft.description')}
          </label>
          <textarea
            placeholder={t('microsoft.addDescription')}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            className="w-full bg-boxflow-darker border border-boxflow-hover-50 rounded-lg px-3 py-2 text-sm text-white placeholder-boxflow-muted focus:outline-none focus:border-blue-500 transition-colors resize-none"
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={isOnlineMeeting}
              onChange={(e) => setIsOnlineMeeting(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-boxflow-hover-50 rounded-full peer-checked:bg-blue-600 transition-colors" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform" />
          </div>
          <div className="flex items-center gap-2 text-sm text-boxflow-muted group-hover:text-white transition-colors">
            <VideoIcon size="sm" />
            <span>{t('microsoft.teamsMeeting')}</span>
          </div>
        </label>

        <div className="flex justify-end gap-2 pt-2 border-t border-boxflow-hover-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-boxflow-muted hover:text-white transition-colors"
          >
            {t('microsoft.cancel')}
          </button>
          <button
            type="submit"
            disabled={!subject.trim() || createEvent.isPending}
            className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
          >
            {createEvent.isPending
              ? t('microsoft.creating')
              : t('microsoft.create')}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Edit Event Modal (Teams-style) ──────────────────────────────────────────

function EditEventModal({
  event,
  onClose,
  t
}: {
  event: CalendarEvent;
  onClose: () => void;
  t: TFunc;
}) {
  const updateEvent = useUpdateCalendarEvent();

  const eventStartDate = parseEventDate(event.start.dateTime);
  const eventEndDate = parseEventDate(event.end.dateTime);

  const [subject, setSubject] = useState(event.subject);
  const [startDate, setStartDate] = useState(toDateStr(eventStartDate));
  const [startTime, setStartTime] = useState(
    snapToSlot(formatTime(event.start.dateTime))
  );
  const [endDate, setEndDate] = useState(toDateStr(eventEndDate));
  const [endTime, setEndTime] = useState(
    snapToSlot(formatTime(event.end.dateTime))
  );
  const [location, setLocation] = useState(event.location?.displayName || '');
  const [body, setBody] = useState(event.bodyPreview || '');
  const [isAllDay, setIsAllDay] = useState(event.isAllDay || false);
  const [isOnlineMeeting, setIsOnlineMeeting] = useState(
    event.isOnlineMeeting || false
  );

  const handleStartTimeChange = (newStart: string) => {
    const oldStartIdx = TIME_SLOTS.indexOf(startTime);
    const oldEndIdx = TIME_SLOTS.indexOf(endTime);
    const duration = Math.max(oldEndIdx - oldStartIdx, 1);
    const newStartIdx = TIME_SLOTS.indexOf(newStart);
    const newEndIdx = Math.min(newStartIdx + duration, TIME_SLOTS.length - 1);

    setStartTime(newStart);
    setEndTime(TIME_SLOTS[newEndIdx]);
  };

  const handleStartDateChange = (d: string) => {
    setStartDate(d);
    if (d > endDate) setEndDate(d);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    updateEvent.mutate(
      {
        eventId: event.id,
        input: {
          subject: subject.trim(),
          start: isAllDay
            ? { dateTime: `${startDate}T00:00:00`, timeZone: tz }
            : { dateTime: `${startDate}T${startTime}:00`, timeZone: tz },
          end: isAllDay
            ? { dateTime: `${endDate}T23:59:59`, timeZone: tz }
            : { dateTime: `${endDate}T${endTime}:00`, timeZone: tz },
          location: location.trim() || undefined,
          body: body.trim() || undefined,
          isOnlineMeeting,
          isAllDay: isAllDay || undefined
        }
      },
      {
        onSuccess: () => {
          toast.success(t('microsoft.eventUpdated'));
          onClose();
        },
        onError: () => toast.error(t('microsoft.eventUpdateError'))
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <form
        onSubmit={handleSubmit}
        className="bg-boxflow-dark border border-boxflow-hover-50 rounded-xl w-full max-w-lg p-6 space-y-4 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-base">
            {t('microsoft.editEvent')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-boxflow-muted hover:text-white transition-colors"
          >
            <CloseIcon size="sm" />
          </button>
        </div>

        <input
          type="text"
          placeholder={t('microsoft.addSubject')}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          autoFocus
          className="w-full bg-transparent border-0 border-b-2 border-boxflow-hover-50 focus:border-blue-500 rounded-none px-0 py-2 text-lg text-white placeholder-boxflow-muted focus:outline-none transition-colors"
        />

        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-boxflow-hover-50 rounded-full peer-checked:bg-blue-600 transition-colors" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform" />
          </div>
          <span className="text-sm text-boxflow-muted group-hover:text-white transition-colors">
            {t('microsoft.allDay')}
          </span>
        </label>

        <div className="space-y-3">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-xs text-boxflow-muted block mb-1">
                {t('microsoft.startDate')}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full bg-boxflow-darker border border-boxflow-hover-50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
              />
            </div>
            {!isAllDay && (
              <TimeDropdown
                label={t('microsoft.startTime')}
                value={startTime}
                onChange={handleStartTimeChange}
              />
            )}
          </div>

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-xs text-boxflow-muted block mb-1">
                {t('microsoft.endDate')}
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-boxflow-darker border border-boxflow-hover-50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
              />
            </div>
            {!isAllDay && (
              <TimeDropdown
                label={t('microsoft.endTime')}
                value={endTime}
                onChange={setEndTime}
                minTime={startDate === endDate ? startTime : undefined}
              />
            )}
          </div>
        </div>

        <div>
          <label className="text-xs text-boxflow-muted block mb-1">
            {t('microsoft.location')}
          </label>
          <div className="flex items-center gap-2">
            <MapPinIcon
              size="sm"
              className="text-boxflow-muted flex-shrink-0"
            />
            <input
              type="text"
              placeholder={t('microsoft.addLocation')}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1 bg-boxflow-darker border border-boxflow-hover-50 rounded-lg px-3 py-2 text-sm text-white placeholder-boxflow-muted focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-boxflow-muted block mb-1">
            {t('microsoft.description')}
          </label>
          <textarea
            placeholder={t('microsoft.addDescription')}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            className="w-full bg-boxflow-darker border border-boxflow-hover-50 rounded-lg px-3 py-2 text-sm text-white placeholder-boxflow-muted focus:outline-none focus:border-blue-500 transition-colors resize-none"
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={isOnlineMeeting}
              onChange={(e) => setIsOnlineMeeting(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-boxflow-hover-50 rounded-full peer-checked:bg-blue-600 transition-colors" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform" />
          </div>
          <div className="flex items-center gap-2 text-sm text-boxflow-muted group-hover:text-white transition-colors">
            <VideoIcon size="sm" />
            <span>{t('microsoft.teamsMeeting')}</span>
          </div>
        </label>

        <div className="flex justify-end gap-2 pt-2 border-t border-boxflow-hover-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-boxflow-muted hover:text-white transition-colors"
          >
            {t('microsoft.cancel')}
          </button>
          <button
            type="submit"
            disabled={!subject.trim() || updateEvent.isPending}
            className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
          >
            {updateEvent.isPending
              ? t('microsoft.saving')
              : t('microsoft.save')}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Day detail panel ────────────────────────────────────────────────────────

function DayPanel({
  date,
  events,
  onClose,
  onCreateEvent,
  onEditEvent,
  t
}: {
  date: Date;
  events: CalendarEvent[];
  onClose: () => void;
  onCreateEvent: () => void;
  onEditEvent: (event: CalendarEvent) => void;
  t: TFunc;
}) {
  const deleteEvent = useDeleteCalendarEvent();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = (eventId: string) => {
    deleteEvent.mutate(eventId, {
      onSuccess: () => {
        toast.success(t('microsoft.eventDeleted'));
        setConfirmDeleteId(null);
      },
      onError: () => toast.error(t('microsoft.eventDeleteError'))
    });
  };

  return (
    <div className="bg-boxflow-darker rounded-lg border border-boxflow-hover-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">
          {date.toLocaleDateString('sv-SE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          })}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onCreateEvent}
            className="p-1 text-boxflow-muted hover:text-blue-400 transition-colors"
            title={t('microsoft.newEvent')}
          >
            <PlusIcon size="sm" />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-boxflow-muted hover:text-white transition-colors"
          >
            <CloseIcon size="sm" />
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="text-boxflow-muted text-xs py-4 text-center">
          {t('microsoft.noEventsThisDay')}
        </p>
      ) : (
        <div className="space-y-2">
          {events.map((event, i) => (
            <div
              key={event.id}
              className="flex items-start gap-3 p-2.5 rounded-lg bg-boxflow-dark/50 hover:bg-boxflow-hover/30 transition-colors group"
            >
              <div
                className={`w-1 self-stretch rounded-full flex-shrink-0 ${dotColor(i)}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">
                  {event.subject}
                </p>
                <p className="text-xs text-boxflow-muted mt-0.5">
                  {formatEventRange(event, t)}
                </p>
                {event.location?.displayName && (
                  <p className="text-xs text-boxflow-muted mt-0.5 flex items-center gap-1">
                    <MapPinIcon size="sm" /> {event.location.displayName}
                  </p>
                )}
                {event.bodyPreview && (
                  <p className="text-xs text-boxflow-muted mt-1 line-clamp-2">
                    {event.bodyPreview}
                  </p>
                )}
                {event.onlineMeeting?.joinUrl && (
                  <a
                    href={event.onlineMeeting.joinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-md transition-colors"
                  >
                    <VideoIcon size="sm" />
                    {t('microsoft.joinTeamsMeeting')}
                  </a>
                )}
                {confirmDeleteId === event.id && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="text-red-400">
                      {t('microsoft.deleteConfirm')}
                    </span>
                    <button
                      onClick={() => handleDelete(event.id)}
                      disabled={deleteEvent.isPending}
                      className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs transition-colors disabled:opacity-50"
                    >
                      {deleteEvent.isPending ? '...' : t('microsoft.yes')}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-0.5 text-boxflow-muted hover:text-white text-xs transition-colors"
                    >
                      {t('microsoft.no')}
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={() => onEditEvent(event)}
                  className="p-1 text-boxflow-muted hover:text-blue-400 rounded transition-colors"
                  title={t('microsoft.edit')}
                >
                  <EditIcon size="sm" />
                </button>
                <button
                  onClick={() =>
                    setConfirmDeleteId(
                      confirmDeleteId === event.id ? null : event.id
                    )
                  }
                  className="p-1 text-boxflow-muted hover:text-red-400 rounded transition-colors"
                  title={t('microsoft.delete')}
                >
                  <TrashIcon size="sm" />
                </button>
                <a
                  href={event.webLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-boxflow-muted hover:text-white rounded transition-colors"
                  title={t('microsoft.openInOutlook')}
                >
                  <ExternalLinkIcon size="sm" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Calendar ───────────────────────────────────────────────────────────

export function CalendarView() {
  const { t } = useTranslation();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [createEventDate, setCreateEventDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const weekdays = useMemo(() => getWeekdays(t), [t]);
  const monthNames = useMemo(() => getMonthNames(t), [t]);

  const monthStart = useMemo(
    () => startOfMonth(new Date(viewYear, viewMonth, 1)).toISOString(),
    [viewYear, viewMonth]
  );
  const monthEnd = useMemo(
    () => endOfMonth(new Date(viewYear, viewMonth, 1)).toISOString(),
    [viewYear, viewMonth]
  );

  const {
    data: events,
    isLoading,
    error
  } = useCalendarEvents(undefined, true, monthStart, monthEnd);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    if (!events?.value) return map;
    for (const ev of events.value) {
      const d = parseEventDate(ev.start.dateTime);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const arr = map.get(key) || [];
      arr.push(ev);
      map.set(key, arr);
    }
    return map;
  }, [events]);

  const calendarDays = useMemo(
    () => getCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const eventsForDate = (d: Date) =>
    eventsByDay.get(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`) || [];

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
    setSelectedDate(null);
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(today);
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-boxflow-darker rounded-lg border border-boxflow-hover-50 p-12 text-center">
          <p className="text-red-400 text-sm">
            {t('microsoft.couldNotLoadCalendar')}
          </p>
          <p className="text-boxflow-muted text-xs mt-1">
            {t('microsoft.sessionExpired')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-white font-semibold text-lg">
            {monthNames[viewMonth]} {viewYear}
          </h2>
          {isLoading && (
            <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs text-boxflow-muted hover:text-white bg-boxflow-darker border border-boxflow-hover-50 rounded-lg transition-colors mr-2"
          >
            {t('microsoft.today')}
          </button>
          <button
            onClick={prevMonth}
            className="p-1.5 text-boxflow-muted hover:text-white hover:bg-boxflow-hover/30 rounded-lg transition-colors"
          >
            <ChevronLeftIcon size="sm" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 text-boxflow-muted hover:text-white hover:bg-boxflow-hover/30 rounded-lg transition-colors"
          >
            <ChevronRightIcon size="sm" />
          </button>
        </div>
      </div>

      <div className="bg-boxflow-darker rounded-lg border border-boxflow-hover-50 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-boxflow-hover-50">
          {weekdays.map((day) => (
            <div
              key={day}
              className="px-2 py-2 text-center text-xs font-medium text-boxflow-muted"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((date, i) => {
            const inMonth = date.getMonth() === viewMonth;
            const _isToday = isToday(date);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const dayEvents = eventsForDate(date);
            const hasEvents = dayEvents.length > 0;

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(isSelected ? null : date)}
                className={`
                  relative min-h-[72px] p-1.5 border-b border-r border-boxflow-hover-50/50
                  text-left transition-colors group
                  ${inMonth ? 'hover:bg-boxflow-hover/20' : 'opacity-40'}
                  ${isSelected ? 'bg-blue-500/10 ring-1 ring-inset ring-blue-500/40' : ''}
                `}
              >
                <span
                  className={`
                    inline-flex items-center justify-center w-6 h-6 text-xs rounded-full
                    ${_isToday ? 'bg-blue-500 text-white font-bold' : inMonth ? 'text-white' : 'text-boxflow-muted'}
                  `}
                >
                  {date.getDate()}
                </span>

                {hasEvents && (
                  <div className="mt-0.5 space-y-0.5">
                    {dayEvents.slice(0, 3).map((ev, j) => (
                      <div
                        key={ev.id}
                        className="flex items-center gap-1 px-1 py-0.5 rounded text-[10px] leading-tight truncate"
                        style={{
                          backgroundColor: `${DOT_HEX[j % DOT_HEX.length]}20`
                        }}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor(j)}`}
                        />
                        <span className="truncate text-white/80">
                          {ev.isAllDay
                            ? ev.subject
                            : `${formatTime(ev.start.dateTime)} ${ev.subject}`}
                        </span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-boxflow-muted px-1">
                        {t('microsoft.moreEvents', {
                          count: dayEvents.length - 3
                        })}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <DayPanel
          date={selectedDate}
          events={eventsForDate(selectedDate)}
          onClose={() => setSelectedDate(null)}
          onCreateEvent={() => setCreateEventDate(selectedDate)}
          onEditEvent={(event) => setEditingEvent(event)}
          t={t}
        />
      )}

      {createEventDate && (
        <CreateEventModal
          date={createEventDate}
          onClose={() => setCreateEventDate(null)}
          t={t}
        />
      )}

      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          t={t}
        />
      )}
    </div>
  );
}
