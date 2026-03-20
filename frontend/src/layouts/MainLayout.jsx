import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

/**
 * MainLayout — master shell wrapping Sidebar + Navbar + animated main content
 */
const MainLayout = ({ currentTab, onTabChange, anomalyCount, children }) => (
  <div className="app-layout">
    <Sidebar
      currentTab={currentTab}
      onTabChange={onTabChange}
      anomalyCount={anomalyCount}
    />
    <Navbar />
    <main className="main-area" style={{ background: 'var(--bg-primary)' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTab}
          initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          style={{ height: '100%' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </main>
  </div>
);

export default MainLayout;
