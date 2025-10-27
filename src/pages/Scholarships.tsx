import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, ExternalLink, Trash2, Award } from 'lucide-react';

const Scholarships = () => {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');

  const { data: scholarships, isLoading } = useQuery({
    queryKey: ['scholarships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scholarships')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newScholarship: { name: string; description: string; link: string }) => {
      const { error } = await supabase.from('scholarships').insert({
        ...newScholarship,
        added_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scholarships'] });
      toast.success('Scholarship added successfully');
      setIsDialogOpen(false);
      setName('');
      setDescription('');
      setLink('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add scholarship');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('scholarships').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scholarships'] });
      toast.success('Scholarship deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete scholarship');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !link) {
      toast.error('Please fill in all fields');
      return;
    }
    createMutation.mutate({ name, description, link });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Scholarships</h1>
            <p className="text-muted-foreground text-lg">
              {userRole === 'faculty' ? 'Manage scholarship opportunities' : 'Discover funding opportunities'}
            </p>
          </div>
          
          {userRole === 'faculty' && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-[var(--shadow-soft)]">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Scholarship
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Scholarship</DialogTitle>
                  <DialogDescription>Share scholarship opportunities with students</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Merit Scholarship 2025"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Details about eligibility, amount, and deadlines"
                      rows={4}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="link">Application Link *</Label>
                    <Input
                      id="link"
                      type="url"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="https://example.com/apply"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Adding...' : 'Add Scholarship'}
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
        ) : scholarships && scholarships.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {scholarships.map((scholarship) => (
              <Card key={scholarship.id} className="shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="bg-accent/10 p-2 rounded-lg">
                      <Award className="w-5 h-5 text-accent" />
                    </div>
                    {userRole === 'faculty' && scholarship.added_by === user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(scholarship.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <CardTitle className="mt-4">{scholarship.name}</CardTitle>
                  <CardDescription className="text-xs">
                    Added by {scholarship.profiles?.full_name || 'Unknown'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 whitespace-pre-line">
                    {scholarship.description}
                  </p>
                  <a
                    href={scholarship.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-accent hover:underline font-medium"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Apply Now
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-[var(--shadow-soft)]">
            <CardContent className="py-12 text-center">
              <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No scholarships available yet</p>
              {userRole === 'faculty' && (
                <p className="text-sm text-muted-foreground mt-2">Click "Add Scholarship" to create one</p>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Scholarships;
