import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';

const TermsModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('termsAccepted');
    if (!accepted) {
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('termsAccepted', 'true');
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-slate-800/90 backdrop-blur-xl rounded-xl border border-slate-700/50 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="text-indigo-400" size={32} />
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Terms of Use & Conditions
                </h2>
              </div>

              <div className="space-y-6 text-gray-300">
                <section>
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-amber-500" />
                    Important Notice
                  </h3>
                  <p>
                    By using the Falco-X Market to Market trading bot ("the Bot"), you acknowledge and agree to the following terms and conditions. Please read them carefully before proceeding.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-white mb-2">1. Risk Disclaimer</h4>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Cryptocurrency trading involves substantial risk and may result in the loss of your invested capital.</li>
                    <li>Past performance does not guarantee future results.</li>
                    <li>You should not invest more than you can afford to lose.</li>
                    <li>Falco-X is not responsible for any losses incurred while using the Bot.</li>
                  </ul>
                </section>

                <section>
                  <h4 className="font-semibold text-white mb-2">2. Data Storage & Security</h4>
                  <ul className="list-disc list-inside space-y-2">
                    <li>All Bot configurations and wallet data are stored locally in your browser's storage.</li>
                    <li>No data is transmitted to or stored on Falco-X servers.</li>
                    <li>You are responsible for maintaining the security of your browser and device.</li>
                    <li>We strongly recommend using a dedicated wallet for bot trading.</li>
                  </ul>
                </section>

                <section>
                  <h4 className="font-semibold text-white mb-2">3. User Responsibilities</h4>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Maintain an active internet connection and keep your browser window open for uninterrupted trading.</li>
                    <li>Regularly backup your configurations and wallet data.</li>
                    <li>Monitor your trading activities and adjust parameters as needed.</li>
                    <li>Comply with all applicable laws and regulations in your jurisdiction.</li>
                  </ul>
                </section>

                <section>
                  <h4 className="font-semibold text-white mb-2">4. Limitation of Liability</h4>
                  <p>
                    Falco-X and its affiliates shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use the Bot, including but not limited to:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-2">
                    <li>Trading losses or missed opportunities</li>
                    <li>Network or connection issues</li>
                    <li>Browser or device malfunctions</li>
                    <li>Data loss or security breaches</li>
                  </ul>
                </section>

                <section>
                  <h4 className="font-semibold text-white mb-2">5. Technical Requirements</h4>
                  <ul className="list-disc list-inside space-y-2">
                    <li>A modern web browser with local storage enabled</li>
                    <li>Stable internet connection</li>
                    <li>Sufficient device resources to run the Bot continuously</li>
                  </ul>
                </section>

                <div className="mt-8 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={hasAccepted}
                    onChange={(e) => setHasAccepted(e.target.checked)}
                    className="mt-1"
                  />
                  <label htmlFor="acceptTerms" className="text-sm">
                    I have read, understood, and agree to the Terms of Use & Conditions. I acknowledge the risks involved in cryptocurrency trading and understand that I am solely responsible for my trading decisions.
                  </label>
                </div>
              </div>

              <motion.button
                className="w-full mt-6 btn bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAccept}
                disabled={!hasAccepted}
              >
                <CheckCircle2 size={20} />
                Accept & Continue
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TermsModal;