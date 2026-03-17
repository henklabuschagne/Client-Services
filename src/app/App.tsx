import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { NotificationManager } from './components/NotificationManager';

export default function App() {
  return (
    <>
      <NotificationManager />
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </>
  );
}
