import { FREQUENCY_TYPES, WEEKDAYS, WEEKDAY_LABELS } from '../../types/models'
import type { FrequencyType, Weekday } from '../../types/models'
import { Field } from '../ui/Input'
import { Select } from '../ui/Select'

interface FrequencyPickerProps {
  frequency: FrequencyType
  onFrequencyChange: (value: FrequencyType) => void
  days: Weekday[]
  onDaysChange: (value: Weekday[]) => void
}

const DAYS_APPLICABLE: FrequencyType[] = ['weekly', 'biweekly', 'custom']

export function FrequencyPicker({ frequency, onFrequencyChange, days, onDaysChange }: FrequencyPickerProps) {
  function toggleDay(day: Weekday) {
    if (days.includes(day)) {
      onDaysChange(days.filter((d) => d !== day))
    } else {
      onDaysChange([...days, day])
    }
  }

  return (
    <div className="space-y-2">
      <Field label="Frequency">
        <Select value={frequency} onChange={(e) => onFrequencyChange(e.target.value as FrequencyType)}>
          {FREQUENCY_TYPES.map((f) => (
            <option key={f} value={f}>
              {f.replace('_', ' ')}
            </option>
          ))}
        </Select>
      </Field>
      {DAYS_APPLICABLE.includes(frequency) && (
        <div>
          <span className="block text-sm font-medium text-gray-700 mb-1">Days of the week</span>
          <div className="flex gap-1 flex-wrap">
            {WEEKDAYS.map((day) => (
              <button
                type="button"
                key={day}
                onClick={() => toggleDay(day)}
                className={`px-2 py-1 rounded-lg text-xs font-medium border ${
                  days.includes(day)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {WEEKDAY_LABELS[day]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
