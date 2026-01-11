/**
 * Shared license utilities for MAVI App
 */

import { getSupabase } from './supabaseClient';

const SECRET_SALT = 'MAVI_ROCKS_2024';

/**
 * Generates a license key based on the MAVI format: MAVI-XXXX-XXXX-XXXX
 * The last part is a checksum for client-side validation.
 */
export const generateLicenseKey = () => {
    const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();

    const input = part1 + part2 + SECRET_SALT;
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    const checksum = Math.abs(hash).toString(16).substring(0, 4).toUpperCase().padStart(4, '0');

    return `MAVI-${part1}-${part2}-${checksum}`;
};

/**
 * Validates a license key string format and checksum
 */
export const validateKeyFormat = (key) => {
    if (!key) return false;
    try {
        const parts = key.toUpperCase().trim().split('-');
        if (parts.length !== 4) return false;
        if (parts[0] !== 'MAVI') return false;

        const [prefix, part1, part2, checksum] = parts;
        const input = part1 + part2 + SECRET_SALT;
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        const expectedChecksum = Math.abs(hash).toString(16).substring(0, 4).toUpperCase().padStart(4, '0');
        return checksum === expectedChecksum;
    } catch (e) {
        return false;
    }
};

/**
 * Sends a real email to the user with their license key using Supabase Edge Functions.
 * Requires the 'send-email' function to be deployed and RESEND_API_KEY configured.
 */
export const sendLicenseEmailSimulation = async (email, key) => { // Keeping name for compatibility
    console.log(`[REAL] Sending license key ${key} to ${email} via Edge Function`);

    try {
        const supabase = getSupabase();
        const { data, error } = await supabase.functions.invoke('send-email', {
            body: { email, key },
        });

        if (error) throw error;

        console.log('Email sent successfully:', data);
        return { success: true, data };
    } catch (error) {
        console.error('Failed to send email:', error);
        // Fallback to alert if function fails (e.g. not developed yet)
        console.warn('Backend email failed, please copy key manually.');
        return { success: false, error };
    }
};

