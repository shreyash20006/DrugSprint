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
    email: "harshal@tgpcopcouncil.com",
    avatarSeed: "HH"
  },
  {
    role: "GENERAL SECRETARY",
    name: "Vinay Deogade",
    year: "B.Pharm II Year",
    email: "vinay@tgpcopcouncil.com",
    avatarSeed: "VD"
  },
  {
    role: "SECRETARY",
    name: "Varsha Damahe",
    year: "B.Pharm III Year",
    email: "varsha@tgpcopcouncil.com",
    avatarSeed: "VD2"
  },
  {
    role: "TREASURER",
    name: "Laksh Jaiswal",
    year: "B.Pharm II Year",
    email: "laksh@tgpcopcouncil.com",
    avatarSeed: "LJ"
  },
  {
    role: "TREASURER",
    name: "Rohan Bhil",
    year: "B.Pharm III Year",
    email: "rohan@tgpcopcouncil.com",
    avatarSeed: "RB"
  },
  {
    role: "NSS INCHARGE",
    name: "Shivam Waghmare",
    year: "B.Pharm III Year",
    email: "shivam@tgpcopcouncil.com",
    avatarSeed: "SW"
  },
  {
    role: "CULTURAL SECRETARY",
    name: "Shruti Kamble",
    year: "B.Pharm II Year",
    email: "shruti@tgpcopcouncil.com",
    avatarSeed: "SK"
  },
  {
    role: "OVERALL SECRETARY",
    name: "Akash Gaiwad",
    year: "B.Pharm III Year",
    email: "akash@tgpcopcouncil.com",
    avatarSeed: "AG"
  },
  {
    role: "EVENTS COORDINATOR",
    name: "Nayan Thote",
    year: "B.Pharm I Year",
    email: "nayan@tgpcopcouncil.com",
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
