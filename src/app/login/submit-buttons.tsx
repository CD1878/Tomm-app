'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function SubmitButtons({ loginAction, signupAction }: { loginAction: any, signupAction: any }) {
    const { pending, action } = useFormStatus()

    // Check which action is currently running
    const isLogin = pending && action === loginAction
    const isSignup = pending && action === signupAction

    return (
        <div className="pt-4 space-y-3">
            <Button
                formAction={loginAction}
                disabled={pending}
                className="w-full bg-[#253551] text-white hover:bg-[#253551]/90 shadow-sm transition-all h-11 font-semibold text-base"
            >
                {pending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {pending ? 'Processing...' : 'Log in'}
            </Button>
            <Button
                formAction={signupAction}
                variant="outline"
                disabled={pending}
                className="w-full border-[#253551]/20 bg-white text-[#253551] hover:bg-slate-50 h-11 font-medium transition-all"
            >
                {pending ? 'Processing...' : 'Create new account'}
            </Button>
        </div>
    )
}
