'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    if (res.ok) router.push(`/${locale}/auth/login`);
    else { const d = await res.json(); setError(d.error || 'Error'); }
  };

  return (
    <div className="max-w-sm mx-auto mt-20 p-6 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
      <h1 className="text-2xl font-bold text-center">Register</h1>
      {error && <p className="text-red-500 text-center mt-2">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-900" />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-900" required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-900" required minLength={6} />
        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded font-bold">Register</button>
      </form>
      <p className="text-center mt-4">Already have an account? <Link href={`/${locale}/auth/login`} className="text-blue-600">Login</Link></p>
    </div>
  );
}
