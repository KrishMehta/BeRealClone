import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../../src/screens/auth/LoginScreen';
import { renderWithProviders } from '../utils/renderWithProviders';

describe('LoginScreen', () => {
  const switchMock = jest.fn();
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    switchMock.mockClear();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('submits valid credentials and calls login', async () => {
    const loginMock = jest.fn(async () => true);
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <LoginScreen onSwitchToRegister={switchMock} />, {
        auth: { value: { login: loginMock } },
      }
    );

    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'user@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');

    await act(async () => {
      fireEvent.press(getByText('Sign In'));
    });

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('user@example.com', 'password123');
    });
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('shows validation error when fields are empty', async () => {
    const { getByText } = renderWithProviders(
      <LoginScreen onSwitchToRegister={switchMock} />, {
        auth: { value: {} },
      }
    );

    await act(async () => {
      fireEvent.press(getByText('Sign In'));
    });

    expect(alertSpy).toHaveBeenCalledWith('Error', 'Please fill in all fields');
  });

  it('shows validation error for invalid email format', async () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <LoginScreen onSwitchToRegister={switchMock} />, {
        auth: { value: {} },
      }
    );

    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'invalid-email');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');

    await act(async () => {
      fireEvent.press(getByText('Sign In'));
    });

    expect(alertSpy).toHaveBeenCalledWith('Error', 'Please enter a valid email address');
  });

  it('shows login failure alert when authentication fails', async () => {
    const loginMock = jest.fn(async () => false);
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <LoginScreen onSwitchToRegister={switchMock} />, {
        auth: { value: { login: loginMock } },
      }
    );

    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'user@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');

    await act(async () => {
      fireEvent.press(getByText('Sign In'));
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Login Failed', 'Invalid email or password');
    });
  });

  it('displays loading state while authenticating', async () => {
    jest.useFakeTimers();
    const loginMock = jest.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return true;
    });

    const { getByPlaceholderText, getByText, queryByText } = renderWithProviders(
      <LoginScreen onSwitchToRegister={switchMock} />, {
        auth: { value: { login: loginMock } },
      }
    );

    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'user@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');

    await act(async () => {
      fireEvent.press(getByText('Sign In'));
    });

    expect(getByText('Signing In...')).toBeTruthy();

    act(() => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(queryByText('Signing In...')).toBeNull();
      expect(getByText('Sign In')).toBeTruthy();
    });

    jest.useRealTimers();
  });

  it('invokes switch handler to register screen', () => {
    const { getByText } = renderWithProviders(
      <LoginScreen onSwitchToRegister={switchMock} />, {
        auth: { value: {} },
      }
    );

    fireEvent.press(getByText('Sign Up'));

    expect(switchMock).toHaveBeenCalled();
  });
});
