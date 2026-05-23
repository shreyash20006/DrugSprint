export interface CouncilMember {
  role: string;
  name: string;
  year: string;
  email: string;
  avatarSeed: string; // Used to generate initials monogram in CouncilCard
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
    email: "sb108750@gmail.com",
    avatarSeed: "HH"
  },
  {
    role: "GENERAL SECRETARY",
    name: "Vinay Deogade",
    year: "B.Pharm II Year",
    email: "sb108750@gmail.com",
    avatarSeed: "VD"
  },
  {
    role: "SECRETARY",
    name: "Varsha Damahe",
    year: "B.Pharm III Year",
    email: "sb108750@gmail.com",
    avatarSeed: "VD2"
  },
  {
    role: "TREASURER",
    name: "Laksh Jaiswal",
    year: "B.Pharm II Year",
    email: "sb108750@gmail.com",
    avatarSeed: "LJ"
  },
  {
    role: "TREASURER",
    name: "Rohan Bhil",
    year: "B.Pharm III Year",
    email: "sb108750@gmail.com",
    avatarSeed: "RB"
  },
  {
    role: "NSS INCHARGE",
    name: "Shivam Waghmare",
    year: "B.Pharm III Year",
    email: "sb108750@gmail.com",
    avatarSeed: "SW"
  },
  {
    role: "CULTURAL SECRETARY",
    name: "Shruti Kamble",
    year: "B.Pharm II Year",
    email: "sb108750@gmail.com",
    avatarSeed: "SK"
  },
  {
    role: "OVERALL SECRETARY",
    name: "Akash Gaiwad",
    year: "B.Pharm III Year",
    email: "sb108750@gmail.com",
    avatarSeed: "AG"
  },
  {
    role: "EVENTS COORDINATOR",
    name: "Nayan Thote",
    year: "B.Pharm I Year",
    email: "sb108750@gmail.com",
    avatarSeed: "NT"
  },
  {
    role: "ANTI-RAGGING INCHARGE",
    name: "Anjali Hardas",
    year: "B.Pharm I Year",
    email: "sb108750@gmail.com",
    avatarSeed: "AH"
  },
  {
    role: "COLLEGE ISSUES REP",
    name: "Nandini Rajurkar",
    year: "B.Pharm III Year",
    email: "sb108750@gmail.com",
    avatarSeed: "NR"
  },
  {
    role: "SOCIAL MEDIA INCHARGE",
    name: "Himani Kambale",
    year: "B.Pharm I Year",
    email: "sb108750@gmail.com",
    avatarSeed: "HK"
  }
];

export default councilMembers;
