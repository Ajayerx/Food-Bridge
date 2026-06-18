import React from 'react';
import {View, StyleSheet} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export const VegNonVegIcon = ({isVeg, size = 16}) => {
  const Colors = useTheme();
  return (
    <View style={[
    styles.container,
    {
      width: size,
      height: size,
      borderColor: isVeg ? Colors.vegGreen : Colors.nonVegRed,
    }
  ]}>
    <View style={[
      styles.dot,
      {
        backgroundColor: isVeg ? Colors.vegGreen : Colors.nonVegRed,
        width: size * 0.4,
        height: size * 0.4,
        borderRadius: size * 0.4,
      }
    ]} />
  </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
