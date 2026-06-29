export interface Notice {
  id: string;
  title: string;
  date: string;
  description: string;
  category: "Academic" | "Event" | "Alert" | "General";
  linkText?: string;
  linkUrl?: string;
}

export const notices: Notice[] = [
  {
    id: "b100dda7-ea02-4026-b104-d0ae7e11fe27",
    title: "Blood Donation Drive 2026 🩸 — Register Now!",
    date: "June 29, 2026",
    description: "Donate Blood, Donate Life! Be a Hero. Save a Life.\n\nThis is to inform all students that a Blood Donation Drive is being organized by TGPCOP on 1 July 2026. Students who are interested in donating blood are requested to send their names.\n\nWhy Donate Blood?\n- Save up to 3 Lives: One donation can save 2 or 3 lives!\n- Helps in emergencies and surgeries.\n- Support your community and be someone's hero.\n- It is good for your health!\n\nAfter Donation, You Will Receive:\n1. Refreshments\n2. Water Bottle / Office Tiffin Box\n3. Blood Donation Card (applicable in the future for a discount when the donor requires blood)\n\nAll eligible donors are encouraged to come forward. Donate Blood, Donate Life! Send your details today and be a lifesaver!",
    category: "Event",
    linkText: "Register as Donor",
    linkUrl: "/blood-donation"
  },
  {
    id: "mid-sem-2025",
    title: "Mid-Semester Exam Schedule Released",
    date: "May 20, 2026",
    description: "The official timetable for the upcoming B.Pharm (Semesters II, IV, VI, and VIII) Mid-Semester examinations is now live. Students are advised to download the PDF schedule and check their respective timings. Ensure all library dues are cleared before exams begin.",
    category: "Academic",
    linkText: "Download Schedule PDF",
    linkUrl: "#"
  },
  {
    id: "blood-donation-2025",
    title: "Blood Donation Camp — Register Now!",
    date: "May 18, 2026",
    description: "In collaboration with Nagpur Super Speciality Blood Bank, TGPCOP NSS unit is organizing a Mega Blood Donation Camp in the college seminar hall. Let's contribute to saving lives. All healthy donors will receive certificates of appreciation.",
    category: "Event",
    linkText: "Register as Donor",
    linkUrl: "#google-form-link"
  },
  {
    id: "anti-ragging-reminder",
    title: "Anti-Ragging Policy & Committee Reminder",
    date: "May 15, 2026",
    description: "TGPCOP maintains a strict Zero Tolerance policy towards ragging. Any act of physical or mental harassment is strictly prohibited. If you witness or experience any such behavior, immediately report it to the Anti-Ragging Committee or submit an anonymous query through our Ask Portal.",
    category: "Alert",
    linkText: "Read Safety Guidelines",
    linkUrl: "#"
  },
  {
    id: "sun-pharma-visit",
    title: "Industrial Visit to Sun Pharma — 30th May",
    date: "May 12, 2026",
    description: "An educational industrial visit to Sun Pharmaceutical Industries, Nagpur has been arranged for final year (B.Pharm IV Year) students. This visit will provide practical exposure to large-scale pharmaceutical manufacturing, formulation, and QA/QC processes. Limited seats remaining.",
    category: "Event",
    linkText: "View Consent Form",
    linkUrl: "#"
  },
  {
    id: "library-timings",
    title: "Extended Library Timings for Exams",
    date: "May 10, 2026",
    description: "To assist students in their exam preparations, the TGPCOP central library will remain open for extended hours starting next week. New hours: 8:00 AM to 8:00 PM (Monday to Saturday). Silent study rules must be strictly adhered to.",
    category: "General"
  },
  {
    id: "notesdrive-launch",
    title: "NotesDrive — Free Study Notes Platform Launched!",
    date: "May 05, 2026",
    description: "The Student Council is thrilled to announce the launch of 'NotesDrive', a central online folder containing free, high-quality, syllabus-wise lecture notes, previous years' question papers, and pharmacy reference handbooks uploaded by senior students and faculty.",
    category: "General",
    linkText: "Access NotesDrive",
    linkUrl: "#"
  }
];
