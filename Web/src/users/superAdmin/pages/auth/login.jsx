import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import illustration from '../../../../assets/image.png';
import { supabase } from '../../../../lib/supabaseClient';
import {
    mapLoginError,
    requireConfirmedEmailOrSignOut,
} from '../../../../utils/authEmailGuards';
import ForgotPasswordPanel from '../../../../components/ForgotPasswordPanel';

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    const handleLogin = async (e) => {
        e.preventDefault();
        setEmailError('');
        setLoginError('');

        if (!validateEmail(email)) {
            setEmailError('Please enter a valid email address.');
            return;
        }

        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password,
            });

            if (error) {
                throw error;
            }

            await requireConfirmedEmailOrSignOut(data.user);

            // Read role from app_metadata (server-controlled, set by Admin API).
            // Falls back to user_metadata for backwards compatibility.
            const role =
                data.user?.app_metadata?.role ||
                data.user?.user_metadata?.role ||
                null;

            if (role !== 'superadmin') {
                // Sign the non-superadmin user out immediately so no session lingers.
                await supabase.auth.signOut();
                setLoginError('Access denied. This portal is for Super Admins only.');
                return;
            }

            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('userRole', 'superadmin');
            navigate('/platform/dashboard');
        } catch (err) {
            setLoginError(mapLoginError(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-white font-sans overflow-hidden">
            {/* Left Panel */}
            <div className="hidden lg:flex flex-col w-[50%] bg-[#0B2569] p-12 text-white relative overflow-hidden">
                <div className="z-10">
                    <div className="flex items-center gap-3 mb-10">
                        <img src="/image-002.png" alt="Nottingham Logo" className="h-16 brightness-0 invert" />
                    </div>

                    <div className="max-w-[450px]">
                        <h1 className="text-[44px] leading-[1.1] font-serif font-bold mb-6">
                            Centralized Control for a Connected Fleet.
                        </h1>
                        <p className="text-[17px] leading-relaxed text-blue-100 opacity-90">
                            Manage companies, monitor global operations, and ensure platform integrity from a single, powerful dashboard.
                        </p>
                    </div>
                </div>

                {/* Illustration Image at bottom */}
                <div className="mt-auto z-10 overflow-hidden flex items-end">
                    <img
                        src={illustration}
                        alt="Control Center Illustration"
                        className="w-full rounded-xl shadow-2xl max-h-[40vh] object-cover object-top"
                    />
                </div>

                {/* Decorative background circle (optional, matches the vibe) */}
                <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl"></div>
            </div>

            {/* Right Panel */}
            <div className="flex flex-col justify-center items-center w-full lg:w-[50%] p-8 lg:p-16">
                <div className="w-full max-w-[420px]">
                    {showForgotPassword ? (
                        <ForgotPasswordPanel
                            variant="superadmin"
                            onBack={() => setShowForgotPassword(false)}
                        />
                    ) : (
                        <>
                    <div className="text-center mb-10">
                        <h2 className="text-[28px] font-bold text-[#1F2937] mb-2">Super Admin Login</h2>
                        <p className="text-[#6B7280] text-[15px]">Welcome back! Please enter your credentials.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-semibold text-[#374151] mb-2">Email Address</label>
                            <input
                                type="email"
                                placeholder="admin@rideroster.com"
                                className={`w-full px-4 py-3.5 bg-[#F9FAFB] border ${emailError ? 'border-red-500' : 'border-[#E5E7EB]'} rounded-lg focus:outline-none focus:ring-2 ${emailError ? 'focus:ring-red-500/20 focus:border-red-500' : 'focus:ring-blue-500/20 focus:border-blue-500'} transition-all text-[#1F2937] placeholder:text-[#9CA3AF]`}
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value.toLowerCase());
                                    if (emailError) setEmailError('');
                                    if (loginError) setLoginError('');
                                }}
                                required
                            />
                            {emailError && (
                                <p className="mt-1 text-xs text-red-500 font-medium">{emailError}</p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-semibold text-[#374151]">Password</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLoginError('');
                                        setEmailError('');
                                        setShowForgotPassword(true);
                                    }}
                                    className="text-sm font-semibold text-[#40829B] hover:underline"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="************"
                                    className="w-full px-4 py-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[#1F2937] placeholder:text-[#9CA3AF]"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (loginError) setLoginError('');
                                    }}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                                >
                                    {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Login Error Message */}
                        {loginError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600 text-center font-medium">{loginError}</p>
                            </div>
                        )}

                        {/* Remember Me */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="remember"
                                className="w-4 h-4 text-blue-600 border-[#D1D5DB] rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <label htmlFor="remember" className="text-sm text-[#4B5563] cursor-pointer">
                                Remember me
                            </label>
                        </div>

                        {/* Sign In Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 px-6 bg-[#40829B] hover:bg-[#356b80] text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                        </>
                    )}

                    <div className="mt-12 text-center">
                        <p className="text-sm text-[#9CA3AF]">
                            © 2025 RideRoster. All Rights Reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
