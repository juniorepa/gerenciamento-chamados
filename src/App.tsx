/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginScreen } from './components/LoginScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { TicketDetailsScreen } from './components/TicketDetailsScreen';
import { ResolveScreen } from './components/ResolveScreen';
import { NewTicketScreen } from './components/NewTicketScreen';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { activeScreen } = useApp();

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'login':
        return <LoginScreen key="login" />;
      case 'dashboard':
        return <DashboardScreen key="dashboard" />;
      case 'ticket-details':
        return <TicketDetailsScreen key="ticket-details" />;
      case 'resolve':
        return <ResolveScreen key="resolve" />;
      case 'new-ticket':
        return <NewTicketScreen key="new-ticket" />;
      default:
        return <LoginScreen key="login" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] relative selection:bg-blue-150 selection:text-blue-900">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeScreen}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="min-h-screen"
        >
          {renderActiveScreen()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
