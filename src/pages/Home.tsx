import React from 'react';
import { HeroSection } from '../components/HeroSection';
import { ScienceBackground } from '../components/ScienceBackground';
import { MarqueeStrip } from '../components/MarqueeStrip';
import { useHomePageData } from '../hooks/useHomePageData';
import { HomeStories } from '../components/home/HomeStories';
import { HomeAbout } from '../components/home/HomeAbout';
import { HomeAdmissions } from '../components/home/HomeAdmissions';
import { HomeQuickLinks } from '../components/home/HomeQuickLinks';
import { HomePollSection } from '../components/home/HomePollSection';
import { HomeTrending } from '../components/home/HomeTrending';
import { HomeAchievements } from '../components/home/HomeAchievements';
import { HomeEvents } from '../components/home/HomeEvents';
import { HomeAppPromo } from '../components/home/HomeAppPromo';

export const Home: React.FC = () => {
  const {
    poll,
    pollVotes,
    achievements,
    events,
    trendingNotices,
    stories,
    isAdmin,
    counts,
    refreshPollVotes,
  } = useHomePageData();

  return (
    <div
      className="relative min-h-screen bg-[#050B18] overflow-hidden pb-20"
      data-testid="home-page"
    >
      <ScienceBackground />

      {/* Ambient orbs */}
      <div className="absolute top-[15%] -left-[10%] w-[500px] h-[500px] rounded-full ambient-orb-orange z-0 pointer-events-none" />
      <div className="absolute top-[45%] -right-[15%] w-[600px] h-[600px] rounded-full ambient-orb-gold z-0 pointer-events-none" />
      <div className="absolute bottom-[10%] left-[20%] w-[450px] h-[450px] rounded-full ambient-orb-orange z-0 pointer-events-none" />

      {/* Tech grid mesh overlay */}
      <div className="absolute inset-0 grid-bg-overlay opacity-15 z-0 pointer-events-none" />

      {/* 1. Hero */}
      <HeroSection />

      {/* 2. Stories Row */}
      <HomeStories stories={stories} isAdmin={isAdmin} />

      {/* 3. Marquee */}
      <MarqueeStrip />

      {/* 4. About + Bento Stats (merged) */}
      <HomeAbout counts={counts} />

      {/* 5. Admissions */}
      <HomeAdmissions />

      {/* 6. Quick Links Dashboard */}
      <HomeQuickLinks />

      {/* 7. Active Poll */}
      {poll && <HomePollSection poll={poll} votes={pollVotes} onVoted={refreshPollVotes} />}

      {/* 8. Trending Notices */}
      <HomeTrending trending={trendingNotices} />

      {/* 9. Recent Achievements */}
      <HomeAchievements achievements={achievements} />

      {/* 10. Upcoming Events */}
      <HomeEvents events={events} />

      {/* 11. App Promo */}
      <HomeAppPromo />
    </div>
  );
};

export default Home;
