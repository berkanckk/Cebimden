import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

interface LogoProps {
  size?: number;
  withBackground?: boolean;
  withText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 100, 
  withBackground = false,
  withText = false
}) => {
  const imageSize = withBackground ? size * 0.85 : size;
  const containerSize = size;
  const backgroundSize = size * 0.75;

  return (
    <View style={[
      styles.container, 
      { width: containerSize, height: containerSize }
    ]}>
      {withBackground ? (
        <View style={[
          styles.background,
          { width: backgroundSize, height: backgroundSize, borderRadius: backgroundSize / 2 }
        ]}>
          <Image 
            source={withText ? require('../assets/images/cebimdelogo.png') : require('../assets/images/logonotext.png')} 
            style={{ width: imageSize, height: imageSize, resizeMode: 'contain' }} 
          />
        </View>
      ) : (
        <Image 
          source={withText ? require('../assets/images/cebimdelogo.png') : require('../assets/images/logonotext.png')} 
          style={{ width: imageSize, height: imageSize, resizeMode: 'contain' }} 
          />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  }
});

export default Logo; 