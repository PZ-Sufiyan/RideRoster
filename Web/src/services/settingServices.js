import { supabase } from '../lib/supabaseClient';

export const getCurrentAuthUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data?.user) throw new Error('No authenticated user found.');
    return data.user;
};

/* Shared auth settings helpers (admin/superadmin/subadmin) */

export const verifyCurrentPassword = async (currentPassword) => {
    const user = await getCurrentAuthUser();
    const email = user?.email;

    if (!email) {
        throw new Error('Unable to verify current password. User email not found.');
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
    });

    if (error) throw error;
    return true;
};

export const updateCurrentPassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
    });
    if (error) throw error;
    return data;
};

export const updateCurrentNotificationPrefs = async (preferences) => {
    const { data, error } = await supabase.auth.updateUser({
        data: {
            notification_preferences: preferences,
        },
    });
    if (error) throw error;
    return data;
};

/* Super Admin settings */

export const getCurrentSuperAdminSettings = async () => {
    const user = await getCurrentAuthUser();

    const { data: profile, error: profileError } = await supabase
        .from('super_admin')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profileError) throw profileError;

    return {
        authUser: user,
        profile,
    };
};

export const updateCurrentSuperAdminProfile = async ({ full_name, phone }) => {
    const user = await getCurrentAuthUser();

    const { data, error } = await supabase
        .from('super_admin')
        .update({
            full_name,
            phone,
            updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select('*')
        .single();

    if (error) throw error;
    return data;
};

/* Sub Admin settings */

export const getCurrentSubAdminSettings = async () => {
    const user = await getCurrentAuthUser();

    const { data, error } = await supabase
        .from('sub_admins')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) throw error;

    return {
        authUser: user,
        profile: data,
    };
};

export const updateCurrentSubAdminProfile = async ({ name, phone }) => {
    const user = await getCurrentAuthUser();

    const { data, error } = await supabase
        .from('sub_admins')
        .update({
            name,
            phone,
            updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select('*')
        .single();

    if (error) throw error;
    return data;
};

/* Backward-compatible aliases for current pages */
export const verifyCurrentSubAdminPassword = verifyCurrentPassword;
export const updateCurrentSubAdminPassword = updateCurrentPassword;
export const updateCurrentSubAdminNotificationPrefs = updateCurrentNotificationPrefs;