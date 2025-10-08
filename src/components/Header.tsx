import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="flex items-center justify-between mb-8">
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.img
          src="https://photos.pinksale.finance/file/pinksale-logo-upload/1748728852106-568ed30587e3f00421764fb32cb5ba76.png"
          alt="Falco-X Logo"
          className="w-12 h-12 rounded-full"
          whileHover={{ scale: 1.1, rotate: 360 }}
          transition={{ duration: 0.8 }}
        />
        <div>
          <motion.h1
            className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Falco-X Market to Market
          </motion.h1>
          <motion.p
            className="text-gray-400 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Advanced Trading Bot | Maximize Your Profits | Lightning Fast Execution
          </motion.p>
        </div>
      </motion.div>
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <User size={16} className="text-blue-400" />
              <span className="text-sm text-gray-300">{user.email}</span>
            </div>
            <motion.button
              className="btn btn-danger flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={signOut}
            >
              <LogOut size={16} />
              Logout
            </motion.button>
          </div>
        )}
        <span className="text-sm text-gray-400">v2.0.0</span>
      </motion.div>
    </div>
  );
};

export default Header;