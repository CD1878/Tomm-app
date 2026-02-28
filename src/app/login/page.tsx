import { login, signup } from '@/app/login/actions'
import * as motion from 'framer-motion/client';
import { LoginForm } from './login-form'

export default async function LoginPage(props: { searchParams: Promise<{ error?: string }> }) {
    const searchParams = await props.searchParams;
    const error = searchParams?.error;

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#253551]/5 rounded-full blur-3xl -z-10 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md space-y-8"
            >
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight text-[#253551] text-balance">Chef's Mail</h1>
                    <p className="text-black/60 font-light text-lg text-pretty">Top of Mind Marketing</p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                >
                    <LoginForm loginAction={login} signupAction={signup} error={error} />
                </motion.div>
            </motion.div>
        </div>
    )
}
