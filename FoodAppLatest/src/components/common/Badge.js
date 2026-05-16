import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors} from '../../constants/colors';

export const Badge = ({count, style}) => {
  if (!count || count === 0) return null;
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.text}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.error,
    borderRadius: 999,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  text: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
});
