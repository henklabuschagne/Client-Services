import { useEffect } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { toast } from 'sonner';
import { differenceInMinutes, parseISO, isToday } from 'date-fns';

export const NotificationManager = () => {
  const { actions, contacts } = useAppStore('actions', 'contacts');

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();

      actions.forEach(action => {
        if (action.completed) return;

        const dueDate = parseISO(action.dueDate);
        const minutesUntilDue = differenceInMinutes(dueDate, now);

        // Notify for actions due in 30 minutes
        if (minutesUntilDue > 0 && minutesUntilDue <= 30) {
          const contact = contacts.find(c => c.id === action.contactId);
          const notificationKey = `reminder-${action.id}-30`;
          
          if (!localStorage.getItem(notificationKey)) {
            toast.info(
              `Reminder: "${action.description}" is due in ${minutesUntilDue} minutes`,
              {
                description: contact ? `Contact: ${contact.name}` : undefined,
                duration: 10000,
              }
            );
            localStorage.setItem(notificationKey, 'shown');
          }
        }

        // Notify for overdue actions
        if (minutesUntilDue < 0 && isToday(dueDate)) {
          const contact = contacts.find(c => c.id === action.contactId);
          const notificationKey = `overdue-${action.id}`;
          
          if (!localStorage.getItem(notificationKey)) {
            toast.error(
              `Overdue: "${action.description}"`,
              {
                description: contact ? `Contact: ${contact.name}` : undefined,
                duration: 10000,
              }
            );
            localStorage.setItem(notificationKey, 'shown');
          }
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [actions, contacts]);

  return null;
};
