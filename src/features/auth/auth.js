import { supabase } from "../../supabaseClient";

// Keep in sync with Supabase: Authentication settings -> minimum password length.
export const MIN_PASSWORD_LENGTH = 8;
// Supabase (bcrypt) does not accept passwords longer than 72 characters.
export const MAX_PASSWORD_LENGTH = 72;

export function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

// Returns an error message, or null when the password is acceptable.
export function validateNewPassword(password, confirmPassword) {
    if (!password) return "Enter a new password.";

    if (password.length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
        return `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`;
    }

    if (password !== confirmPassword) {
        return "The two passwords do not match.";
    }

    return null;
}

// Supabase sends the email. The address must be allowed in Supabase:
// Authentication -> URL Configuration -> Redirect URLs.
export async function requestPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: window.location.origin }
    );

    return { error };
}

// Only works while the recovery session from the email link is active.
export async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) return { error };

    // Sign out every OTHER device that used the old password. This device stays signed in.
    try {
        await supabase.auth.signOut({ scope: "others" });
    } catch (signOutError) {
        console.error("Could not end other sessions:", signOutError);
    }

    return { error: null };
}