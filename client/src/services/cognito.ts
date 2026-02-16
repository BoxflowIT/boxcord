// AWS Cognito Authentication Service
import {
  CognitoUserPool,
  CognitoUser,
  CognitoUserSession,
  AuthenticationDetails
} from 'amazon-cognito-identity-js';
import { logger } from '../utils/logger';

// Cognito User Pool configuration
const poolData = {
  UserPoolId: 'eu-north-1_SJ3dGBIPY',
  ClientId: '6rsp6ebi274j0nlrc6t44p3pu3'
};

const userPool = new CognitoUserPool(poolData);

export interface LoginResult {
  success: boolean;
  idToken?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    email: string;
    sub: string;
    given_name?: string;
    family_name?: string;
  };
  error?: string;
  requiresNewPassword?: boolean;
  cognitoUser?: CognitoUser;
}

export interface ForgotPasswordResult {
  success: boolean;
  error?: string;
}

export interface ResetPasswordResult {
  success: boolean;
  error?: string;
}

/**
 * Sign in with email and password
 */
export const signIn = (
  email: string,
  password: string
): Promise<LoginResult> => {
  return new Promise((resolve) => {
    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password
    });

    const userData = {
      Username: email,
      Pool: userPool
    };

    const cognitoUser = new CognitoUser(userData);

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        const idToken = result.getIdToken().getJwtToken();
        const accessToken = result.getAccessToken().getJwtToken();
        const refreshToken = result.getRefreshToken().getToken();

        // Get user attributes
        cognitoUser.getUserAttributes((err, attributes) => {
          if (err) {
            logger.error('Failed to get user attributes:', err);
            resolve({
              success: true,
              idToken,
              accessToken,
              refreshToken
            });
            return;
          }

          const userAttributes = attributes?.reduce(
            (acc, attr) => {
              acc[attr.Name] = attr.Value;
              return acc;
            },
            {} as Record<string, string>
          );

          resolve({
            success: true,
            idToken,
            accessToken,
            refreshToken,
            user: {
              email: userAttributes?.email || email,
              sub: userAttributes?.sub || '',
              given_name: userAttributes?.given_name,
              family_name: userAttributes?.family_name
            }
          });
        });
      },

      onFailure: (err) => {
        logger.error('Authentication failed:', err);
        resolve({
          success: false,
          error: err.message || 'Inloggningen misslyckades'
        });
      },

      newPasswordRequired: (userAttributes) => {
        logger.log('New password required:', userAttributes);
        resolve({
          success: false,
          requiresNewPassword: true,
          cognitoUser,
          error: 'Nytt lösenord krävs'
        });
      }
    });
  });
};

/**
 * Sign out current user
 */
export const signOut = (): void => {
  const currentUser = userPool.getCurrentUser();
  if (currentUser) {
    currentUser.signOut();
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = (): CognitoUser | null => {
  return userPool.getCurrentUser();
};

/**
 * Get current session (returns valid tokens)
 */
export const getCurrentSession = (): Promise<{
  idToken: string;
  accessToken: string;
  refreshToken: string;
} | null> => {
  return new Promise((resolve) => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      resolve(null);
      return;
    }

    currentUser.getSession((err: Error | null, session: CognitoUserSession) => {
      if (err || !session) {
        logger.error('Failed to get session:', err);
        resolve(null);
        return;
      }

      if (!session.isValid()) {
        resolve(null);
        return;
      }

      resolve({
        idToken: session.getIdToken().getJwtToken(),
        accessToken: session.getAccessToken().getJwtToken(),
        refreshToken: session.getRefreshToken().getToken()
      });
    });
  });
};

/**
 * Initiate forgot password flow
 */
export const forgotPassword = (email: string): Promise<ForgotPasswordResult> => {
  return new Promise((resolve) => {
    const userData = {
      Username: email,
      Pool: userPool
    };

    const cognitoUser = new CognitoUser(userData);

    cognitoUser.forgotPassword({
      onSuccess: () => {
        resolve({ success: true });
      },
      onFailure: (err) => {
        logger.error('Forgot password failed:', err);
        resolve({
          success: false,
          error: err.message || 'Kunde inte skicka återställningskod'
        });
      }
    });
  });
};

/**
 * Confirm password reset with verification code
 */
export const confirmPassword = (
  email: string,
  verificationCode: string,
  newPassword: string
): Promise<ResetPasswordResult> => {
  return new Promise((resolve) => {
    const userData = {
      Username: email,
      Pool: userPool
    };

    const cognitoUser = new CognitoUser(userData);

    cognitoUser.confirmPassword(verificationCode, newPassword, {
      onSuccess: () => {
        resolve({ success: true });
      },
      onFailure: (err) => {
        logger.error('Password reset failed:', err);
        resolve({
          success: false,
          error: err.message || 'Lösenordsåterställning misslyckades'
        });
      }
    });
  });
};
