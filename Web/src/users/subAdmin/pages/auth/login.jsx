import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    HiOutlineMail,
    HiOutlineLockClosed,
    HiOutlineEyeOff,
    HiOutlineEye,
    HiOutlineLogin,
} from 'react-icons/hi';
import bgImage from '../../../../assets/img.png';
import logo from '../../../../assets/image-002.png';
import { supabase } from '../../../../lib/supabaseClient';
import {
    mapLoginError,
    requireConfirmedEmailOrSignOut,
} from '../../../../utils/authEmailGuards';
import ForgotPasswordPanel from '../../../../components/ForgotPasswordPanel';

const SubAdminLogin = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loginError, setLoginError] = useState('');
    const verifiedNotice = useMemo(
        () => searchParams.get('verified') === '1',
        [searchParams]
    );

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
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

            if (role !== 'subadmin') {
                // Sign the non-subadmin user out immediately so no session lingers.
                await supabase.auth.signOut();
                setLoginError('Access denied. This portal is for Sub Admins only.');
                return;
            }

            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('userRole', 'subadmin');
            navigate('/team/dashboard');
        } catch (err) {
            setLoginError(mapLoginError(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4">
            <div className="w-full max-w-5xl bg-white rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col md:flex-row">

                {/* Left Panel */}
                <div className="hidden md:block relative w-full md:w-[50%] min-h-[320px] md:min-h-[560px] overflow-hidden">
                    {/* Pattern Background */}
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${bgImage})` }}
                    />

                    {/* Soft dark overlay for text readability */}
                    <div className="absolute inset-0 bg-[rgba(13,32,98,0.62)]" />

                    {/* Content */}
                    <div className="relative z-10 h-full flex flex-col justify-between p-8 md:p-10 text-white">
                        {/* Logo */}
                        <div>
                            <img
                                src={logo}
                                alt="Nottingham Logo"
                                className="h-10 md:h-12 w-auto object-contain"
                            />
                        </div>

                        {/* Bottom Text */}
                        <div className="max-w-[340px]">
                            <h1 className="text-[28px] md:text-[32px] font-medium leading-[1.2] mb-4 text-white">
                                Streamline Your Fleet Operations.
                            </h1>
                            <p className="text-[15px] md:text-[16px] leading-8 text-white/85">
                                Manage jobs, drivers, and vehicles with unparalleled efficiency.
                                Welcome back to the command center.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="w-full md:w-[50%] bg-white px-8 md:px-10 py-10 md:py-12 flex items-center">
                    <div className="w-full max-w-md mx-auto">
                        <div className="flex justify-center md:hidden mb-10">
                            <img src={logo} alt="Logo" className="h-12 w-auto object-contain" />
                        </div>
                        {showForgotPassword ? (
                            <ForgotPasswordPanel
                                variant="admin"
                                onBack={() => setShowForgotPassword(false)}
                            />
                        ) : (
                            <>
                        <h2 className="text-[24px] md:text-[26px] font-semibold text-gray-900 mb-3 text-center md:text-left">
                            Company Sub Admin Login
                        </h2>
                        <p className="text-[15px] text-gray-500 leading-7 mb-6 text-center md:text-left">
                            Enter your credentials to access your dashboard.
                        </p>

                        <form onSubmit={handleLogin} className="space-y-5">
                            {verifiedNotice && !loginError && (
                                <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 font-medium">
                                    Email confirmed. Please sign in with your credentials.
                                </div>
                            )}
                            {loginError && (
                                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">
                                    {loginError}
                                </div>
                            )}

                            {/* Email */}
                            <div>
                                <label className="block text-[15px] font-semibold text-gray-800 mb-2">
                                    Email Address *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        <HiOutlineMail size={20} />
                                    </span>
                                    <input
                                        type="email"
                                        placeholder="subadmin@rideroster.com"
                                        className="w-full h-[48px] pl-12 pr-4 border border-gray-200 rounded-[10px] outline-none focus:border-[#005C7A] focus:ring-1 focus:ring-[#005C7A] text-gray-700 placeholder:text-gray-400"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-[15px] font-semibold text-gray-800">
                                        Password *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setLoginError('');
                                            setShowForgotPassword(true);
                                        }}
                                        className="text-[14px] font-semibold text-[#005C7A] hover:underline"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>

                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        <HiOutlineLockClosed size={20} />
                                    </span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="*************"
                                        className="w-full h-[48px] pl-12 pr-12 border border-gray-200 rounded-[10px] outline-none focus:border-[#005C7A] focus:ring-1 focus:ring-[#005C7A] text-gray-700 placeholder:text-gray-400"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <HiOutlineEye size={20} /> : <HiOutlineEyeOff size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember me */}
                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    className="w-4 h-4 border-gray-300 rounded text-[#005C7A] focus:ring-[#005C7A]"
                                />
                                <label htmlFor="remember" className="text-[15px] text-gray-500">
                                    Remember me
                                </label>
                            </div>

                            {/* Login Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-[48px] rounded-[10px] bg-[#005C7A] hover:bg-[#004a63] text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <HiOutlineLogin size={18} />
                                <span>{isLoading ? 'Signing in...' : 'Login'}</span>
                            </button>
                        </form>
                            </>
                        )}

                        {/* Footer */}
                        <div className="mt-8 text-center">
                            <p className="text-sm text-gray-400 mb-2">Having trouble logging in?</p>
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm">
                                <p>
                                    <span className="text-gray-500">Helpline: </span>
                                    <span className="text-[#005C7A] font-semibold">111-111-1022</span>
                                </p>
                                <a
                                    href="mailto:support@nottingham.com"
                                    className="text-[#005C7A] font-semibold hover:underline"
                                >
                                    support@nottingham.com
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubAdminLogin;