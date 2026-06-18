import React, { useMemo } from 'react';
import {View, Text, StyleSheet} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export const OfferTag = ({offer, style}) => {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  if (!offer) return null;
  return (
    <View style={[styles.tag, style]}>
      <Text style={styles.tagText}>🏷️ {offer}</Text>
    </View>
  );
};

const createStyles = (C) => StyleSheet.create({
  tag: {
    backgroundColor: C.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: C.primary,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.primary,
  },
});
