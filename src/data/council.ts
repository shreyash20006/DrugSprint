export interface CouncilMember {
  role: string;
  name: string;
  year: string;
  email: string;
  avatarSeed: string; // Used to generate initials monogram in CouncilCard
  avatarUrl?: string; // Live profile picture
  phone?: string; // Live phone number
}

export const councilMembers: CouncilMember[] = [
  {
    role: "PRESIDENT",
    name: "Tushar Kalbhut",
    year: "B.Pharm III Year",
    email: "sb108750@gmail.com",
    avatarSeed: "TK"
  },
  {
    role: "VICE PRESIDENT",
    name: "Harshal Hatwar",
    year: "B.Pharm II Year",
    email: "vicepresident@tgpcopcouncil.online",
    avatarSeed: "HH"
  },
  {
    role: "GENERAL SECRETARY",
    name: "Vinay Deogade",
    year: "B.Pharm II Year",
    email: "general-secretary@tgpcopcouncil.online",
    avatarSeed: "VD"
  },
  {
    role: "SECRETARY",
    name: "Varsha Damahe",
    year: "B.Pharm III Year",
    email: "secretary@tgpcopcouncil.online",
    avatarSeed: "VD2"
  },
  {
    role: "TREASURER",
    name: "Laksh Jaiswal",
    year: "B.Pharm II Year",
    email: "treasurer@tgpcopcouncil.online",
    avatarSeed: "LJ"
  },
  {
    role: "TREASURER",
    name: "Rohan Bhil",
    year: "B.Pharm III Year",
    email: "treasure@tgpcopcouncil.online",
    avatarSeed: "RB"
  },
  {
    role: "NSS INCHARGE",
    name: "Shivam Waghmare",
    year: "B.Pharm III Year",
    email: "nss-incharge@tgpcopcouncil.online",
    avatarSeed: "SW"
  },
  {
    role: "CULTURAL SECRETARY",
    name: "Shruti Kamble",
    year: "B.Pharm II Year",
    email: "cultural-secretary@tgpcopcouncil.online",
    avatarSeed: "SK"
  },
  {
    role: "OVERALL SECRETARY",
    name: "Akash Gaiwad",
    year: "B.Pharm III Year",
    email: "overall-secretary@tgpcopcouncil.online",
    avatarSeed: "AG"
  },
  {
    role: "EVENTS COORDINATOR",
    name: "Nayan Thote",
    year: "B.Pharm I Year",
    email: "events-coordinator@tgpcopcouncil.online",
    avatarSeed: "NT"
  },
  {
    role: "ANTI-RAGGING INCHARGE",
    name: "Anjali Hardas",
    year: "B.Pharm I Year",
    email: "anjali@tgpcopcouncil.com",
    avatarSeed: "AH"
  },
  {
    role: "COLLEGE ISSUES REP",
    name: "Nandini Rajurkar",
    year: "B.Pharm III Year",
    email: "nandini@tgpcopcouncil.com",
    avatarSeed: "NR"
  },
  {
    role: "SOCIAL MEDIA INCHARGE",
    name: "Himani Kambale",
    year: "B.Pharm I Year",
    email: "himani@tgpcopcouncil.com",
    avatarSeed: "HK"
  }
];

export default councilMembers;
