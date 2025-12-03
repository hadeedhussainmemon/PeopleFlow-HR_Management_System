import StatCard from '@/components/StatCard';
import LeaveCalendar from '@/components/LeaveCalendar';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../config/api';
import { Briefcase, Activity, Calendar, Clock, CheckCircle, XCircle, Coffee, PieChart as PieChartIcon, BarChart as BarChartIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's leave requests
  const { data: myLeavesResp, isLoading } = useQuery({
    queryKey: ['my-leaves'],
    queryFn: () => api.get('/api/leaves/my-leaves').then((res) => res.data)
  });

  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toCancelId, setToCancelId] = useState(null);

  const requestCancel = (leaveId) => {
    setToCancelId(leaveId);
    setConfirmOpen(true);
  };

  const performCancel = async (leaveId) => {
    try {
      await api.patch(`/api/leaves/${leaveId}/cancel`);
      queryClient.invalidateQueries(['my-leaves']);
      toast({ title: 'Cancelled', description: 'Leave request cancelled', variant: 'success' });
    } catch (error) {
      console.error('Failed to cancel leave', error);
      toast({ title: 'Cancel failed', description: error.response?.data?.message || 'Failed to cancel leave', variant: 'error' });
    }
  };

  // Fetch holidays

  // Fetch holidays
  const { data: holidaysData } = useQuery({
    queryKey: ['holidays'],
    queryFn: () => api.get('/api/holidays').then((res) => res.data)
  });

  const upcomingHolidays = holidaysData
    ?.filter(h => new Date(h.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3) || [];

  // Calculate pending requests
  const myLeaves = myLeavesResp?.items || [];
  const pendingCount = myLeaves.filter(leave => leave.status === 'pending').length || 0;
  const approvedCount = myLeaves.filter(leave => leave.status === 'approved').length || 0;
  const rejectedCount = myLeaves.filter(leave => leave.status === 'rejected').length || 0;

  const recentLeaves = myLeaves.slice(0, 5);

  // Chart Data
  const balanceData = [
    { name: 'Vacation', value: user?.leaveBalance?.vacation || 0, color: 'hsl(var(--info))' },
    { name: 'Sick', value: user?.leaveBalance?.sick || 0, color: 'hsl(var(--danger))' },
    { name: 'Casual', value: user?.leaveBalance?.casual || 0, color: 'hsl(var(--success))' },
  ].filter(d => d.value > 0);

  // Process leaves for bar chart (Leaves by Month)
  const leavesByMonth = myLeaves
    .filter(l => l.status === 'approved')
    .reduce((acc, leave) => {
      const month = new Date(leave.startDate).toLocaleString('default', { month: 'short' });
      acc[month] = (acc[month] || 0) + leave.daysCalculated;
      return acc;
    }, {});

  const barChartData = Object.entries(leavesByMonth).map(([name, days]) => ({ name, days }));

  return (
    <>
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <nav className="flex items-center gap-2" aria-label="Dashboard quick actions">
          <Button asChild size="sm"><Link to="/apply-leave">Apply For Leave</Link></Button>
          <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard?.writeText(window.location.href); toast({title:'Link copied', description:'Dashboard link copied', variant:'success'})}}>Share</Button>
        </nav>
        <div className="flex gap-3 items-center">
          <div className="text-sm text-muted-foreground">Welcome back, <strong className="text-foreground">{user?.firstName}</strong></div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.firstName}! Here's your leave overview.</p>
        </div>
        <Button asChild>
          <Link to="/apply-leave">Apply for Leave</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse glass-card">
              <CardHeader className="h-20 bg-muted/50" />
              <CardContent className="h-12 bg-muted/30" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Casual Balance"
            value={user?.leaveBalance?.casual || 0}
            icon={<Coffee className="h-4 w-4" />}
            color="blue"
          />
          <StatCard
            title="Sick Balance"
            value={user?.leaveBalance?.sick || 0}
            icon={<Activity className="h-4 w-4" />}
            color="red"
          />
          <StatCard
            title="Vacation Balance"
            value={user?.leaveBalance?.vacation || 0}
            icon={<Briefcase className="h-4 w-4" />}
            color="cyan"
          />
          <StatCard
            title="Pending Requests"
            value={pendingCount}
            icon={<Clock className="h-4 w-4" />}
            color="gray"
          />
          <StatCard
            title="Approved (Year)"
            value={approvedCount}
            icon={<CheckCircle className="h-4 w-4" />}
            color="green"
          />
        </div>
      )}

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <PieChartIcon className="h-5 w-5 text-muted-foreground" />
              Leave Balance Distribution
            </CardTitle>
            <CardDescription className="text-muted-foreground">Your remaining leave days by type.</CardDescription>
          </CardHeader>
            <CardContent className="h-[300px] border-border">
            {balanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={balanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {balanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No leave balance available.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <BarChartIcon className="h-5 w-5 text-muted-foreground" />
              Leaves Taken (Monthly)
            </CardTitle>
            <CardDescription className="text-muted-foreground">Approved leave days taken this year.</CardDescription>
          </CardHeader>
            <CardContent className="h-[300px] border-border">
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="days" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No approved leaves yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 space-y-4">
          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Recent Leave Requests</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    You have made {myLeaves.length} leave requests total.
              </CardDescription>
            </CardHeader>
              <CardContent className="overflow-x-auto border-border">
              <div className="space-y-4">
                {recentLeaves.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No leave requests found.</p>
                ) : (
                  <ul role="list" className="divide-y divide-muted/10">
                    {recentLeaves.map((leave) => (
                      <li key={leave._id} className="flex items-center gap-4 py-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/12 text-primary font-bold">{leave.leaveType?.[0]?.toUpperCase()}</div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <p className="text-sm font-semibold capitalize text-foreground">{leave.leaveType} Leave</p>
                            <p className="text-xs text-muted-foreground">• {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</p>
                          </div>
                          {leave.reason && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{leave.reason}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            leave.status === 'approved' ? 'bg-success-muted text-success-foreground' :
                            leave.status === 'rejected' ? 'bg-danger-muted text-danger-foreground' :
                            leave.status === 'cancelled' ? 'bg-muted/20 text-muted-foreground' :
                            'bg-warning-muted text-warning-foreground'
                          }`}>{leave.status}</span>
                          {leave.status === 'pending' && (
                            <Button variant="ghost" size="sm" onClick={() => requestCancel(leave._id)} title="Cancel Request" aria-label={`Cancel request for ${leave.leaveType} leave starting ${new Date(leave.startDate).toLocaleDateString()}`}>
                              <XCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="col-span-3 space-y-4">
          <LeaveCalendar />

          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Upcoming Holidays</CardTitle>
                  <CardDescription className="text-muted-foreground">Next 3 holidays.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingHolidays.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No upcoming holidays.</p>
                ) : (
                  upcomingHolidays.map((holiday) => (
                    <div key={holiday._id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{holiday.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(holiday.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Cancel Leave"
        description="Are you sure you want to cancel this pending leave request?"
        onConfirm={() => performCancel(toCancelId)}
      />
    </>
  );
};

export default Dashboard;


