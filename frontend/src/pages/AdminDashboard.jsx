import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../config/api';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, FileText, Clock, CheckCircle, XCircle, Calendar, PieChart as PieChartIcon, BarChart as BarChartIcon, Plus, Coins, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  // no edit dialog in admin dashboard (moved to Admin Users page)
  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
  const [isCreateHolidayDialogOpen, setIsCreateHolidayDialogOpen] = useState(false);
  const [isAccrueDialogOpen, setIsAccrueDialogOpen] = useState(false);
  // user management moved to dedicated Users page
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch admin settings (weekly holiday toggle)
  const { data: adminSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/api/admin/settings').then((res) => res.data),
    retry: 1,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (payload) => api.put('/api/admin/settings', payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast({ title: 'Settings updated', description: 'Admin settings saved.', variant: 'success' });
    },
    onError: (err) => {
      console.error('Update settings failed', err);
      toast({ title: 'Update failed', description: err.response?.data?.message || 'Unable to update settings', variant: 'error' });
    }
  });

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/api/users/stats/dashboard').then((res) => res.data)
  });

  const handleExport = async () => {
    try {
      const response = await api.get('/api/leaves/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leaves_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({ title: 'Export started', description: 'CSV download should begin shortly', variant: 'success' });
    } catch (error) {
      console.error('Export failed', error);
      toast({ title: 'Export failed', description: error.response?.data?.message || 'Failed to export report', variant: 'error' });
    }
  };



  // Fetch holidays
  const { data: holidays = [], isLoading: holidaysLoading } = useQuery({
    queryKey: ['admin-holidays'],
    queryFn: () => api.get('/api/holidays').then((res) => res.data)
  });

  // User management has moved to the dedicated Users page

  const createHolidayMutation = useMutation({
    mutationFn: (newHoliday) => api.post('/api/holidays', newHoliday),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-holidays'] });
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      setIsCreateHolidayDialogOpen(false);
    }
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: (holidayId) => api.delete(`/api/holidays/${holidayId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-holidays'] });
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    }
  });

  const updateHolidayMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/api/holidays/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-holidays'] });
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      setIsHolidayDialogOpen(false);
      setSelectedHoliday(null);
    }
  });

  const accrueLeavesMutation = useMutation({
    mutationFn: (data) => api.post('/api/users/accrue', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsAccrueDialogOpen(false);
      toast({ title: 'Accrual complete', description: 'Leaves accrued successfully for all users.', variant: 'success' });
    }
  });

  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleCreateHoliday = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    createHolidayMutation.mutate({
      name: formData.get('name'),
      date: formData.get('date')
    });
  };

  const handleDeleteHoliday = (holidayId) => {
    setDeleteTarget({ type: 'holiday', id: holidayId });
  };

  const handleUpdateHoliday = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    updateHolidayMutation.mutate({
      id: selectedHoliday._id,
      data: {
        name: formData.get('name'),
        date: formData.get('date')
      }
    });
  };

  const handleAccrueLeaves = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    accrueLeavesMutation.mutate({
      vacation: parseFloat(formData.get('vacation') || 0),
      sick: parseFloat(formData.get('sick') || 0),
      casual: parseFloat(formData.get('casual') || 0)
    });
  };

  // removed filteredUsers; handled in AdminUsers page

  // moved user activity logic to Users page

  // Debounce search input
  // removed user search set hooks (now in AdminUsers page)

  // Chart Data Preparation
  const leaveStatusData = [
      { name: 'Pending', value: stats?.pendingLeaves || 0, color: 'hsl(var(--warning))' },
      { name: 'Approved', value: stats?.approvedLeaves || 0, color: 'hsl(var(--success))' },
      { name: 'Rejected', value: stats?.rejectedLeaves || 0, color: 'hsl(var(--danger))' },
    ];

  // Mock data for leaves by department (in a real app, this would come from the backend)
  const departmentData = [
    { name: 'Engineering', leaves: 12 },
    { name: 'HR', leaves: 5 },
    { name: 'Sales', leaves: 8 },
    { name: 'Marketing', leaves: 4 },
  ];

  return (
    <>
    <div className="space-y-8 p-6 bg-background min-h-screen text-foreground">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage users, holidays, and monitor system statistics.</p>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex items-center gap-3 mr-2">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={!!adminSettings?.weeklyHolidayEnabled}
                onChange={() => updateSettingsMutation.mutate({ weeklyHolidayEnabled: !adminSettings?.weeklyHolidayEnabled })}
                className="h-4 w-4"
              />
              <span>Weekly Holidays (Sundays)</span>
            </label>
          </div>
          {/* Add User moved to the dedicated Users page */}
          <Button onClick={() => setIsAccrueDialogOpen(true)} variant="secondary" className="bg-primary/8 border border-primary/12">
            <Coins className="mr-2 h-4 w-4" /> Accrue Leaves
          </Button>
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
          <Button asChild variant="outline" className="ml-2">
            <Link to="/admin/users">Manage Users</Link>
          </Button>
          {/* User export moved to Users page */}
          <Button onClick={() => setIsCreateHolidayDialogOpen(true)} variant="outline">
            <Calendar className="mr-2 h-4 w-4" /> Add Holiday
          </Button>
        </div>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-info shadow-sm hover:shadow-md transition-shadow bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <span className="text-xs text-muted-foreground">{stats?.totalUsers || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-info" />
              <Button asChild variant="ghost" size="sm">
                <Link to="/admin/users">Manage</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-foreground">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Active accounts</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-warning shadow-sm hover:shadow-md transition-shadow bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle>
            <Clock className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-foreground">{stats?.pendingLeaves || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-success shadow-sm hover:shadow-md transition-shadow bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved Leaves</CardTitle>
            <CheckCircle className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-foreground">{stats?.approvedLeaves || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">This year</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-accent shadow-sm hover:shadow-md transition-shadow bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Leaves</CardTitle>
            <FileText className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-foreground">{stats?.totalLeaves || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-muted-foreground" />
              Leave Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leaveStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {leaveStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChartIcon className="h-5 w-5 text-muted-foreground" />
              Leaves by Department (Demo)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="leaves" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <div className="bg-card rounded-xl shadow-sm border p-1">
        <div className="flex gap-1 p-1 bg-muted/40 rounded-lg mb-6 w-fit">
            <button
            className={`px-6 py-2.5 text-sm font-medium rounded-md transition-all ${activeTab === 'overview' ? 'bg-muted text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('overview')}
          >
            Recent Activity
          </button>
          {/* User Management moved to Admin Users page (left nav) */}
          <button
            className={`px-6 py-2.5 text-sm font-medium rounded-md transition-all ${activeTab === 'holidays' ? 'bg-muted text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('holidays')}
          >
            Holidays
          </button>
        </div>

        <div className="p-4">
          {/* Recent Activity Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Recent Leave Requests</h3>
              <div className="rounded-md border">
                  <Table className="min-w-full">
                  <TableHeader>
                    <TableRow className="bg-muted/20">
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Days</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats?.recentLeaves?.map((leave) => (
                      <TableRow key={leave._id}>
                        <TableCell className="font-medium text-foreground">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-info-muted flex items-center justify-center text-info-foreground text-xs font-bold">
                              {leave.employeeId?.firstName?.[0]}{leave.employeeId?.lastName?.[0]}
                            </div>
                            {leave.employeeId?.firstName} {leave.employeeId?.lastName}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize text-muted-foreground">{leave.leaveType}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            leave.status === 'approved' ? 'bg-success-muted text-success-foreground' :
                            leave.status === 'rejected' ? 'bg-danger-muted text-danger-foreground' :
                            'bg-warning-muted text-warning-foreground'
                          }`}>
                            {leave.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">{leave.daysCalculated}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Mobile user cards removed - user management moved to Users page */}
              
            </div>
          )}

          {/* Users tab moved to the Admin Users page */}

          {/* Holidays Tab */}
          {activeTab === 'holidays' && (
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/10">
                      <TableHead>Holiday Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holidays.map((holiday) => (
                      <TableRow key={holiday._id}>
                        <TableCell className="font-medium">{holiday.name}</TableCell>
                        <TableCell>{new Date(holiday.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedHoliday(holiday);
                                setIsHolidayDialogOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive-foreground hover:bg-muted/40"
                              onClick={() => handleDeleteHoliday(holiday._id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>







      {/* Create Holiday Dialog */}
      <Dialog open={isCreateHolidayDialogOpen} onOpenChange={setIsCreateHolidayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Holiday</DialogTitle>
            <DialogDescription>Add a public holiday to the calendar.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateHoliday}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="holiday-name">Holiday Name</Label>
                <Input id="holiday-name" name="name" required placeholder="e.g. New Year's Day" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="holiday-date">Date</Label>
                <Input id="holiday-date" name="date" type="date" required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateHolidayDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Add Holiday</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Holiday Dialog */}
      <Dialog open={isHolidayDialogOpen} onOpenChange={setIsHolidayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Holiday</DialogTitle>
          </DialogHeader>
          {selectedHoliday && (
            <form onSubmit={handleUpdateHoliday}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-holiday-name">Holiday Name</Label>
                  <Input id="edit-holiday-name" name="name" defaultValue={selectedHoliday.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-holiday-date">Date</Label>
                  <Input 
                    id="edit-holiday-date" 
                    name="date" 
                    type="date" 
                    defaultValue={new Date(selectedHoliday.date).toISOString().split('T')[0]} 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsHolidayDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Accrue Leaves Dialog */}
      <Dialog open={isAccrueDialogOpen} onOpenChange={setIsAccrueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accrue Monthly Leaves</DialogTitle>
            <DialogDescription>Add leave balance to ALL users in the system.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAccrueLeaves}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accrue-vacation">Vacation</Label>
                  <Input id="accrue-vacation" name="vacation" type="number" step="0.5" defaultValue="1.5" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accrue-sick">Sick</Label>
                  <Input id="accrue-sick" name="sick" type="number" step="0.5" defaultValue="1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accrue-casual">Casual</Label>
                  <Input id="accrue-casual" name="casual" type="number" step="0.5" defaultValue="0" />
                </div>
              </div>
              <p className="text-sm text-warning-foreground bg-warning-muted p-2 rounded border border-warning">
                Warning: This action will add these amounts to the current balance of <strong>every user</strong> in the system.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAccrueDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Confirm Accrual</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    <ConfirmDialog
      open={!!deleteTarget}
      onOpenChange={() => setDeleteTarget(null)}
      title={deleteTarget?.type === 'holiday' ? 'Delete Holiday' : 'Confirm action'}
      description={`Are you sure you want to delete this ${deleteTarget?.type === 'holiday' ? 'holiday' : 'item'}?`}
      onConfirm={() => {
        if (!deleteTarget) return;
        if (deleteTarget.type === 'holiday') deleteHolidayMutation.mutate(deleteTarget.id);
        setDeleteTarget(null);
      }}
    />
    </>
  );
};

export default AdminDashboard;
