import React from 'react';
import {View, Text, TouchableOpacity, ScrollView} from 'react-native';
import {useTheme} from '@/theme/ThemeProvider';

interface FilterChip {
  key: string;
  label: string;
}

interface FilterChipsProps {
  chips: FilterChip[];
  selected: string;
  onSelect: (key: string) => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  chips,
  selected,
  onSelect,
}) => {
  const {colors, borderRadius: br, spacing} = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{gap: spacing.sm}}>
      {chips.map(chip => {
        const isSelected = chip.key === selected;
        return (
          <TouchableOpacity
            key={chip.key}
            onPress={() => onSelect(chip.key)}
            activeOpacity={0.7}
            style={{
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.lg,
              borderRadius: br.round,
              backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
              borderWidth: 1,
              borderColor: isSelected ? colors.primary : colors.border,
            }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: isSelected ? colors.white : colors.textSecondary,
              }}>
              {chip.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};
