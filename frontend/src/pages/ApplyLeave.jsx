import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../config/api';
import { calculateBusinessDays } from '../utils/dateCalculator';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const ApplyLeave = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [leaveType, setLeaveType] = useState('casual');
  const [reason, setReason] = useState('');
  const [deductedDays, setDeductedDays] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch latest user data to ensure balance is up-to-date
  const { data: freshUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.get('/api/auth/me').then(res => res.data),
    initialData: user
  });
  
  const currentUser = freshUser || user;

  // Fetch holidays for calculation
  const { data: holidaysData = [] } = useQuery({
    queryKey: ['holidays'],
    queryFn: () => api.get('/api/holidays').then((res) => res.data)
  });
  const holidays = holidaysData || [];

  useEffect(() => {
    if (startDate && endDate) {
      const days = calculateBusinessDays(startDate, endDate, holidays);
      setDeductedDays(days);
    } else {
      setDeductedDays(0);
    }
  }, [startDate, endDate, holidays]);

  const mutation = useMutation({
    mutationFn: (newLeave) => api.post('/api/leaves/apply', newLeave),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['pending-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] }); // Refresh balance
      setSuccess('Leave request submitted successfully!');
      setError('');
      setStartDate(null);
      setEndDate(null);
      setReason('');
      setDeductedDays(0);
      setTimeout(() => setSuccess(''), 5000);
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to submit leave request');
      setSuccess('');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }
    if (endDate < startDate) {
      setError('End date must be after start date');
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate < today) {
      setError('Start date cannot be in the past');
      return;
    }
    if (deductedDays === 0) {
      setError('Selected dates contain no working days');
      return;
    }
    const currentBalance = currentUser?.leaveBalance?.[leaveType] || 0;
    if (deductedDays > currentBalance) {
      setError(`Insufficient balance. You have ${currentBalance} ${leaveType} days remaining.`);
      return;
    }

    mutation.mutate({ startDate, endDate, leaveType, reason });
  };

  const getBalanceForType = (type) => currentUser?.leaveBalance?.[type] || 0;

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Apply for Leave</CardTitle>
          <CardDescription>Fill out the form below to apply for leave.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-700/30 text-red-300 rounded">{error}</div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-900/20 border border-green-700/30 text-green-300 rounded">{success}</div>
            )}
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="leaveType">Leave Type</Label>
                <Select onValueChange={setLeaveType} defaultValue={leaveType}>
                  <SelectTrigger id="leaveType">
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="casual">Casual ({getBalanceForType('casual')} days)</SelectItem>
                    <SelectItem value="sick">Sick ({getBalanceForType('sick')} days)</SelectItem>
                    <SelectItem value="vacation">Vacation ({getBalanceForType('vacation')} days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="startDate">Start Date</Label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  className="w-full"
                  customInput={<Input />}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="endDate">End Date</Label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  className="w-full"
                  customInput={<Input />}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="reason">Reason</Label>
                <Textarea id="reason" placeholder="Enter a reason for your leave" value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
              <div className="text-sm text-muted-foreground">You have selected {deductedDays} working days.</div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">Apply</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ApplyLeave;