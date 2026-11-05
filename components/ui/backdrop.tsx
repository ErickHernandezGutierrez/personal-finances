import { useWindowDimensions } from '@/hooks/use-windows-dimensions';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

type BackdropProps = {
    onPress?: () => void;
};

export function Backdrop({ onPress }: BackdropProps) {
    const { width, height } = useWindowDimensions();
  
    return (
        <Pressable 
            style={[styles.backdrop, { width, height }]} 
            onPress={onPress} 
        />
    );
}

const styles = StyleSheet.create({
    backdrop: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
    },
});