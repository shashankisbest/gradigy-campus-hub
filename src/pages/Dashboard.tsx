import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Calendar, Award, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user, userRole } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [resourcesRes, timetableRes, scholarshipsRes] = await Promise.all([
        supabase.from('resources').select('id', { count: 'exact', head: true }),
        supabase.from('timetable').select('id', { count: 'exact', head: true }),
        supabase.from('scholarships').select('id', { count: 'exact', head: true }),
      ]);

      return {
        resources: resourcesRes.count || 0,
        timetable: timetableRes.count || 0,
        scholarships: scholarshipsRes.count || 0,
      };
    },
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const statCards = [
    {
      title: 'Resources',
      value: stats?.resources || 0,
      icon: BookOpen,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Classes',
      value: stats?.timetable || 0,
      icon: Calendar,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      title: 'Scholarships',
      value: stats?.scholarships || 0,
      icon: Award,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {profile?.full_name || 'User'}!
          </h1>
          <p className="text-muted-foreground text-lg">
            {userRole === 'faculty' 
              ? 'Manage your academic resources and schedules' 
              : 'Access your learning materials and schedules'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.title} className="shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Access Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-shadow">
            <CardHeader>
              <CardTitle>Quick Access</CardTitle>
              <CardDescription>Your most used features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <a href="/resources" className="flex items-center p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                <BookOpen className="w-5 h-5 mr-3 text-primary" />
                <span className="font-medium">View Resources</span>
              </a>
              <a href="/timetable" className="flex items-center p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                <Calendar className="w-5 h-5 mr-3 text-secondary" />
                <span className="font-medium">Check Timetable</span>
              </a>
              <a href="/scholarships" className="flex items-center p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                <Award className="w-5 h-5 mr-3 text-accent" />
                <span className="font-medium">Browse Scholarships</span>
              </a>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-shadow">
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>Key information at a glance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Your Role</span>
                <span className="text-sm font-bold capitalize">{userRole}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Account Status</span>
                <span className="text-sm font-bold text-secondary">Active</span>
              </div>
              {userRole === 'faculty' && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-sm text-primary font-medium">
                    You have faculty privileges to manage content
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
