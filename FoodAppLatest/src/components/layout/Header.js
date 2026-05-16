import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Platform} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Colors} from '../../constants/colors';

export const Header = ({title, onBack, rightComponent, transparent = false}) => (
  <View style={[styles.header, transparent && styles.transparent]}>
    {onBack && (
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Icon name="arrow-back-ios" size={22} color={Colors.textPrimary} />
      </TouchableOpacity>
    )}
    <Text style={styles.title} numberOfLines={1}>{title}</Text>
    <View style={styles.right}>
      {rightComponent || <View style={styles.placeholder} />}
    </View>
  </View>
);

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  transparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  right: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  placeholder: {width: 32},
});
