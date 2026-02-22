import { login, signup } from '@/app/login/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'
import { SubmitButtons } from './submit-buttons'
import * as motion from 'framer-motion/client';

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
                    <h1 className="text-4xl font-extrabold tracking-tight text-[#253551] text-balance">TOMM</h1>
                    <p className="text-black/60 font-light text-lg text-pretty">Top of Mind Marketing</p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                >
                    <Card className="bg-white border-[#253551]/10 shadow-lg">
                        <CardHeader className="space-y-1 pb-6">
                            <CardTitle className="text-2xl text-[#253551] font-bold text-center text-balance">Secure Access</CardTitle>
                            <CardDescription className="text-center text-black/60 text-pretty">
                                Enter your email below to login or create an account
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4">
                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm text-center font-medium shadow-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-[#253551] font-medium">Email address</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="name@restaurant.com"
                                        required
                                        className="bg-slate-50 border-[#253551]/20 focus-visible:ring-1 focus-visible:ring-[#253551] h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-[#253551] font-medium">Password</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        className="bg-slate-50 border-[#253551]/20 focus-visible:ring-1 focus-visible:ring-[#253551] h-11"
                                    />
                                </div>

                                <SubmitButtons loginAction={login} signupAction={signup} />
                            </form>
                        </CardContent>
                        <CardFooter className="bg-slate-50 border-t border-[#253551]/10 py-4 flex justify-center mt-4">
                            <span className="text-xs text-black/40 flex items-center">
                                <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                                Secure verification via Supabase
                            </span>
                        </CardFooter>
                    </Card>
                </motion.div>
            </motion.div>
        </div>
    )
}
