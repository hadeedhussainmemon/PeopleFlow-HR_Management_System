import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../config/api';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Download, Calendar, Coins } from 'lucide-react';

const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [createRole, setCreateRole] = useState('employee');
  const [editRole, setEditRole] = useState('employee');
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [roleFilter, setRoleFilter] = useState('all');

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: managersList } = useQuery({
    queryKey: ['managers-list'],
    queryFn: () => api.get('/api/users?page=1&limit=100&role=manager').then(res => res.data.items || []),
    retry: 0
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', userPage, searchTerm, roleFilter, sortKey, sortOrder],
    queryFn: () => api.get(`/api/users?page=${userPage}&limit=10&search=${searchTerm}&role=${roleFilter === 'all' ? '' : roleFilter}&sort=${sortKey}&order=${sortOrder}`).then((res) => res.data)
  });

  const users = usersData?.items || [];
  const totalPages = usersData?.pages || 1;

  const createUserMutation = useMutation({
    mutationFn: (newUser) => api.post('/api/users', newUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setIsCreateUserDialogOpen(false);
      setCreateRole('employee');
      toast({ title: 'User created', description: 'New user created successfully', variant: 'success' });
    }
    ,
    onError: (err) => {
      toast({ title: 'Create failed', description: err.response?.data?.message || 'Unable to create user', variant: 'error' });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => api.delete(`/api/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast({ title: 'User deleted', description: 'User has been removed', variant: 'success' });
    }
    ,
    onError: (err) => {
      toast({ title: 'Delete failed', description: err.response?.data?.message || 'Unable to delete user', variant: 'error' });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/api/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'User updated', description: 'User details saved successfully', variant: 'success' });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      setEditRole('employee');
    }
    ,
    onError: (err) => {
      toast({ title: 'Update failed', description: err.response?.data?.message || 'Unable to update user', variant: 'error' });
    }
  });

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchTerm(searchInput);
      setUserPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => setUserPage(1), [roleFilter, sortKey, sortOrder]);

  useEffect(() => {
    if (selectedUser) setEditRole(selectedUser.role || 'employee');
  }, [selectedUser]);

  const handleCreateUser = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    createUserMutation.mutate({
      firstName: f.get('firstName'),
      lastName: f.get('lastName'),
      email: f.get('email'),
      password: f.get('password'),
      role: createRole || f.get('role') || 'employee',
      department: f.get('department')
    });
  };

  const [deleteTarget, setDeleteTarget] = useState(null);

  return (
    <div className="space-y-8 p-6 bg-background min-h-screen text-foreground">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin-dashboard" className="text-sm text-muted-foreground hover:text-foreground">Admin Dashboard</Link>
          <span className="text-sm text-muted-foreground">/</span>
          <h1 className="text-3xl font-bold">Users</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/admin-dashboard">Back</Link>
          </Button>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Users</h1>
        <div className="flex gap-2">
          <Button className="bg-primary text-primary-foreground" onClick={() => setIsCreateUserDialogOpen(true)}><Plus className="mr-2"/>Add User</Button>
          <Button variant="outline" onClick={async () => {
            try {
              const rows = [['ID','First Name','Last Name','Email','Role','Department','Manager','V','S','C','Created At']];
              users.forEach(u => rows.push([u._id, u.firstName, u.lastName, u.email, u.role, u.department || '-', u.managerId ? `${u.managerId.firstName} ${u.managerId.lastName}` : '-', u.leaveBalance?.vacation || 0, u.leaveBalance?.sick || 0, u.leaveBalance?.casual || 0, new Date(u.createdAt).toISOString()]));
              const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link); link.click(); link.remove();
              toast({ title: 'Export started', description: 'CSV download should begin shortly', variant: 'success' });
            } catch (err) { toast({ title: 'Export failed', description: 'Unable to export users list', variant: 'error' }); }
          }}><Download className="mr-2"/>Export</Button>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <Input placeholder="Search users by name, email, or department..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full max-w-md" />
        <Select value={sortKey} onValueChange={(val) => setSortKey(val)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Created</SelectItem>
            <SelectItem value="firstName">First Name</SelectItem>
            <SelectItem value="role">Role</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>{sortOrder === 'asc' ? 'Asc' : 'Desc'}</Button>
        <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="employee">Employees</SelectItem>
            <SelectItem value="manager">Managers</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/10">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Leave Balance</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell><div className="font-medium">{user.firstName} {user.lastName}<div className="text-xs text-muted-foreground">{user.email}</div></div></TableCell>
                <TableCell><span className="capitalize bg-muted/20 px-2 py-1 rounded text-xs font-medium text-muted-foreground">{user.role}</span></TableCell>
                <TableCell>{user.department || '-'}</TableCell>
                <TableCell>
                  <Select value={user.managerId?._id || ''} disabled={updatingUserId === user._id} onValueChange={(val) => {
                      setUpdatingUserId(user._id);
                      updateUserMutation.mutate({ id: user._id, data: { managerId: val || null } }, {
                        onSuccess: () => setUpdatingUserId(null),
                        onError: () => setUpdatingUserId(null),
                      });
                    }}>
                    <SelectTrigger><SelectValue>{user.managerId ? `${user.managerId.firstName} ${user.managerId.lastName}` : 'Unassigned'}</SelectValue></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {managersList?.map(m => (<SelectItem value={m._id} key={m._id}>{m.firstName} {m.lastName}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 text-sm"><span className="text-info-foreground font-medium">{user.leaveBalance?.vacation || 0}</span> <span className="text-muted-foreground">|</span> <span className="text-destructive-foreground font-medium">{user.leaveBalance?.sick || 0}</span> <span className="text-muted-foreground">|</span> <span className="text-success-foreground font-medium">{user.leaveBalance?.casual || 0}</span></div>
                </TableCell>
                <TableCell><div className="text-sm text-muted-foreground">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '-'}</div></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(user); setIsEditDialogOpen(true); }}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-destructive-foreground hover:bg-muted/40" onClick={() => setDeleteTarget({ type: 'user', id: user._id })}>Delete</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" size="sm" onClick={() => setUserPage(Math.max(1, userPage - 1))} disabled={userPage === 1}>Previous</Button>
        <span className="text-sm text-muted-foreground">Page {userPage} of {totalPages}</span>
        <Button variant="outline" size="sm" onClick={() => setUserPage(Math.min(totalPages, userPage + 1))} disabled={userPage === totalPages}>Next</Button>
      </div>

      {/* dialogs and confirm */}
      <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>Add a new employee to the system.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="firstName">First Name</Label><Input id="firstName" name="firstName" required /></div>
                <div className="space-y-2"><Label htmlFor="lastName">Last Name</Label><Input id="lastName" name="lastName" required /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
              <div className="space-y-2"><Label htmlFor="password">Initial Password</Label><Input id="password" name="password" type="password" required minLength={6} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={createRole} onValueChange={(val) => setCreateRole(val)}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <input type="hidden" name="role" value={createRole} />
                </div>
                <div className="space-y-2"><Label htmlFor="department">Department</Label><Input id="department" name="department" /></div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateUserDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Create User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {selectedUser && (
                    <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.target); updateUserMutation.mutate({ id: selectedUser._id, data: { firstName: f.get('firstName'), lastName: f.get('lastName'), email: f.get('email'), role: editRole || f.get('role'), department: f.get('department'), leaveBalance: { sick: parseInt(f.get('sick')), casual: parseInt(f.get('casual')), vacation: parseInt(f.get('vacation')) } } }); }}>
              <div className="grid gap-4 py-4"> 
                <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="edit-firstName">First Name</Label><Input id="edit-firstName" name="firstName" defaultValue={selectedUser.firstName} /></div><div className="space-y-2"><Label htmlFor="edit-lastName">Last Name</Label><Input id="edit-lastName" name="lastName" defaultValue={selectedUser.lastName} /></div></div>
                <div className="space-y-2"><Label htmlFor="edit-email">Email</Label><Input id="edit-email" name="email" defaultValue={selectedUser.email} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-role">Role</Label>
                    <Select value={editRole} onValueChange={(val) => setEditRole(val)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <input type="hidden" name="role" value={editRole} />
                  </div>
                  <div className="space-y-2"><Label htmlFor="edit-department">Department</Label><Input id="edit-department" name="department" defaultValue={selectedUser.department} /></div>
                </div>
                <div className="border-t pt-4 mt-2"><Label className="mb-2 block text-sm font-semibold text-muted-foreground">Leave Balance Adjustment</Label><div className="grid grid-cols-3 gap-4"><div className="space-y-2"><Label htmlFor="vacation" className="text-xs text-muted-foreground">Vacation</Label><Input id="vacation" name="vacation" type="number" defaultValue={selectedUser.leaveBalance?.vacation || 0} /></div><div className="space-y-2"><Label htmlFor="sick" className="text-xs text-muted-foreground">Sick</Label><Input id="sick" name="sick" type="number" defaultValue={selectedUser.leaveBalance?.sick || 0} /></div><div className="space-y-2"><Label htmlFor="casual" className="text-xs text-muted-foreground">Casual</Label><Input id="casual" name="casual" type="number" defaultValue={selectedUser.leaveBalance?.casual || 0} /></div></div></div>
              </div>
              <DialogFooter><Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button><Button type="submit">Save Changes</Button></DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title={deleteTarget?.type === 'user' ? 'Delete User' : ''} description={`Are you sure you want to delete this user?`} onConfirm={() => { if (!deleteTarget) return; if (deleteTarget.type === 'user') deleteUserMutation.mutate(deleteTarget.id); setDeleteTarget(null); }} />
    </div>
  );
};

export default AdminUsers;
