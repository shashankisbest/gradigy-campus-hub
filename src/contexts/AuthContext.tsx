import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: 'student' | 'faculty' | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'student' | 'faculty' | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user role when session changes
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
  try {
    console.log('Fetching role for user:', userId);
    
    // Add a small delay to ensure profile is created
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.log('Error fetching role:', error);
      // If profile doesn't exist yet, try creating it from user metadata
      const user = await supabase.auth.getUser();
      if (user.data.user) {
        const userMetadata = user.data.user.user_metadata;
        console.log('User metadata:', userMetadata);
        
        // Set role from metadata directly as fallback
        if (userMetadata.role === 'faculty' || userMetadata.role === 'student') {
          setUserRole(userMetadata.role);
          return;
        }
      }
      throw error;
    }
    
    console.log('Fetched role from profiles:', data?.role);
    setUserRole(data?.role || null);
  } catch (error) {
    console.error('Error fetching user role:', error);
    // Final fallback - check user metadata
    const user = await supabase.auth.getUser();
    const roleFromMeta = user.data.user?.user_metadata?.role;
    if (roleFromMeta === 'faculty' || roleFromMeta === 'student') {
      console.log('Using role from metadata:', roleFromMeta);
      setUserRole(roleFromMeta);
    }
  }
};

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    navigate('/auth');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
