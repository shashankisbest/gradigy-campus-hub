import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Calendar } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const Timetable = () => {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [day, setDay] = useState('Monday');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [subject, setSubject] = useState('');

  const { data: timetable, isLoading } = useQuery({
    queryKey: ['timetable'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timetable')
        .select('*, profiles(full_name)')
        .order('day')
        .order('start_time');
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newEntry: { day: string; start_time: string; end_time: string; subject: string }) => {
      const { error } = await supabase.from('timetable').insert({
        ...newEntry,
        faculty_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
      toast.success('Class added successfully');
      setIsDialogOpen(false);
      setDay('Monday');
      setStartTime('');
      setEndTime('');
      setSubject('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add class');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('timetable').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
      toast.success('Class deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete class');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!day || !startTime || !endTime || !subject) {
      toast.error('Please fill in all fields');
      return;
    }

    // Calculate end time with 15-minute break
    const [hours, minutes] = endTime.split(':').map(Number);
    const endDate = new Date();
    endDate.setHours(hours, minutes + 15, 0);
    const adjustedEndTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

    createMutation.mutate({
      day,
      start_time: startTime,
      end_time: adjustedEndTime,
      subject,
    });
  };

  const groupedTimetable = DAYS.reduce((acc, day) => {
    acc[day] = timetable?.filter(entry => entry.day === day) || [];
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Timetable</h1>
            <p className="text-muted-foreground text-lg">
              {userRole === 'faculty' ? 'Manage class schedules' : 'View your class schedule'}
            </p>
          </div>
          
          {userRole === 'faculty' && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-[var(--shadow-soft)]">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Class
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Class</DialogTitle>
                  <DialogDescription>Schedule a new class (15-min break will be added automatically)</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="day">Day</Label>
                    <Select value={day} onValueChange={setDay}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-time">End Time (before break)</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., Mathematics"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Adding...' : 'Add Class'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : timetable && timetable.length > 0 ? (
          <div className="space-y-6">
            {DAYS.map((day) => {
              const dayClasses = groupedTimetable[day];
              if (dayClasses.length === 0) return null;
              
              return (
                <Card key={day} className="shadow-[var(--shadow-soft)]">
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-bold mb-4 flex items-center">
                      <Calendar className="w-6 h-6 mr-2 text-secondary" />
                      {day}
                    </h2>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Faculty</TableHead>
                          {userRole === 'faculty' && <TableHead className="w-[50px]"></TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dayClasses.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="font-medium">
                              {entry.start_time} - {entry.end_time}
                            </TableCell>
                            <TableCell>{entry.subject}</TableCell>
                            <TableCell>{entry.profiles?.full_name || 'Unknown'}</TableCell>
                            {userRole === 'faculty' && entry.faculty_id === user?.id && (
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteMutation.mutate(entry.id)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="shadow-[var(--shadow-soft)]">
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No classes scheduled yet</p>
              {userRole === 'faculty' && (
                <p className="text-sm text-muted-foreground mt-2">Click "Add Class" to create one</p>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Timetable;
