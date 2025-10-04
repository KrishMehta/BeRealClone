import React, { PropsWithChildren } from 'react';
import {
  render,
  renderHook,
  RenderOptions,
  RenderHookOptions,
  RenderHookResult,
} from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, AuthContext, AuthContextType } from '../../src/contexts/AuthContext';
import { createAuthContextValue } from './factories';

type AuthWrapperOptions = {
  useAuthProvider?: boolean;
  value?: Partial<AuthContextType>;
};

type ExtendedRenderOptions = RenderOptions & {
  auth?: AuthWrapperOptions;
};

type ExtendedRenderHookOptions<Props, Result> = RenderHookOptions<Props> & {
  auth?: AuthWrapperOptions;
};

const buildWrapper = (auth?: AuthWrapperOptions) => {
  const Wrapper = ({ children }: PropsWithChildren): JSX.Element => {
    const authValue = auth?.value ? createAuthContextValue(auth.value) : undefined;
    const content = auth?.useAuthProvider || !authValue ? (
      <AuthProvider>{children}</AuthProvider>
    ) : (
      <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
    );

    return <SafeAreaProvider>{content}</SafeAreaProvider>;
  };

  return Wrapper;
};

export const renderWithProviders = (
  ui: React.ReactElement,
  options: ExtendedRenderOptions = {}
) => {
  const { auth, ...renderOptions } = options;
  const wrapper = buildWrapper(auth);
  return render(ui, { wrapper, ...renderOptions });
};

export const renderHookWithProviders = <Result, Props>(
  callback: (props: Props) => Result,
  options: ExtendedRenderHookOptions<Props, Result> = {}
): RenderHookResult<Result, Props> => {
  const { auth, ...renderOptions } = options;
  const wrapper = buildWrapper(auth);
  return renderHook(callback, { wrapper, ...renderOptions });
};

export * from '@testing-library/react-native';
