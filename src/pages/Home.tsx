import React, { Suspense, lazy } from 'react';
import { HeroSection } from '../components/HeroSection';
import { ScienceBackground } from '../components/ScienceBackground';
import { MarqueeStrip } from '../components/MarqueeStrip';
import { useHomePageData } from '../hooks/useHomePageData';
import { HomeStories } from '../components/home/HomeStories';

// Lazy-load below-fold sections for faster TTI
const HomeAbout = lazy(() => import('../components/home/HomeAbout').then((m) => ({ default: m.HomeAbout })));
const HomeAdmissions = lazy(() => import('../components/home/HomeAdmissions').then((m) => ({ default: m.HomeAdmissions })));
const HomeQuickLinks = lazy(() => import('../components/home/HomeQuickLinks').then((m) => ({ default: m.HomeQuickLinks })));
const HomePollSection = lazy(() => import('../components/home/HomePollSection').then((m) => ({ default: m.HomePollSection })));
const HomeTrending = lazy(() => import('../components/home/HomeTrending').then((m) => ({ default: m.HomeTrending })));
const HomeAchievements = lazy(() => import('../components/home/HomeAchievements').then((m) => ({ default: m.HomeAchievements })));
const HomeEvents = lazy(() => import('../components/home/HomeEvents').then((m) => ({ default: m.HomeEvents })));
const HomeAppPromo = lazy(() => import('../components/home/HomeAppPromo').then((m) => ({ default: m.HomeAppPromo })));

// Loading skeleton (matches a section's outer dimensions to avoid CLS)
const SectionSkeleton: React.FC<{ tall?: boolean }> = ({ tall = false }) => (
  <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${tall ? 'py-32' : 'py-20'}`}>
    <div className="animate-pulse space-y-6">
      <div className="h-3 bg-white/[0.04] rounded w-24" />
      <div className="h-10 bg-white/[0.04] rounded w-2/3 max-w-xl" />
      <div className="h-4 bg-white/[0.03] rounded w-full max-w-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 bg-white/[0.03] rounded-2xl" />
        ))}
      </div>
    </div>
  </div>
);

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

      {/* 1. Hero (eager) */}
      <HeroSection />

      {/* 2. Stories Row (eager — above-fold-ish) */}
      <HomeStories stories={stories} isAdmin={isAdmin} />

      {/* 3. Marquee (eager) */}
      <MarqueeStrip />

      {/* Below-fold lazy sections */}
      <Suspense fallback={<SectionSkeleton tall />}>
        <HomeAbout counts={counts} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <HomeAdmissions />
      </Suspense>

      <Suspense fallback={<SectionSkeleton tall />}>
        <HomeQuickLinks />
      </Suspense>

      {poll && (
        <Suspense fallback={<SectionSkeleton />}>
          <HomePollSection poll={poll} votes={pollVotes} onVoted={refreshPollVotes} />
        </Suspense>
      )}

      <Suspense fallback={<SectionSkeleton />}>
        <HomeTrending trending={trendingNotices} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <HomeAchievements achievements={achievements} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <HomeEvents events={events} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <HomeAppPromo />
      </Suspense>
    </div>
  );
};

export default Home;
