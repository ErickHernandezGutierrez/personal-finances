import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import DateTimePicker, { type DateType } from 'react-native-ui-datepicker'

import { ChipSelect } from '@/components/forms/chip-select'
import { AppModal } from '@/components/modal'
import { Button } from '@/components/ui/button'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { useTheme } from '@/contexts/theme-context'
import {
  DATE_RANGE_PRESETS,
  type DateDraft,
  type DateRange,
  type DateRangePreset,
  formatRangeLabel,
  fromISODate,
  matchPreset,
  presetRange,
  toISODate,
} from '@/lib/date-range'

type DateRangeFilterProps = {
  from: string
  to: string
  onChange: (range: DateRange) => void
}

/** Normalizes the picker's DateType (string | number | Date | Dayjs) into a Date. */
function fromDateType(value: DateType): Date | undefined {
  if (value == null) return undefined
  if (value instanceof Date) return value
  if (typeof value === 'object' && 'toDate' in value) return value.toDate()
  return new Date(value)
}

export function DateRangeFilter({ from, to, onChange }: DateRangeFilterProps) {
  const { theme } = useTheme()
  const [visible, setVisible] = useState(false)
  const [draft, setDraft] = useState<DateDraft>({})

  const range: DateRange = { fromDate: from, toDate: to }

  function open() {
    setDraft({ startDate: fromISODate(from), endDate: fromISODate(to) })
    setVisible(true)
  }

  function applyPreset(preset: string) {
    onChange(presetRange(preset as DateRangePreset))
    setVisible(false)
  }

  function apply() {
    if (!draft.startDate || !draft.endDate) return
    onChange({ fromDate: toISODate(draft.startDate), toDate: toISODate(draft.endDate) })
    setVisible(false)
  }

  const accent = theme.primary
  const selectedDay = { backgroundColor: accent, borderRadius: 999 }

  return (
    <>
      <Pressable style={[styles.trigger, { backgroundColor: theme.fieldBackground, borderColor: theme.border }]} onPress={open}>
        <Text style={[styles.triggerText, { color: theme.text }]} numberOfLines={1}>
          {formatRangeLabel(range)}
        </Text>
        <IconSymbol name="calendar" size={18} color={theme.icon} />
      </Pressable>

      <AppModal visible={visible} title="Date range" onClose={() => setVisible(false)}>
        <View style={styles.content}>
          <ChipSelect
            label="Quick ranges"
            options={DATE_RANGE_PRESETS}
            value={matchPreset(range) ?? ''}
            onChange={applyPreset}
          />

          <DateTimePicker
            mode="range"
            startDate={draft.startDate}
            endDate={draft.endDate}
            onChange={({ startDate, endDate }) => setDraft({ startDate: fromDateType(startDate), endDate: fromDateType(endDate) })}
            allowRangeReset
            showOutsideDays
            styles={{
              header: { paddingBottom: 8 },
              month_selector_label: { color: theme.text, fontWeight: '600', fontSize: 16 },
              year_selector_label: { color: theme.text, fontWeight: '600', fontSize: 16 },
              button_prev_image: { tintColor: theme.text },
              button_next_image: { tintColor: theme.text },
              weekday_label: { color: theme.icon, fontSize: 12 },
              day_label: { color: theme.text },
              outside_label: { color: theme.icon, opacity: 0.5 },
              disabled_label: { color: theme.icon, opacity: 0.3 },
              today: { borderColor: accent, borderWidth: 1, borderRadius: 999 },
              selected: selectedDay,
              selected_label: { color: '#FFFFFF', fontWeight: '600' },
              range_start: selectedDay,
              range_start_label: { color: '#FFFFFF', fontWeight: '600' },
              range_end: selectedDay,
              range_end_label: { color: '#FFFFFF', fontWeight: '600' },
              range_middle_label: { color: theme.text },
              range_fill: { backgroundColor: `${accent}33` },
              month_label: { color: theme.text },
              year_label: { color: theme.text },
              selected_month: selectedDay,
              selected_month_label: { color: '#FFFFFF' },
              selected_year: selectedDay,
              selected_year_label: { color: '#FFFFFF' },
              active_year: { borderColor: accent, borderWidth: 1, borderRadius: 999 },
            }}
          />

          <View style={styles.actions}>
            <Button variant="secondary" size="small" title="Cancel" onPress={() => setVisible(false)} />
            <Button
              variant="primary"
              size="small"
              title="Apply"
              disabled={!draft.startDate || !draft.endDate}
              onPress={apply}
            />
          </View>
        </View>
      </AppModal>
    </>
  )
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  triggerText: { 
    fontSize: 14, 
    fontWeight: '400', 
    lineHeight: 16, 
    marginRight: 8, 
  },
  content: { gap: 16 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
})
