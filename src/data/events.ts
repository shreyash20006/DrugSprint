export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  type: "academic" | "cultural" | "sports" | "social";
}

export interface Competition {
  id: string;
  title: string;
  description: string;
  deadline: string; // Format: YYYY-MM-DD for JavaScript parsing
  prizeInfo: string;
  participationInfo: string;
  googleFormUrl: string;
}

export const timelineEvents: TimelineEvent[] = [
  {
    id: "b100dda7-ea02-4026-b104-d0ae7e11fe26",
    title: "Blood Donation Drive 2026 🩸",
    date: "July 01, 2026",
    description: "Donate Blood, Donate Life! Be a Hero. Save a Life.\n\nThis is to inform all students that a Blood Donation Drive is being organized by TGPCOP on 1 July 2026 at the TGPCOP Campus. Students who are interested in donating blood are requested to register and send their names.\n\nWhy Donate Blood?\n- Save up to 3 Lives: One donation can save 2 or 3 lives!\n- Helps in emergencies and surgeries.\n- Support your community and be someone's hero.\n- It is good for your health!\n\nAfter Donation, You Will Receive:\n1. Refreshments\n2. Water Bottle / Office Tiffin Box\n3. Blood Donation Card (applicable in the future for a discount when the donor requires blood)\n\nAll eligible donors are encouraged to come forward. Donate Blood, Donate Life! Send your details today and be a lifesaver!",
    type: "social"
  },
  {
    id: "world-pharmacist-2025",
    title: "World Pharmacist Day Celebrations",
    date: "September 25, 2025",
    description: "Honoring the backbone of healthcare! We hosted a free diabetes & blood pressure health checkup camp in neighboring villages, followed by a public awareness rally and an inspiring guest lecture by the Joint Commissioner of FDA, Nagpur.",
    type: "social"
  },
  {
    id: "aura-fest-2026",
    title: "Annual Pharma-Fest 'AURA 2026'",
    date: "February 12-14, 2026",
    description: "TGPCOP's flagship 3-day annual festival. Featuring intensive model presentations, pharmaceutical scientific exhibits, and a series of dynamic cultural nights including music, dance, drama, and fashion events. Over 15 pharmacy colleges from Vidarbha participated.",
    type: "cultural"
  },
  {
    id: "pv-seminar-2026",
    title: "National Seminar on Modern Pharmacovigilance",
    date: "April 08, 2026",
    description: "A state-of-the-art national seminar on Adverse Drug Reaction (ADR) reporting tools, signal detection, and clinical trials databases. Keynotes were delivered by pharmaceutical research heads from Sun Pharma and Lupin.",
    type: "academic"
  },
  {
    id: "sports-week-2026",
    title: "TGPCOP Sports Week 'SPARX'",
    date: "May 02-05, 2026",
    description: "An energetic week filled with sportsmanship and team spirit. Cricket tournaments, badminton singles, table tennis, volleyball matches, and chess competitions were held across the college sports complex.",
    type: "sports"
  }
];

export const competitions: Competition[] = [
  {
    id: "pharma-quiz-2026",
    title: "Pharma Quiz 2026",
    description: "Test your rapid-fire knowledge on pharmacology, pharmaceutics, pharmacognosy, and clinical chemistry. Teams of 2 will compete across multiple interactive rounds for the ultimate pharmacy champion trophy.",
    deadline: "2026-06-10",
    prizeInfo: "🏆 Cash prizes up to ₹5,000 + Merit Certificates",
    participationInfo: "Open to B.Pharm and D.Pharm students of all years.",
    googleFormUrl: "#google-form-link"
  },
  {
    id: "poster-presentation-2026",
    title: "National Poster Presentation",
    description: "Design and present an academic poster demonstrating innovative solutions in Green Chemistry, Novel Drug Delivery Systems (NDDS), or AI applications in clinical research. Submissions are judged by industrial experts.",
    deadline: "2026-06-15",
    prizeInfo: "🏆 Top 3 posters will be published in the college research journal + trophies",
    participationInfo: "Individual or Team entry (Max 3 members per team).",
    googleFormUrl: "#google-form-link"
  },
  {
    id: "innovation-challenge-2026",
    title: "NDDS Innovation Challenge",
    description: "Got an out-of-the-box drug delivery concept? Draft a technical proposal showcasing novel tablet coatings, transdermal patch designs, or nano-encapsulations. Selected ideas will be supported with incubation lab resources.",
    deadline: "2026-06-20",
    prizeInfo: "🏆 Cash grants for prototype development + Mentorship program access",
    participationInfo: "Open strictly to pre-final and final year B.Pharm students.",
    googleFormUrl: "#google-form-link"
  }
];
