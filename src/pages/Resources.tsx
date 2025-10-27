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
import { Plus, ExternalLink, Trash2, BookOpen } from 'lucide-react';

const Resources = () => {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');

  const { data: resources, isLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resources')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newResource: { title: string; description: string; link: string }) => {
      const { error } = await supabase.from('resources').insert({
        ...newResource,
        uploaded_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Resource added successfully');
      setIsDialogOpen(false);
      setTitle('');
      setDescription('');
      setLink('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add resource');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('resources').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Resource deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete resource');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !link) {
      toast.error('Please fill in all required fields');
      return;
    }
    createMutation.mutate({ title, description, link });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Resources</h1>
            <p className="text-muted-foreground text-lg">
              {userRole === 'faculty' ? 'Manage learning materials' : 'Access learning materials'}
            </p>
          </div>
          
          {userRole === 'faculty' && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-[var(--shadow-soft)]">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Resource
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Resource</DialogTitle>
                  <DialogDescription>Share study materials with students</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Introduction to React"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of the resource"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="link">Link *</Label>
                    <Input
                      id="link"
                      type="url"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="https://example.com/resource"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Adding...' : 'Add Resource'}
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
        ) : resources && resources.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => (
              <Card key={resource.id} className="shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    {userRole === 'faculty' && resource.uploaded_by === user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(resource.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <CardTitle className="mt-4">{resource.title}</CardTitle>
                  <CardDescription className="text-xs">
                    By {resource.profiles?.full_name || 'Unknown'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {resource.description && (
                    <p className="text-sm text-muted-foreground mb-4">{resource.description}</p>
                  )}
                  <a
                    href={resource.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Resource
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-[var(--shadow-soft)]">
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No resources available yet</p>
              {userRole === 'faculty' && (
                <p className="text-sm text-muted-foreground mt-2">Click "Add Resource" to create one</p>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Resources;
