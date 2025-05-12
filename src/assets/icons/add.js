import * as React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { COLORS } from '../../styles/colors';

const AddIcon = ({ color = COLORS.grey, size = 24 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
      <Path
        d="M12 8v8M8 12h8"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default AddIcon; 