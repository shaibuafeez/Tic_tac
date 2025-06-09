'use client';

import { usePendingInvites } from '@/hooks/usePendingInvites';
import { useRouter } from 'next/navigation';
import { Mail } from 'lucide-react';

interface InviteBadgeProps {
  showBadgeOnly?: boolean;
}

export function InviteBadge({ showBadgeOnly = false }: InviteBadgeProps) {
  const { pendingCount } = usePendingInvites();
  const router = useRouter();

  const handleClick = () => {
    router.push("/invites");
  };

  if (showBadgeOnly) {
    return pendingCount > 0 ? (
      <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
        {pendingCount > 9 ? '9+' : pendingCount}
      </span>
    ) : null;
  }

  return (
    <button
      onClick={handleClick}
      className="relative p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
      title={`${pendingCount} pending game invites`}
    >
      <Mail className="w-5 h-5" />
      {pendingCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {pendingCount > 9 ? '9+' : pendingCount}
        </span>
      )}
    </button>
  );
}