import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../styles/colors';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{title}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: StatusBar.currentHeight || 0,
    paddingBottom: 15,
  },
  headerContent: {
    paddingTop: 15,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
});

export default Header; 