'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { DEV_USERS, type DevUserRole, isDevMode } from '@/lib/auth/dev-users'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/select-profile')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            },
        },
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/select-profile')
}

/**
 * Development-only login function
 * Allows quick authentication with predefined test users
 */
export async function devLogin(role: DevUserRole) {
    // Security check: only allow in development
    if (!isDevMode()) {
        return { error: 'Development login is not available in production' }
    }

    const supabase = await createClient()
    const devUser = DEV_USERS[role]

    const { error } = await supabase.auth.signInWithPassword({
        email: devUser.email,
        password: devUser.password,
    })

    if (error) {
        return { error: `Dev login failed: ${error.message}. Make sure the user ${devUser.email} exists in Supabase.` }
    }

    revalidatePath('/', 'layout')
    redirect('/select-profile')
}
