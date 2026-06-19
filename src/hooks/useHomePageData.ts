import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface HomePoll {
  id: string;
  title: string;
  description?: string;
  options: string[];
  end_date?: string;
}

export interface HomeAchievement {
  id: string;
  student_name: string;
  title: string;
  year?: string;
  category?: string;
  description?: string;
  image_url?: string;
}

export interface HomeEvent {
  id: string;
  name: string;
  type?: string;
  deadline?: string;
  time?: string;
  location?: string;
  image_url?: string;
  capacity?: number;
  registered_count?: number;
}

export interface HomeNotice {
  id: string;
  title: string;
  category: string;
  views?: number;
  created_at: string;
}

export interface HomeStory {
  id: string;
  media_url: string;
  title?: string;
  created_at?: string;
  expires_at: string;
}

export interface HomePageData {
  poll: HomePoll | null;
  pollVotes: { selected_option: string }[];
  achievements: HomeAchievement[];
  events: HomeEvent[];
  trendingNotices: HomeNotice[];
  stories: HomeStory[];
  isAdmin: boolean;
  counts: {
    notices: number;
    events: number;
    students: number;
    members: number;
  };
  loading: boolean;
}

export const useHomePageData = (): HomePageData & {
  refreshPollVotes: () => Promise<void>;
} => {
  const [poll, setPoll] = useState<HomePoll | null>(null);
  const [pollVotes, setPollVotes] = useState<{ selected_option: string }[]>([]);
  const [achievements, setAchievements] = useState<HomeAchievement[]>([]);
  const [events, setEvents] = useState<HomeEvent[]>([]);
  const [trendingNotices, setTrendingNotices] = useState<HomeNotice[]>([]);
  const [stories, setStories] = useState<HomeStory[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [counts, setCounts] = useState({
    notices: 0,
    events: 0,
    students: 0,
    members: 0,
  });
  const [loading, setLoading] = useState(true);

  const refreshPollVotes = async () => {
    if (!poll) return;
    const { data } = await supabase
      .from('votes')
      .select('selected_option')
      .eq('poll_id', poll.id);
    setPollVotes(data || []);
  };

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      try {
        const [
          pollResult,
          achievementsResult,
          eventsResult,
          storiesResult,
          noticesCountResult,
          eventsCountResult,
          studentsCountResult,
          membersCountResult,
          trendingResult,
          sessionResult,
        ] = await Promise.all([
          supabase
            .from('polls')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('achievements')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('events')
            .select('*')
            .eq('is_active', true)
            .order('deadline', { ascending: true })
            .limit(3),
          supabase
            .from('stories')
            .select('*')
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: true }),
          supabase.from('notices').select('*', { count: 'exact', head: true }),
          supabase.from('events').select('*', { count: 'exact', head: true }),
          supabase.from('student_verifications').select('*', { count: 'exact', head: true }),
          supabase.from('council_members').select('*', { count: 'exact', head: true }),
          supabase.from('notices').select('*').order('views', { ascending: false }).limit(3),
          supabase.auth.getSession(),
        ]);

        if (cancelled) return;

        if (pollResult.data) {
          setPoll(pollResult.data as HomePoll);
          const { data: votesData } = await supabase
            .from('votes')
            .select('selected_option')
            .eq('poll_id', pollResult.data.id);
          if (!cancelled) setPollVotes(votesData || []);
        }

        setAchievements(achievementsResult.data || []);
        setEvents(eventsResult.data || []);
        setStories(storiesResult.data || []);
        setTrendingNotices(trendingResult.data || []);
        setCounts({
          notices: noticesCountResult.count || 0,
          events: eventsCountResult.count || 0,
          students: studentsCountResult.count || 0,
          members: membersCountResult.count || 0,
        });

        const session = sessionResult.data?.session;
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();
          if (!cancelled && profile && profile.role !== 'student') {
            setIsAdmin(true);
          }
        }
      } catch (err) {
        console.error('Home data fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    poll,
    pollVotes,
    achievements,
    events,
    trendingNotices,
    stories,
    isAdmin,
    counts,
    loading,
    refreshPollVotes,
  };
};
