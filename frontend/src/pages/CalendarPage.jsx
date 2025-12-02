import LeaveCalendar from '@/components/LeaveCalendar';

const CalendarPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Calendar</h1>
        <p className="text-muted-foreground">View your leave schedule and upcoming holidays.</p>
      </div>
      <div className="h-[600px]">
        <LeaveCalendar />
      </div>
    </div>
  );
};

export default CalendarPage;
