import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../config/api';
import { areIntervalsOverlapping } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

const TeamRequests = () => {
  const queryClient = useQueryClient();
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [conflictWarning, setConflictWarning] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [pagePending, setPagePending] = useState(1);
  const [pageApproved, setPageApproved] = useState(1);
  const { data: pendingResp, isLoading } = useQuery({
    queryKey: ['pending-leaves', pagePending],
    queryFn: () => api.get(`/api/leaves/pending?page=${pagePending}&limit=10`).then((res) => res.data)
  });

  const { data: approvedResp, isLoading: isLoadingApprovedLeaves } = useQuery({
    queryKey: ['approved-leaves', pageApproved],
    queryFn: () => api.get(`/api/leaves/approved?page=${pageApproved}&limit=10`).then((res) => res.data)
  });
  const pendingLeaves = pendingResp?.items || [];
  const approvedLeaves = approvedResp?.items || [];

  const mutation = useMutation({
    mutationFn: ({ id, status, rejectionReason }) =>
      api.patch(
        `/api/leaves/${id}/status`,
        { status, rejectionReason }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['approved-leaves'] });
      setSuccess('Leave request updated successfully');
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Failed to update leave request');
      setSuccess('');
    }
  });  const openDialog = (leave) => {
    setSelectedLeave(leave);
      setError('');
      setSuccess('');
    checkForConflicts(leave);
  };

  const closeDialog = () => {
    setSelectedLeave(null);
    setConflictWarning(null);
  };

  const checkForConflicts = (leave) => {
    if (!approvedLeaves) return;
    const conflictingLeave = approvedLeaves?.find(approvedLeave =>
      approvedLeave.employeeId.managerId === leave.employeeId.managerId &&
      approvedLeave._id !== leave._id &&
      areIntervalsOverlapping(
        { start: new Date(leave.startDate), end: new Date(leave.endDate) },
        { start: new Date(approvedLeave.startDate), end: new Date(approvedLeave.endDate) }
      )
    );

    if (conflictingLeave) {
      setConflictWarning(`Warning: ${conflictingLeave.employeeId.firstName} ${conflictingLeave.employeeId.lastName} is also on leave during this time.`);
    }
  };

  const handleApprove = (id) => {
    mutation.mutate({ id, status: 'approved' });
    closeDialog();
  };

  const handleReject = (id) => {
    const rejectionReason = prompt('Please provide a reason for rejection:');
    if (rejectionReason) {
      mutation.mutate({ id, status: 'rejected', rejectionReason });
    }
    closeDialog();
  };

  if (isLoading || isLoadingApprovedLeaves) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Team Requests</h1>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                {success}
              </div>
            )}
            {!isLoading && pendingLeaves?.length === 0 && (
              <div className="p-4 bg-gray-100 rounded text-gray-600 mb-4">
                No pending leave requests at the moment.
              </div>
            )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Leave Type</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingLeaves?.map((leave) => (
            <TableRow key={leave._id}>
              <TableCell>{leave.employeeId?.firstName} {leave.employeeId?.lastName}</TableCell>
              <TableCell>{new Date(leave.startDate).toLocaleDateString()}</TableCell>
              <TableCell>{new Date(leave.endDate).toLocaleDateString()}</TableCell>
              <TableCell>{leave.leaveType}</TableCell>
              <TableCell>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button onClick={() => openDialog(leave)}>View Details</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Leave Request Details</DialogTitle>
                      <DialogDescription>
                        Review the details of the leave request and approve or reject it.
                      </DialogDescription>
                    </DialogHeader>
                    {selectedLeave && (
                      <div>
                        <p><b>Employee:</b> {selectedLeave.employeeId.firstName} {selectedLeave.employeeId.lastName}</p>
                        <p><b>Dates:</b> {new Date(selectedLeave.startDate).toLocaleDateString()} - {new Date(selectedLeave.endDate).toLocaleDateString()}</p>
                        <p><b>Type:</b> {selectedLeave.leaveType}</p>
                        <p><b>Reason:</b> {selectedLeave.reason}</p>
                        {conflictWarning && <p className="text-red-500 font-bold mt-4">{conflictWarning}</p>}
                      </div>
                    )}
                    <DialogFooter>
                      <Button onClick={() => handleApprove(selectedLeave._id)} variant="outline">Approve</Button>
                      <Button onClick={() => handleReject(selectedLeave._id)} variant="destructive">Reject</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center gap-2 mt-4">
        <Button variant="outline" onClick={() => setPagePending(Math.max(1, pagePending - 1))}>Prev Pending</Button>
        <Button variant="outline" onClick={() => setPagePending(pagePending + 1)}>Next Pending</Button>
        <Button variant="outline" onClick={() => setPageApproved(Math.max(1, pageApproved - 1))}>Prev Approved</Button>
        <Button variant="outline" onClick={() => setPageApproved(pageApproved + 1)}>Next Approved</Button>
      </div>
    </div>
  );
};

export default TeamRequests;

