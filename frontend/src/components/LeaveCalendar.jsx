import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import api from '../config/api';
import { addDays, isSameDay, parseISO } from 'date-fns';

const LeaveCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch my leaves
  const { data: myLeavesResp } = useQuery({
    queryKey: ['my-leaves-calendar'],
    queryFn: () => api.get('/api/leaves/my-leaves?limit=100').then((res) => res.data)
  });

  // Fetch holidays
  const { data: holidays = [] } = useQuery({
    queryKey: ['holidays-calendar'],
    queryFn: () => api.get('/api/holidays').then((res) => res.data)
  });

  const myLeaves = myLeavesResp?.items || [];

  // Process dates for highlighting
  const getLeaveDates = (status) => {
    return myLeaves
      .filter(l => l.status === status)
      .flatMap(leave => {
        const dates = [];
        let curr = parseISO(leave.startDate);
        const end = parseISO(leave.endDate);
        while (curr <= end) {
          dates.push({
            date: new Date(curr),
            type: leave.leaveType,
            status: leave.status
          });
          curr = addDays(curr, 1);
        }
        return dates;
      });
  };

  const approvedLeaves = getLeaveDates('approved');
  const pendingLeaves = getLeaveDates('pending');

  const holidayDates = holidays.map(h => ({ date: parseISO(h.date), name: h.name }));

  const getDayClassName = (date) => {
    // Holiday
    if (holidayDates.some(h => isSameDay(h.date, date))) {
      return 'bg-danger-muted text-danger-foreground font-bold rounded-full';
    }

    // Weekly holiday: Sunday
    if (date.getDay && date.getDay() === 0) {
      return 'bg-danger-muted text-danger-foreground font-bold rounded-full';
    }
    
    // Approved Leaves
    const approved = approvedLeaves.find(l => isSameDay(l.date, date));
    if (approved) {
      if (approved.type === 'sick') return 'bg-danger-muted text-danger-foreground font-bold rounded-full';
      if (approved.type === 'casual') return 'bg-info-muted text-info-foreground font-bold rounded-full';
      return 'bg-success-muted text-success-foreground font-bold rounded-full'; // vacation
    }

    // Pending Leaves
    if (pendingLeaves.some(l => isSameDay(l.date, date))) {
      return 'bg-warning-muted text-warning-foreground font-bold rounded-full';
    }

    return undefined;
  };

  const getDayTitle = (date) => {
    const holiday = holidayDates.find(h => isSameDay(h.date, date));
    if (holiday) return `Holiday: ${holiday.name}`;
    if (date.getDay && date.getDay() === 0) return 'Weekly Holiday: Sunday';
    
    const approved = approvedLeaves.find(l => isSameDay(l.date, date));
    if (approved) return `Approved: ${approved.type.charAt(0).toUpperCase() + approved.type.slice(1)} Leave`;
    
    const pending = pendingLeaves.find(l => isSameDay(l.date, date));
    if (pending) return `Pending: ${pending.type.charAt(0).toUpperCase() + pending.type.slice(1)} Leave`;
    
    return undefined;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>My Calendar</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div className="calendar-wrapper w-full flex flex-col items-center">
          <DatePicker
            selected={null}
            onChange={() => {}}
            inline
            dayClassName={getDayClassName}
            title={getDayTitle}
            renderDayContents={(day, date) => (
              <div title={getDayTitle(date)}>{day}</div>
            )}
          />
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mt-6 w-full max-w-[280px]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-success-muted rounded-full border border-success"></div> 
              <span>Vacation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-danger-muted rounded-full border border-danger"></div> 
              <span>Sick</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-info-muted rounded-full border border-info"></div> 
              <span>Casual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-warning-muted rounded-full border border-warning"></div> 
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <div className="w-3 h-3 bg-danger-muted rounded-full border border-danger"></div> 
              <span>Holiday (Public / Sundays)</span>
            </div>
          </div>
        </div>
      </CardContent>
      <style>{`
        .react-datepicker {
          border: none;
          font-family: inherit;
        }
        .react-datepicker__header {
          background-color: transparent;
          border-bottom: none;
        }
        .react-datepicker__day--keyboard-selected {
          background-color: transparent;
          color: inherit;
        }
        .react-datepicker__day:hover {
          border-radius: 50%;
        }
      `}</style>
    </Card>
  );
};

export default LeaveCalendar;
