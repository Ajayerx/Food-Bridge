import React from 'react';
import {View, ActivityIndicator, StyleSheet, Text} from 'react-native';
import {Colors} from '../../constants/colors';

export const Loader = ({fullScreen, size = 'large', text = 'Loading...'}) => {
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

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  text: {
    marginTop: 12,
    color: Colors.textSecondary,
    fontSize: 16,
  },
});
