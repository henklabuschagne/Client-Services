import { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '../components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { format, isSameDay, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { useNavigate } from 'react-router';

export const CalendarView = () => {
  const { actions, contacts } = useAppStore('actions', 'contacts');
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const getActionsForDate = (date: Date) => {
    return actions.filter(action => 
      !action.completed && isSameDay(parseISO(action.dueDate), date)
    );
  };

  const getDaysWithActions = () => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const actionsInMonth = actions.filter(action => {
      if (action.completed) return false;
      const actionDate = parseISO(action.dueDate);
      return actionDate >= monthStart && actionDate <= monthEnd;
    });

    return actionsInMonth.map(action => parseISO(action.dueDate));
  };

  const selectedDateActions = selectedDate ? getActionsForDate(selectedDate) : [];
  const daysWithActions = getDaysWithActions();

  const getContactById = (id: string) => contacts.find(c => c.id === id);

  const getActionIcon = (type: string) => {
    const icons: Record<string, string> = {
      call: '📞',
      email: '✉️',
      meeting: '📅',
      task: '✅',
      'follow-up': '🔄',
    };
    return icons[type] || '📋';
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl mb-2">Calendar View</h1>
          <p className="text-muted-foreground">View and manage your scheduled actions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Action Calendar</CardTitle>
              <CardDescription>Select a date to view scheduled actions</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={{
                  hasActions: daysWithActions,
                }}
                modifiersStyles={{
                  hasActions: {
                    fontWeight: 'bold',
                    backgroundColor: '#dbeafe',
                    borderRadius: '50%',
                  },
                }}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* Actions for Selected Date */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select a date'}
              </CardTitle>
              <CardDescription>
                {selectedDateActions.length} action{selectedDateActions.length !== 1 ? 's' : ''} scheduled
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDateActions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm">No actions scheduled for this date</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateActions.map((action) => {
                    const contact = getContactById(action.contactId);
                    if (!contact) return null;

                    return (
                      <div
                        key={action.id}
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/contacts/${contact.id}`)}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <span className="text-xl">{getActionIcon(action.type)}</span>
                          <div className="flex-1 min-w-0">
                            <Badge variant="outline" className="mb-1 text-xs">
                              {action.type}
                            </Badge>
                            <p className="text-sm font-medium line-clamp-2">
                              {action.description}
                            </p>
                          </div>
                        </div>
                        <div className="ml-7">
                          <p className="text-xs text-gray-600 mb-1">{contact.name}</p>
                          <p className="text-xs text-blue-600">
                            {format(parseISO(action.dueDate), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Actions List */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>All Upcoming Actions</CardTitle>
            <CardDescription>Actions scheduled for this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {daysWithActions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No upcoming actions this month</p>
                </div>
              ) : (
                actions
                  .filter(a => !a.completed)
                  .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                  .slice(0, 10)
                  .map((action) => {
                    const contact = getContactById(action.contactId);
                    if (!contact) return null;

                    return (
                      <div
                        key={action.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/contacts/${contact.id}`)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-2xl">{getActionIcon(action.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{action.description}</p>
                            <p className="text-sm text-gray-600">
                              {contact.name} • {contact.company}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="text-sm font-medium">
                            {format(parseISO(action.dueDate), 'MMM d')}
                          </p>
                          <p className="text-xs text-gray-600">
                            {format(parseISO(action.dueDate), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};