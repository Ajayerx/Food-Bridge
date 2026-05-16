import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Colors} from '../../constants/colors';

export const Divider = ({style, thick = false}) => (
  <View style={[styles.divider, thick && styles.thick, style]} />
);

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    width: '100%',
  },
  thick: {
    height: 8,
    backgroundColor: Colors.background,
  },
});
