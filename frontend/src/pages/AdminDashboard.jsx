import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../config/api';
import { Button } from '@/components/ui/button';
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
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
  const [isCreateHolidayDialogOpen, setIsCreateHolidayDialogOpen] = useState(false);
  const [isAccrueDialogOpen, setIsAccrueDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userPage, setUserPage] = useState(1);
  
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

  // Fetch users with pagination
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', userPage, searchTerm],
    queryFn: () => api.get(`/api/users?page=${userPage}&limit=10&search=${searchTerm}`).then((res) => res.data)
  });

  // Fetch holidays
  const { data: holidays = [], isLoading: holidaysLoading } = useQuery({
    queryKey: ['admin-holidays'],
    queryFn: () => api.get('/api/holidays').then((res) => res.data)
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (newUser) => api.post('/api/users', newUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setIsCreateUserDialogOpen(false);
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => api.delete(`/api/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/api/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    }
  });

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

  // Handlers
  const handleCreateUser = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    createUserMutation.mutate({
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      password: formData.get('password'),
      role: formData.get('role'),
      department: formData.get('department'),
    });
  };

  const [deleteTarget, setDeleteTarget] = useState(null);
  const handleDeleteUser = (userId) => {
    setDeleteTarget({ type: 'user', id: userId });
  };

  const handleUpdateUser = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    updateUserMutation.mutate({
      id: selectedUser._id,
      data: {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        role: formData.get('role'),
        department: formData.get('department'),
        leaveBalance: {
          sick: parseInt(formData.get('sick')),
          casual: parseInt(formData.get('casual')),
          vacation: parseInt(formData.get('vacation'))
        }
      }
    });
  };

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

  const users = usersData?.items || [];
  const totalPages = usersData?.pages || 1;

  // Chart Data Preparation
  const leaveStatusData = [
    { name: 'Pending', value: stats?.pendingLeaves || 0, color: '#EAB308' },
    { name: 'Approved', value: stats?.approvedLeaves || 0, color: '#22C55E' },
    { name: 'Rejected', value: stats?.rejectedLeaves || 0, color: '#EF4444' },
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
    <div className="space-y-8 p-6 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-2">Manage users, holidays, and monitor system statistics.</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-3 mr-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={!!adminSettings?.weeklyHolidayEnabled}
                onChange={() => updateSettingsMutation.mutate({ weeklyHolidayEnabled: !adminSettings?.weeklyHolidayEnabled })}
                className="h-4 w-4"
              />
              <span>Weekly Holidays (Sundays)</span>
            </label>
          </div>
          <Button onClick={() => setIsCreateUserDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> Add User
          </Button>
          <Button onClick={() => setIsAccrueDialogOpen(true)} variant="secondary">
            <Coins className="mr-2 h-4 w-4" /> Accrue Leaves
          </Button>
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
          <Button onClick={() => setIsCreateHolidayDialogOpen(true)} variant="outline">
            <Calendar className="mr-2 h-4 w-4" /> Add Holiday
          </Button>
        </div>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Active accounts</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Requests</CardTitle>
            <Clock className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-gray-900">{stats?.pendingLeaves || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Requires attention</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Approved Leaves</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-gray-900">{stats?.approvedLeaves || 0}</div>
            <p className="text-xs text-gray-500 mt-1">This year</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Leaves</CardTitle>
            <FileText className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-gray-900">{stats?.totalLeaves || 0}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-gray-500" />
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
              <BarChartIcon className="h-5 w-5 text-gray-500" />
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
                <Bar dataKey="leaves" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <div className="bg-white rounded-xl shadow-sm border p-1">
        <div className="flex gap-1 p-1 bg-gray-100/50 rounded-lg mb-6 w-fit">
          <button
            className={`px-6 py-2.5 text-sm font-medium rounded-md transition-all ${activeTab === 'overview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('overview')}
          >
            Recent Activity
          </button>
          <button
            className={`px-6 py-2.5 text-sm font-medium rounded-md transition-all ${activeTab === 'users' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('users')}
          >
            User Management
          </button>
          <button
            className={`px-6 py-2.5 text-sm font-medium rounded-md transition-all ${activeTab === 'holidays' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('holidays')}
          >
            Holidays
          </button>
        </div>

        <div className="p-4">
          {/* Recent Activity Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Leave Requests</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
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
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                              {leave.employeeId?.firstName?.[0]}{leave.employeeId?.lastName?.[0]}
                            </div>
                            {leave.employeeId?.firstName} {leave.employeeId?.lastName}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize text-gray-600">{leave.leaveType}</TableCell>
                        <TableCell className="text-gray-600">
                          {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                            leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
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
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Leave Balance (V/S/C)</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.firstName} {user.lastName}</span>
                            <span className="text-xs text-gray-500">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-700">
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>{user.department || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2 text-sm">
                            <span className="text-blue-600 font-medium" title="Vacation">{user.leaveBalance?.vacation || 0}</span>
                            <span className="text-gray-300">|</span>
                            <span className="text-red-600 font-medium" title="Sick">{user.leaveBalance?.sick || 0}</span>
                            <span className="text-gray-300">|</span>
                            <span className="text-green-600 font-medium" title="Casual">{user.leaveBalance?.casual || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteUser(user._id)}
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
              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUserPage(Math.max(1, userPage - 1))}
                  disabled={userPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">Page {userPage} of {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUserPage(Math.min(totalPages, userPage + 1))}
                  disabled={userPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Holidays Tab */}
          {activeTab === 'holidays' && (
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
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
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

      {/* Create User Dialog */}
      <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>Add a new employee to the system. They will receive an email with login details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" name="firstName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" name="lastName" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Initial Password</Label>
                <Input id="password" name="password" type="password" required minLength={6} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select name="role" defaultValue="employee">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" name="department" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateUserDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Create User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details and leave balances.</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <form onSubmit={handleUpdateUser}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-firstName">First Name</Label>
                    <Input id="edit-firstName" name="firstName" defaultValue={selectedUser.firstName} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-lastName">Last Name</Label>
                    <Input id="edit-lastName" name="lastName" defaultValue={selectedUser.lastName} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" name="email" type="email" defaultValue={selectedUser.email} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-role">Role</Label>
                    <Select name="role" defaultValue={selectedUser.role}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-department">Department</Label>
                    <Input id="edit-department" name="department" defaultValue={selectedUser.department} />
                  </div>
                </div>
                
                <div className="border-t pt-4 mt-2">
                  <Label className="mb-2 block text-sm font-semibold text-gray-900">Leave Balance Adjustment</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vacation" className="text-xs text-gray-500">Vacation</Label>
                      <Input id="vacation" name="vacation" type="number" defaultValue={selectedUser.leaveBalance?.vacation || 0} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sick" className="text-xs text-gray-500">Sick</Label>
                      <Input id="sick" name="sick" type="number" defaultValue={selectedUser.leaveBalance?.sick || 0} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="casual" className="text-xs text-gray-500">Casual</Label>
                      <Input id="casual" name="casual" type="number" defaultValue={selectedUser.leaveBalance?.casual || 0} />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

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
              <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200">
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
      title={deleteTarget?.type === 'user' ? 'Delete User' : 'Delete Holiday'}
      description={`Are you sure you want to delete this ${deleteTarget?.type === 'user' ? 'user' : 'holiday'}?`}
      onConfirm={() => {
        if (!deleteTarget) return;
        if (deleteTarget.type === 'user') deleteUserMutation.mutate(deleteTarget.id);
        if (deleteTarget.type === 'holiday') deleteHolidayMutation.mutate(deleteTarget.id);
        setDeleteTarget(null);
      }}
    />
    </>
  );
};

export default AdminDashboard;
