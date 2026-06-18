import React, { useMemo } from 'react';
import {View, ActivityIndicator, StyleSheet, Text} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export const Loader = ({fullScreen, size = 'large', text = 'Loading...'}) => {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={Colors.primary} />
        <Text style={styles.text}>{text}</Text>
      </View>
    );
  }
  return <ActivityIndicator size={size} color={Colors.primary} />;
};

const createStyles = (C) => StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.background,
  },
  text: {
    marginTop: 12,
    color: C.textSecondary,
    fontSize: 16,
  },
});
