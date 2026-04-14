'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import EventCreateEditForm from '@/components/event-manager/EventCreateEditForm';

export default function EventCreatePage() {
    const router = useRouter();
    const { user } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        // Check if user is EventManager or Admin
        if (user && !user.roles?.includes('EventManager') && !user.roles?.includes('Admin')) {
            router.push('/event-manager/events');
        }
    }, [user, router]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header */}
            <div className="pb-6 border-b border-white/5">
                <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white mb-2">
                    Create <span className="text-[#10b981]">New Event</span>.
                </h1>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    Set up your event and submit it to the stadium for approval
                </p>
            </div>

            {/* Form */}
            <EventCreateEditForm />

            {/* Help Text */}
            <div className="p-6 rounded-lg bg-white/5 border border-white/10">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#10b981] mb-3">
                    What happens next?
                </h3>
                <ul className="space-y-2 text-xs text-gray-400">
                    <li className="flex gap-2">
                        <span className="text-[#10b981] font-bold">1.</span>
                        <span>
                            Your event will be submitted to the stadium owner for approval
                        </span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-[#10b981] font-bold">2.</span>
                        <span>
                            You&apos;ll receive an email notification once they review your request
                        </span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-[#10b981] font-bold">3.</span>
                        <span>
                            After approval, you can configure seating, pricing, and publish the event
                        </span>
                    </li>
                </ul>
            </div>
        </div>
    );
}
