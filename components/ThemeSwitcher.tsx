'use client';

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { FiSun, FiMoon, FiMonitor, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import type { Theme } from '@/lib/theme';

export default function ThemeSwitcher() {
  const { theme, setTheme, activeTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes: { value: Theme; label: string; icon: JSX.Element }[] = [
    { value: 'light', label: 'Light', icon: <FiSun size={18} /> },
    { value: 'dark', label: 'Dark', icon: <FiMoon size={18} /> },
    { value: 'system', label: 'System', icon: <FiMonitor size={18} /> },
  ];

  const currentTheme = themes.find((t) => t.value === theme) || themes[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Change theme"
        title={`Theme: ${currentTheme.label}`}
      >
        <span className="text-gray-700 dark:text-gray-300">
          {currentTheme.icon}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20"
            >
              {themes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => {
                    setTheme(t.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    theme === t.value ? 'bg-gray-50 dark:bg-gray-700' : ''
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <span className="text-gray-700 dark:text-gray-300">
                      {t.icon}
                    </span>
                    <span
                      className={`dark:text-gray-200 ${
                        theme === t.value ? 'font-semibold' : ''
                      }`}
                    >
                      {t.label}
                    </span>
                  </span>
                  {theme === t.value && (
                    <FiCheck className="text-modual-purple dark:text-modual-pink" size={16} />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
