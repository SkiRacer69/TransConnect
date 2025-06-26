import React from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';

const SafeAreaWrapper = ({ children, style }) => {
  const getStatusBarHeight = () => {
    if (Platform.OS === 'ios') {
      return 44; // iOS status bar height
    } else if (Platform.OS === 'android') {
      return StatusBar.currentHeight || 0;
    }
    return 0;
  };

  return (
    <View style={[styles.container, { paddingTop: getStatusBarHeight() }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SafeAreaWrapper; 