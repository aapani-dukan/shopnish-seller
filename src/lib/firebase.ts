import auth from '@react-native-firebase/auth';

/**
 * Native Firebase Instance
 * इसे पूरे ऐप में इस्तेमाल किया जाएगा।
 */
export const authInstance = auth();

/* ==========================================================================
   AUTH HELPERS (SELLER OPTIMIZED - MODERN SDK)
   ========================================================================== */

/**
 * Email Sign In
 * सेलर के लिए लॉगिन करते समय आईडी टोकन को रिफ्रेश करना ज़रूरी है।
 */
export const signInWithEmail = async (email: string, password: string) => {
  try {
    // आधुनिक तरीका: auth() का सीधा इस्तेमाल
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    // ताज़ा आईडी टोकन लें (Force refresh: true)
    const token = await userCredential.user.getIdToken(true);
    return { user: userCredential.user, token };
  } catch (error: any) {
    console.error("Firebase Login Error:", error.code);
    throw error;
  }
};

/**
 * Email Sign Up
 */
export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error("Firebase Signup Error:", error.code);
    throw error;
  }
};

/**
 * Auth State Change Listener
 * वार्निंग खत्म करने के लिए आधुनिक modular सिंटैक्स
 */
export const onAuthStateChange = (callback: (user: any) => void) => {
  return auth().onAuthStateChanged(callback);
};

/**
 * Logout
 */
export const logoutUser = async () => {
  try {
    await auth().signOut();
  } catch (error) {
    console.error("Firebase Logout Error:", error);
    throw error;
  }
};

/**
 * Password Reset
 */
export const sendPasswordReset = (email: string) => {
  return auth().sendPasswordResetEmail(email);
};

/**
 * Phone OTP Verification
 * यह फंक्शन सीधा ConfirmationResult वापस करेगा
 */
export const sendOtpToPhone = async (phoneNumber: string) => {
  try {
    const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
    return confirmation;
  } catch (error: any) {
    console.error("Firebase SMS Error:", error.code);
    throw error;
  }
};

// Default Export
export default auth;