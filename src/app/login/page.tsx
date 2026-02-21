import { login, signup } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#253551]/5 rounded-full blur-3xl -z-10 pointer-events-none" />

            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight text-[#253551]">TOMM</h1>
                    <p className="text-black/60 font-light text-lg">Top of Mind Marketing</p>
                </div>

                <Card className="bg-white border-[#253551]/10 shadow-lg">
                    <CardHeader className="space-y-1 pb-6">
                        <CardTitle className="text-2xl text-[#253551] font-bold text-center">Secure Access</CardTitle>
                        <CardDescription className="text-center text-black/60">
                            Enter your email below to login or create an account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4">
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

                            <div className="pt-4 space-y-3">
                                <Button formAction={login} className="w-full bg-[#253551] text-white hover:bg-[#253551]/90 shadow-sm transition-all h-11 font-semibold text-base">
                                    Log in
                                </Button>
                                <Button formAction={signup} variant="outline" className="w-full border-[#253551]/20 bg-white text-[#253551] hover:bg-slate-50 h-11 font-medium transition-all">
                                    Create new account
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t border-[#253551]/10 py-4 flex justify-center mt-4">
                        <span className="text-xs text-black/40 flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                            Secure verification via Supabase
                        </span>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
