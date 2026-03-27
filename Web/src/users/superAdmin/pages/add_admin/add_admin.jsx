import React, { useState } from 'react';
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import { ToastStack } from '../../../../components/Toast';
import { supabase } from '../../../../lib/supabaseClient';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

const AddAdmin = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [showPassword, setShowPassword] = useState(false);

    const pushToast = (type, message) => {
        setToasts((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, type, message }]);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const createAdmin = async () => {
            try {
                setIsSubmitting(true);

                // Step 1: Create the user in Supabase Auth (anon key).
                // Writes role to user_metadata only (user-editable, not trusted for auth).
                const { data, error } = await supabase.auth.signUp({
                    email: formData.email.trim().toLowerCase(),
                    password: formData.password,
                });

                if (error) {
                    throw error;
                }

                if (!data?.user) {
                    throw new Error('Admin user could not be created. Please try again.');
                }

                // Step 2: Write role to app_metadata using the Admin API (service role key).
                // app_metadata is server-controlled and cannot be modified by the user,
                // making it the trusted source for role-based authorization.
                const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(
                    data.user.id,
                    {
                        app_metadata: { role: 'admin' },
                        user_metadata: { role: 'admin' },
                    }
                );

                if (metaError) {
                    // User was created but role could not be set — log clearly.
                    console.error('User created but role assignment failed:', metaError);
                    throw new Error(
                        `User was created but role could not be saved: ${metaError.message}. Check that VITE_SUPABASE_SERVICE_ROLE_KEY is set correctly.`
                    );
                }

                pushToast(
                    'success',
                    `Admin account created successfully for ${formData.email.trim().toLowerCase()}. Role "admin" has been saved to their profile.`
                );
                setFormData({ email: '', password: '' });
            } catch (err) {
                const status = err?.status ?? err?.code ?? null;
                const code = err?.error_code ?? err?.name ?? 'unknown_error';
                const message = err?.message || 'Failed to create admin user.';

                console.error('Supabase admin signup failed:', {
                    status,
                    code,
                    message,
                    details: err,
                });

                if (message.toLowerCase().includes('error sending confirmation email')) {
                    pushToast(
                        'error',
                        'Signup failed on server: confirmation email could not be sent. Please configure SMTP for Supabase Auth or enable email autoconfirm in your self-hosted Auth settings.'
                    );
                    return;
                }

                pushToast('error', message);
            } finally {
                setIsSubmitting(false);
            }
        };

        createAdmin();
    };

    return (
        <div className="space-y-6">
            <ToastStack toasts={toasts} onClose={removeToast} />
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Add Admin</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Create a new admin account for platform access.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 p-8">
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-gray-900">Admin Credentials</h2>
                    <p className="text-sm text-gray-500 mt-1">Enter email and password to add a new admin.</p>
                </div>

                <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="admin@example.com"
                            className="block w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50/50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter password"
                                className="block w-full px-4 py-3 pr-11 text-sm border border-gray-200 rounded-lg bg-gray-50/50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-2 flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => setFormData({ email: '', password: '' })}
                            disabled={isSubmitting}
                            className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors bg-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2.5 bg-[#407B90] rounded-lg text-sm font-semibold text-white hover:bg-[#356a7d] transition-colors shadow-sm"
                        >
                            {isSubmitting ? 'Creating...' : 'Add Admin'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddAdmin;
