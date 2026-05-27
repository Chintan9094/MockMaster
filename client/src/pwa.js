import { registerSW } from 'virtual:pwa-register';
import toast from 'react-hot-toast';

export function registerPWA() {
  registerSW({
    immediate: true,
    onOfflineReady() {
      toast.success('MockMaster is ready to use offline', { duration: 4000 });
    },
    onNeedRefresh() {
      toast('Update available — refresh the page to get the latest version', { duration: 6000 });
    },
    onRegisteredSW(_url, registration) {
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000);
      }
    }
  });
}
