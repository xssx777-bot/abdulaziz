'use client';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', language: 'en', theme: 'light' });

  useEffect(() => {
    if (status === 'unauthenticated') router.push(`/${locale}/auth/login`);
    if (session?.user) {
      setFormData({ name: session.user.name || '', language: 'en', theme: 'light' });
    }
  }, [status, router, locale, session]);

  if (status === 'loading') return <div className="text-center mt-20">Loading...</div>;
  if (!session) return null;

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <h1 className="text-4xl font-bold">User Profile</h1>

      <div className="bg-white dark:bg-gray-800/30 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl">
              👤
            </div>
            <div>
              <h2 className="text-2xl font-bold">{session.user?.name || 'User'}</h2>
              <p className="text-gray-600 dark:text-gray-400">{session.user?.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-bold">
                {session.user?.subscriptionTier === 'free' ? 'Free Plan' : 'Premium Plan'}
              </span>
            </div>
          </div>

          {isEditing ? (
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Language</label>
                <select value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-900">
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-bold hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Email</span>
                <span className="font-bold">{session.user?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Member Since</span>
                <span className="font-bold">Aug 2024</span>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="w-full px-4 py-2 border border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 rounded-lg font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800/30 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
        <h3 className="text-xl font-bold mb-4">Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
            <span>Email Notifications</span>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
            <span>Price Alerts</span>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
            <span>News Notifications</span>
            <input type="checkbox" className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
