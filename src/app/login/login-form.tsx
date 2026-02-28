'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useState } from 'react'

function SubmitButton({ isLogin }: { isLogin: boolean }) {
    const { pending } = useFormStatus()

    return (
        <Button
            type="submit"
            disabled={pending}
            className="w-full bg-[#253551] text-white hover:bg-[#253551]/90 shadow-sm transition-all h-11 font-semibold text-base"
        >
            {pending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            {pending ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
        </Button>
    )
}

export function LoginForm({
    loginAction,
    signupAction,
    error
}: {
    loginAction: any
    signupAction: any
    error?: string
}) {
    const [isSignUpSent, setIsSignUpSent] = useState(false);

    return (
        <Card className="bg-white border-[#253551]/10 shadow-lg">
            <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-2xl text-[#253551] font-bold text-center text-balance">Secure Access</CardTitle>
                <CardDescription className="text-center text-black/60 text-pretty">
                    Choose below to login or create a new account
                </CardDescription>
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm text-center font-medium shadow-sm">
                        {error}
                    </div>
                )}

                <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100">
                        <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:text-[#253551] data-[state=active]:shadow-sm">Log In</TabsTrigger>
                        <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:text-[#253551] data-[state=active]:shadow-sm">Create Account</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                        <form action={loginAction} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email-login" className="text-[#253551] font-medium">Email address</Label>
                                <Input
                                    id="email-login"
                                    name="email"
                                    type="email"
                                    placeholder="name@restaurant.com"
                                    required
                                    className="bg-slate-50 border-[#253551]/20 focus-visible:ring-1 focus-visible:ring-[#253551] h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password-login" className="text-[#253551] font-medium">Password</Label>
                                <Input
                                    id="password-login"
                                    name="password"
                                    type="password"
                                    required
                                    className="bg-slate-50 border-[#253551]/20 focus-visible:ring-1 focus-visible:ring-[#253551] h-11"
                                />
                            </div>
                            <div className="pt-2">
                                <SubmitButton isLogin={true} />
                            </div>
                        </form>
                    </TabsContent>

                    <TabsContent value="signup">
                        <form action={async (formData) => {
                            // First run the server action
                            await signupAction(formData);
                            // If we don't redirect away with an error, show the confirmation screen
                            setIsSignUpSent(true);
                        }} className="space-y-4">
                            {!isSignUpSent ? (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="email-signup" className="text-[#253551] font-medium">Email address</Label>
                                        <Input
                                            id="email-signup"
                                            name="email"
                                            type="email"
                                            placeholder="name@restaurant.com"
                                            required
                                            className="bg-slate-50 border-[#253551]/20 focus-visible:ring-1 focus-visible:ring-[#253551] h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password-signup" className="text-[#253551] font-medium">Create Password</Label>
                                        <Input
                                            id="password-signup"
                                            name="password"
                                            type="password"
                                            required
                                            className="bg-slate-50 border-[#253551]/20 focus-visible:ring-1 focus-visible:ring-[#253551] h-11"
                                        />
                                    </div>
                                    <div className="pt-2">
                                        <SubmitButton isLogin={false} />
                                    </div>
                                </>
                            ) : (
                                <div className="p-6 text-center space-y-4 bg-green-50 rounded-lg border border-green-100">
                                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                                    <h3 className="text-lg font-bold text-green-800">Check your email</h3>
                                    <p className="text-sm text-green-700">
                                        We've sent a secure verification link to your email address. Please click it to activate your account.
                                    </p>
                                </div>
                            )}
                        </form>
                    </TabsContent>
                </Tabs>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t border-[#253551]/10 py-4 flex justify-center">
                <span className="text-xs text-black/40 flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                    Secure verification via Supabase
                </span>
            </CardFooter>
        </Card>
    )
}
