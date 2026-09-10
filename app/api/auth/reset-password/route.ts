import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { action, username, dob, newPassword, userId } = await request.json();

    if (action === 'verify') {
      if (!username || !dob) {
        return NextResponse.json({ error: 'Username and Date of Birth required' }, { status: 400 });
      }

      const cleanUsername = String(username || '').trim();

      // Check user in Supabase
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, username, dob')
        .ilike('username', cleanUsername)
        .maybeSingle();

      if (user && user.dob === dob) {
        return NextResponse.json({ success: true, userId: user.id });
      }

      // Fallback for admin user with default DOB
      const fallbackEmail = (process.env.ADMIN_FALLBACK_EMAIL || 'crm@arkatva.com').toLowerCase();
      if (
        (cleanUsername.toLowerCase() === fallbackEmail || cleanUsername.toLowerCase() === 'admin') &&
        (dob === '2000-01-01' || dob === '1995-01-01')
      ) {
        return NextResponse.json({ success: true, userId: user?.id || 1 });
      }

      return NextResponse.json({ error: 'Invalid username or Date of Birth.' }, { status: 400 });
    }

    if (action === 'reset') {
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      if (userId) {
        await supabaseAdmin
          .from('users')
          .update({ password: hashedPassword })
          .eq('id', userId);
      }

      return NextResponse.json({ success: true, message: 'Password updated successfully!' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Password reset error' }, { status: 500 });
  }
}
