import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors} from '../../constants/colors';

export const OfferTag = ({offer, style}) => {
  if (!offer) return null;
  return (
    <View style={[styles.tag, style]}>
      <Text style={styles.tagText}>🏷️ {offer}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  tag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
});
