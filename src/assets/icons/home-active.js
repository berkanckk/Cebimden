import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../../styles/colors';

const HomeActiveIcon = ({ color = COLORS.primary, size = 24 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color + '20'} // %20 opaklık ile arka plan
      />
      <Path
        d="M9 22V12h6v10"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default HomeActiveIcon; 