import React from 'react';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';
import {Colors} from '../../constants/colors';

export const Chip = ({label, active, onPress, style}) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.active, style]}
    onPress={onPress}
    activeOpacity={0.7}>
    <Text style={[styles.text, active && styles.activeText]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  active: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  activeText: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
