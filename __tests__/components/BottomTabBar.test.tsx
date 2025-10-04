import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import BottomTabBar from '../../src/components/BottomTabBar';
import { renderWithProviders } from '../utils/renderWithProviders';

describe('BottomTabBar', () => {
  it('renders tabs and highlights the active one', () => {
    const { getByText } = renderWithProviders(
      <BottomTabBar activeTab="Feed" onTabPress={jest.fn()} />, {
        auth: { value: {} },
      }
    );

    expect(getByText('Camera')).toBeTruthy();
    expect(getByText('Feed')).toHaveStyle({ color: '#fff' });
    expect(getByText('Discovery')).toHaveStyle({ color: '#888' });
  });

  it('invokes onTabPress with the selected tab name', () => {
    const onTabPress = jest.fn();
    const { getByText } = renderWithProviders(
      <BottomTabBar activeTab="Camera" onTabPress={onTabPress} />, {
        auth: { value: {} },
      }
    );

    fireEvent.press(getByText('Profile'));
    expect(onTabPress).toHaveBeenCalledWith('Profile');
  });
});
