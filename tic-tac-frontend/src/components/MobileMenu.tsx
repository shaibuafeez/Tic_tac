'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Trophy, Shield, Bell, Mail } from 'lucide-react';
import { ConnectButton, useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { NotificationBadge } from './NotificationBadge';
import { InviteBadge } from './InviteBadge';
import { useLanguage } from '@/hooks/useLanguage';
import { CONTRACT_CONFIG } from '@/config/constants';
import Link from 'next/link';

export function MobileMenu() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const [hasAdminCap, setHasAdminCap] = useState(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!account) {
        setHasAdminCap(false);
        return;
      }

      try {
        const { data } = await suiClient.getOwnedObjects({
          owner: account.address,
          filter: {
            StructType: `${CONTRACT_CONFIG.PACKAGE_ID}::tic_tac::AdminCap`,
          },
        });

        setHasAdminCap(data.length > 0);
      } catch (error) {
        console.error("Error checking admin access:", error);
        setHasAdminCap(false);
      }
    };

    checkAdminAccess();
  }, [account, suiClient]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isOpen && !target.closest('.mobile-menu')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="mobile-menu relative">
      {/* Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-black" />
        ) : (
          <Menu className="w-5 h-5 text-black" />
        )}
      </button>

      {/* Menu Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 animate-fade-in">
          <div className="p-2">
            {/* Wallet Connect */}
            <div className="mb-2 px-2 py-3 border-b border-gray-100">
              <ConnectButton />
            </div>

            {/* Menu Items */}
            <div className="space-y-1">
              <Link
                href="/leaderboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Trophy className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-black">{t("leaderboard")}</span>
              </Link>

              <Link
                href="/pending"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Bell className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-black">{t("notifications")}</span>
                <NotificationBadge showBadgeOnly />
              </Link>

              <Link
                href="/invites"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Mail className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-black">Game Invites</span>
                <InviteBadge showBadgeOnly />
              </Link>

              {hasAdminCap && (
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Shield className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-black">{t("admin")}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}