import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const cleanUsername = String(username || '').trim().toLowerCase();

    // 1. Primary Security Check: Database verification using salted bcrypt hash
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .ilike('username', cleanUsername)
        .maybeSingle();

      if (!error && user && user.password) {
        const isValid = await bcrypt.compare(password, user.password).catch(() => false);
        if (isValid) {
          return NextResponse.json({
            success: true,
            user: {
              id: user.id,
              username: user.username,
              full_name: user.full_name || 'Anish',
              role: user.role || 'admin',
            },
          });
        }
      }
    } catch (dbErr) {
      console.warn('Database query during auth notice:', dbErr);
    }

    // 2. Secure Environment Fallback (from .env.local only, never hardcoded in code)
    const fallbackEmail = (process.env.ADMIN_FALLBACK_EMAIL || '').trim().toLowerCase();
    const fallbackPassword = process.env.ADMIN_FALLBACK_PASSWORD || '';

    if (
      fallbackEmail &&
      fallbackPassword &&
      cleanUsername === fallbackEmail &&
      password === fallbackPassword
    ) {
      return NextResponse.json({
        success: true,
        user: {
          id: 1,
          username: fallbackEmail,
          full_name: 'Anish',
          role: 'admin',
        },
      });
    }

    return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 });
  }
}
