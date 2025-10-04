import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../../src/screens/auth/RegisterScreen';
import { renderWithProviders } from '../utils/renderWithProviders';

describe('RegisterScreen', () => {
  const switchMock = jest.fn();
  let alertSpy: jest.SpyInstance;

  const fillBasicFields = (getByPlaceholderText: any) => {
    fireEvent.changeText(getByPlaceholderText('Choose a username'), 'new_user');
    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'new@example.com');
    fireEvent.changeText(getByPlaceholderText('How should we display your name?'), 'New User');
    fireEvent.changeText(getByPlaceholderText('Create a password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password123');
  };

  beforeEach(() => {
    switchMock.mockClear();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('submits registration data when valid', async () => {
    const registerMock = jest.fn(async () => true);
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <RegisterScreen onSwitchToLogin={switchMock} />, {
        auth: { value: { register: registerMock } },
      }
    );

    fillBasicFields(getByPlaceholderText);
    fireEvent.changeText(getByPlaceholderText('Tell us about yourself...'), ' Hello world ');

    await act(async () => {
      fireEvent.press(getByText('Sign Up'));
    });

    expect(registerMock).toHaveBeenCalledWith({
      username: 'new_user',
      email: 'new@example.com',
      displayName: 'New User',
      password: 'password123',
      bio: 'Hello world',
    });
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('validates required fields', async () => {
    const { getByText } = renderWithProviders(
      <RegisterScreen onSwitchToLogin={switchMock} />, {
        auth: { value: {} },
      }
    );

    await act(async () => {
      fireEvent.press(getByText('Sign Up'));
    });

    expect(alertSpy).toHaveBeenCalledWith('Validation Error', 'Please fill in all required fields');
  });

  it('validates username rules', async () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <RegisterScreen onSwitchToLogin={switchMock} />, {
        auth: { value: {} },
      }
    );

    fireEvent.changeText(getByPlaceholderText('Choose a username'), 'ab');
    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'user@example.com');
    fireEvent.changeText(getByPlaceholderText('How should we display your name?'), 'User Test');
    fireEvent.changeText(getByPlaceholderText('Create a password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password123');

    await act(async () => {
      fireEvent.press(getByText('Sign Up'));
    });

    expect(alertSpy).toHaveBeenCalledWith('Validation Error', 'Username must be at least 3 characters long');

    fireEvent.changeText(getByPlaceholderText('Choose a username'), 'invalid username');

    await act(async () => {
      fireEvent.press(getByText('Sign Up'));
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Validation Error',
      'Username can only contain letters, numbers, and underscores'
    );
  });

  it('validates email and password rules', async () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <RegisterScreen onSwitchToLogin={switchMock} />, {
        auth: { value: {} },
      }
    );

    fireEvent.changeText(getByPlaceholderText('Choose a username'), 'valid_user');
    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'invalid-email');
    fireEvent.changeText(getByPlaceholderText('How should we display your name?'), 'Valid User');
    fireEvent.changeText(getByPlaceholderText('Create a password'), 'pass');
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'pass');

    await act(async () => {
      fireEvent.press(getByText('Sign Up'));
    });

    expect(alertSpy).toHaveBeenCalledWith('Validation Error', 'Please enter a valid email address');

    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'valid@example.com');

    await act(async () => {
      fireEvent.press(getByText('Sign Up'));
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Validation Error',
      'Password must be at least 6 characters long'
    );

    fireEvent.changeText(getByPlaceholderText('Create a password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'different');

    await act(async () => {
      fireEvent.press(getByText('Sign Up'));
    });

    expect(alertSpy).toHaveBeenCalledWith('Validation Error', 'Passwords do not match');
  });

  it('shows error when registration fails', async () => {
    const registerMock = jest.fn(async () => false);
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <RegisterScreen onSwitchToLogin={switchMock} />, {
        auth: { value: { register: registerMock } },
      }
    );

    fillBasicFields(getByPlaceholderText);

    await act(async () => {
      fireEvent.press(getByText('Sign Up'));
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Registration Failed',
        'Unable to create account. Please try again.'
      );
    });
  });

  it('handles unexpected errors gracefully', async () => {
    const registerMock = jest.fn(async () => {
      throw new Error('Unexpected');
    });
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <RegisterScreen onSwitchToLogin={switchMock} />, {
        auth: { value: { register: registerMock } },
      }
    );

    fillBasicFields(getByPlaceholderText);

    await act(async () => {
      fireEvent.press(getByText('Sign Up'));
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Error',
        'An unexpected error occurred during registration'
      );
    });
  });

  it('displays loading state during registration', async () => {
    jest.useFakeTimers();
    const registerMock = jest.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return true;
    });

    const { getByPlaceholderText, getByText, queryByText } = renderWithProviders(
      <RegisterScreen onSwitchToLogin={switchMock} />, {
        auth: { value: { register: registerMock } },
      }
    );

    fillBasicFields(getByPlaceholderText, getByText);

    await act(async () => {
      fireEvent.press(getByText('Sign Up'));
    });

    expect(getByText('Creating Account...')).toBeTruthy();

    act(() => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(queryByText('Creating Account...')).toBeNull();
      expect(getByText('Sign Up')).toBeTruthy();
    });

    jest.useRealTimers();
  });

  it('invokes switch handler to login screen', () => {
    const { getByText } = renderWithProviders(
      <RegisterScreen onSwitchToLogin={switchMock} />, {
        auth: { value: {} },
      }
    );

    fireEvent.press(getByText('Sign In'));
    expect(switchMock).toHaveBeenCalled();
  });
});
