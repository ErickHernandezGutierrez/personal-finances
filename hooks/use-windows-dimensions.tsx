import { useEffect, useState } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

type Window = {
    window: ScaledSize;
    screen: ScaledSize;
}

export function useWindowDimensions(): ScaledSize {
  const [dimensions, setDimensions] = useState<ScaledSize>(Dimensions.get('window'));

  useEffect(() => {
    const handleChange = ({ window }: Window) => {
      setDimensions(window);
    };

    const subscription = Dimensions.addEventListener('change', handleChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  return dimensions;
}