import type { Participant } from "../types";
import { buildCategoryStats } from "../utils/categoryStats";

function dicebear(name: string): string {
  const normalized = name.trim();
  const initials = normalized
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const palettes = [
    { bg: "#DBEAFE", fg: "#1E3A8A" },
    { bg: "#DCFCE7", fg: "#166534" },
    { bg: "#FCE7F3", fg: "#9D174D" },
    { bg: "#FEF3C7", fg: "#92400E" },
    { bg: "#EDE9FE", fg: "#5B21B6" },
  ];
  const hash = Array.from(normalized).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const { bg, fg } = palettes[hash % palettes.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" role="img" aria-label="${normalized}"><rect width="96" height="96" rx="48" fill="${bg}" /><text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="700" fill="${fg}">${initials}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const raw: Omit<Participant, "rank" | "totalScore" | "categoryStats">[] = [
  {
    id: 1,
    name: "Amara Okonkwo",
    role: "Senior Software Engineer",
    avatarUrl: dicebear("Amara Okonkwo"),
    activities: [
      { name: "[EDU] Advanced Cloud Architectures Talk", category: "Education", date: "12-Mar-2025", points: 64, year: 2025, quarter: 1 },
      { name: "[LAB] Backend Systems Mentorship", category: "Education", date: "20-Jan-2025", points: 48, year: 2025, quarter: 1 },
      { name: "[REG] Engineering Summit Keynote", category: "Public Speaking", date: "15-Apr-2025", points: 80, year: 2025, quarter: 2 },
      { name: "[UNI] University Lecture Series", category: "University Partnership", date: "10-May-2025", points: 96, year: 2025, quarter: 2 },
      { name: "[EDU] DevOps Best Practices Workshop", category: "Education", date: "18-Jun-2025", points: 48, year: 2025, quarter: 2 },
      { name: "[REG] Tech Talks at City Conference", category: "Public Speaking", date: "03-Sep-2025", points: 64, year: 2025, quarter: 3 },
    ],
  },
  {
    id: 2,
    name: "Lukas Brenner",
    role: "Lead Data Scientist",
    avatarUrl: dicebear("Lukas Brenner"),
    activities: [
      { name: "[EDU] Machine Learning Fundamentals", category: "Education", date: "08-Feb-2025", points: 48, year: 2025, quarter: 1 },
      { name: "[UNI] AI Research Collaboration", category: "University Partnership", date: "22-Mar-2025", points: 80, year: 2025, quarter: 1 },
      { name: "[REG] Data Science Conference Talk", category: "Public Speaking", date: "11-May-2025", points: 64, year: 2025, quarter: 2 },
      { name: "[LAB] Neural Networks Lab Curator", category: "Education", date: "30-Jun-2025", points: 48, year: 2025, quarter: 2 },
      { name: "[UNI] Academic Partnership Program", category: "University Partnership", date: "14-Aug-2025", points: 96, year: 2025, quarter: 3 },
      { name: "[REG] Internal Analytics Workshop", category: "Public Speaking", date: "25-Sep-2025", points: 32, year: 2025, quarter: 3 },
    ],
  },
  {
    id: 3,
    name: "Sofia Marchetti",
    role: "Principal Product Manager",
    avatarUrl: dicebear("Sofia Marchetti"),
    activities: [
      { name: "[EDU] Product Strategy Masterclass", category: "Education", date: "15-Jan-2025", points: 64, year: 2025, quarter: 1 },
      { name: "[REG] Product Leaders Summit", category: "Public Speaking", date: "28-Feb-2025", points: 80, year: 2025, quarter: 1 },
      { name: "[UNI] Innovation & Entrepreneurship Seminar", category: "University Partnership", date: "17-Apr-2025", points: 96, year: 2025, quarter: 2 },
      { name: "[EDU] Agile Transformation Program", category: "Education", date: "05-Jun-2025", points: 48, year: 2025, quarter: 2 },
      { name: "[REG] StartupFest Panel Discussion", category: "Public Speaking", date: "22-Jul-2025", points: 64, year: 2025, quarter: 3 },
    ],
  },
  {
    id: 4,
    name: "Dmitri Volkov",
    role: "DevOps Engineer",
    avatarUrl: dicebear("Dmitri Volkov"),
    activities: [
      { name: "[REG] Platform Engineering Meetup", category: "Public Speaking", date: "19-Mar-2025", points: 64, year: 2025, quarter: 1 },
      { name: "[LAB] Kubernetes Lab Mentor", category: "Education", date: "02-Apr-2025", points: 48, year: 2025, quarter: 2 },
      { name: "[EDU] CI/CD Pipeline Workshop", category: "Education", date: "14-May-2025", points: 32, year: 2025, quarter: 2 },
      { name: "[UNI] Cloud Computing University Lecture", category: "University Partnership", date: "09-Jul-2025", points: 80, year: 2025, quarter: 3 },
      { name: "[REG] DevOpsDays City Talk", category: "Public Speaking", date: "01-Sep-2025", points: 64, year: 2025, quarter: 3 },
    ],
  },
  {
    id: 5,
    name: "Yuki Tanaka",
    role: "UX Research Lead",
    avatarUrl: dicebear("Yuki Tanaka"),
    activities: [
      { name: "[EDU] Human-Centered Design Course", category: "Education", date: "10-Jan-2025", points: 48, year: 2025, quarter: 1 },
      { name: "[REG] UX Research Conference", category: "Public Speaking", date: "24-Mar-2025", points: 80, year: 2025, quarter: 1 },
      { name: "[UNI] Design Thinking Program", category: "University Partnership", date: "06-May-2025", points: 64, year: 2025, quarter: 2 },
      { name: "[LAB] Usability Testing Lab", category: "Education", date: "18-Jun-2025", points: 32, year: 2025, quarter: 2 },
      { name: "[REG] Accessibility Awareness Talk", category: "Public Speaking", date: "11-Aug-2025", points: 48, year: 2025, quarter: 3 },
    ],
  },
  {
    id: 6,
    name: "Kwame Asante",
    role: "Security Architect",
    avatarUrl: dicebear("Kwame Asante"),
    activities: [
      { name: "[LAB] Penetration Testing Bootcamp", category: "Education", date: "21-Feb-2025", points: 64, year: 2025, quarter: 1 },
      { name: "[REG] CyberSec Summit Presentation", category: "Public Speaking", date: "07-Apr-2025", points: 80, year: 2025, quarter: 2 },
      { name: "[UNI] Cybersecurity Ethics Lecture", category: "University Partnership", date: "03-Jun-2025", points: 48, year: 2025, quarter: 2 },
      { name: "[EDU] Zero Trust Architecture Workshop", category: "Education", date: "29-Jul-2025", points: 48, year: 2025, quarter: 3 },
    ],
  },
  {
    id: 7,
    name: "Priya Krishnamurthy",
    role: "Staff Engineer",
    avatarUrl: dicebear("Priya Krishnamurthy"),
    activities: [
      { name: "[EDU] Distributed Systems Course", category: "Education", date: "13-Jan-2025", points: 64, year: 2025, quarter: 1 },
      { name: "[REG] Systems Design at Scale Talk", category: "Public Speaking", date: "04-Mar-2025", points: 64, year: 2025, quarter: 1 },
      { name: "[UNI] Software Engineering Mentorship", category: "University Partnership", date: "29-Apr-2025", points: 48, year: 2025, quarter: 2 },
      { name: "[LAB] Microservices Lab Guide", category: "Education", date: "16-Jul-2025", points: 32, year: 2025, quarter: 3 },
    ],
  },
  {
    id: 8,
    name: "Marco Delgado",
    role: "Engineering Manager",
    avatarUrl: dicebear("Marco Delgado"),
    activities: [
      { name: "[REG] Engineering Leadership Panel", category: "Public Speaking", date: "18-Feb-2025", points: 80, year: 2025, quarter: 1 },
      { name: "[EDU] Team Building Essentials", category: "Education", date: "03-Apr-2025", points: 32, year: 2025, quarter: 2 },
      { name: "[UNI] Industry-Academia Bridge Program", category: "University Partnership", date: "20-May-2025", points: 64, year: 2025, quarter: 2 },
      { name: "[REG] Agile Coach Conference", category: "Public Speaking", date: "05-Aug-2025", points: 48, year: 2025, quarter: 3 },
    ],
  },
  {
    id: 9,
    name: "Ingrid Halvorsen",
    role: "Solutions Architect",
    avatarUrl: dicebear("Ingrid Halvorsen"),
    activities: [
      { name: "[EDU] Cloud Migration Strategies", category: "Education", date: "27-Jan-2025", points: 48, year: 2025, quarter: 1 },
      { name: "[UNI] Enterprise Architecture Lecture", category: "University Partnership", date: "15-Apr-2025", points: 64, year: 2025, quarter: 2 },
      { name: "[REG] AWS Summit Presenter", category: "Public Speaking", date: "08-Jul-2025", points: 64, year: 2025, quarter: 3 },
      { name: "[LAB] Infrastructure Lab Mentor", category: "Education", date: "22-Sep-2025", points: 32, year: 2025, quarter: 3 },
    ],
  },
  {
    id: 10,
    name: "Fatima Al-Rashidi",
    role: "Data Engineer",
    avatarUrl: dicebear("Fatima Al-Rashidi"),
    activities: [
      { name: "[EDU] Big Data Processing Course", category: "Education", date: "09-Feb-2025", points: 48, year: 2025, quarter: 1 },
      { name: "[REG] Data Pipeline Architecture Talk", category: "Public Speaking", date: "26-Mar-2025", points: 64, year: 2025, quarter: 1 },
      { name: "[UNI] Database Systems Collaboration", category: "University Partnership", date: "12-Jun-2025", points: 48, year: 2025, quarter: 2 },
    ],
  },
  {
    id: 11,
    name: "Takeshi Yamamoto",
    role: "Mobile Developer",
    avatarUrl: dicebear("Takeshi Yamamoto"),
    activities: [
      { name: "[EDU] iOS Development Workshop", category: "Education", date: "14-Feb-2025", points: 48, year: 2025, quarter: 1 },
      { name: "[REG] Mobile UX Conf Speaker", category: "Public Speaking", date: "30-Apr-2025", points: 64, year: 2025, quarter: 2 },
      { name: "[UNI] App Development Bootcamp", category: "University Partnership", date: "17-Jul-2025", points: 48, year: 2025, quarter: 3 },
    ],
  },
  {
    id: 12,
    name: "Anastasia Petrov",
    role: "Machine Learning Engineer",
    avatarUrl: dicebear("Anastasia Petrov"),
    activities: [
      { name: "[LAB] ML Foundations Lab", category: "Education", date: "06-Mar-2025", points: 48, year: 2025, quarter: 1 },
      { name: "[UNI] Deep Learning Research Partnership", category: "University Partnership", date: "23-Apr-2025", points: 64, year: 2025, quarter: 2 },
      { name: "[REG] NLP Conference Presentation", category: "Public Speaking", date: "19-Aug-2025", points: 48, year: 2025, quarter: 3 },
    ],
  },
  {
    id: 13,
    name: "Chidi Eze",
    role: "Frontend Developer",
    avatarUrl: dicebear("Chidi Eze"),
    activities: [
      { name: "[EDU] React Advanced Patterns", category: "Education", date: "17-Jan-2025", points: 32, year: 2025, quarter: 1 },
      { name: "[REG] Frontend Meetup Speaker", category: "Public Speaking", date: "05-May-2025", points: 48, year: 2025, quarter: 2 },
      { name: "[UNI] Web Development Mentoring", category: "University Partnership", date: "28-Jul-2025", points: 48, year: 2025, quarter: 3 },
    ],
  },
  {
    id: 14,
    name: "Valentina Russo",
    role: "Product Designer",
    avatarUrl: dicebear("Valentina Russo"),
    activities: [
      { name: "[EDU] Design Systems Workshop", category: "Education", date: "22-Feb-2025", points: 48, year: 2025, quarter: 1 },
      { name: "[REG] Design Conference Panel", category: "Public Speaking", date: "09-Jun-2025", points: 64, year: 2025, quarter: 2 },
    ],
  },
  {
    id: 15,
    name: "Rajesh Sundaram",
    role: "Platform Engineer",
    avatarUrl: dicebear("Rajesh Sundaram"),
    activities: [
      { name: "[LAB] Site Reliability Lab", category: "Education", date: "31-Jan-2025", points: 32, year: 2025, quarter: 1 },
      { name: "[UNI] Systems Programming Lecture", category: "University Partnership", date: "24-Apr-2025", points: 48, year: 2025, quarter: 2 },
      { name: "[REG] SRE Practices Talk", category: "Public Speaking", date: "12-Sep-2025", points: 48, year: 2025, quarter: 3 },
    ],
  },
  {
    id: 16,
    name: "Nadia Bouchard",
    role: "Scrum Master",
    avatarUrl: dicebear("Nadia Bouchard"),
    activities: [
      { name: "[REG] Agile Leadership Summit", category: "Public Speaking", date: "11-Mar-2025", points: 64, year: 2025, quarter: 1 },
      { name: "[EDU] Agile Frameworks Course", category: "Education", date: "27-May-2025", points: 32, year: 2025, quarter: 2 },
    ],
  },
  {
    id: 17,
    name: "James O'Sullivan",
    role: "QA Lead",
    avatarUrl: dicebear("James O'Sullivan"),
    activities: [
      { name: "[EDU] Test Automation Bootcamp", category: "Education", date: "04-Feb-2025", points: 48, year: 2025, quarter: 1 },
      { name: "[REG] QA Engineering Summit", category: "Public Speaking", date: "13-Jun-2025", points: 48, year: 2025, quarter: 2 },
    ],
  },
  {
    id: 18,
    name: "Leila Ahmadi",
    role: "Backend Developer",
    avatarUrl: dicebear("Leila Ahmadi"),
    activities: [
      { name: "[UNI] API Design Principles Lecture", category: "University Partnership", date: "07-Mar-2025", points: 48, year: 2025, quarter: 1 },
      { name: "[EDU] GraphQL Workshop", category: "Education", date: "20-Jun-2025", points: 32, year: 2025, quarter: 2 },
    ],
  },
  {
    id: 19,
    name: "Benjamin Müller",
    role: "Cloud Engineer",
    avatarUrl: dicebear("Benjamin Müller"),
    activities: [
      { name: "[REG] Cloud Native Conf Speaker", category: "Public Speaking", date: "25-Apr-2025", points: 48, year: 2025, quarter: 2 },
      { name: "[LAB] Infrastructure as Code Lab", category: "Education", date: "30-Aug-2025", points: 32, year: 2025, quarter: 3 },
    ],
  },
  {
    id: 20,
    name: "Oluwaseun Adeyemi",
    role: "Data Analyst",
    avatarUrl: dicebear("Oluwaseun Adeyemi"),
    activities: [
      { name: "[EDU] Business Intelligence Essentials", category: "Education", date: "16-Jan-2025", points: 32, year: 2025, quarter: 1 },
      { name: "[UNI] Analytics Internship Program", category: "University Partnership", date: "02-Sep-2025", points: 48, year: 2025, quarter: 3 },
    ],
  },
  {
    id: 21,
    name: "Sienna Park",
    role: "Technical Writer",
    avatarUrl: dicebear("Sienna Park"),
    activities: [
      { name: "[EDU] Technical Documentation Workshop", category: "Education", date: "19-Mar-2025", points: 32, year: 2025, quarter: 1 },
      { name: "[REG] API Documentation Talk", category: "Public Speaking", date: "14-Jul-2025", points: 48, year: 2025, quarter: 3 },
    ],
  },
  {
    id: 22,
    name: "Carlos Mendez",
    role: "Embedded Systems Engineer",
    avatarUrl: dicebear("Carlos Mendez"),
    activities: [
      { name: "[UNI] IoT Engineering Seminar", category: "University Partnership", date: "26-Feb-2025", points: 48, year: 2025, quarter: 1 },
      { name: "[LAB] Firmware Development Lab", category: "Education", date: "23-Jul-2025", points: 32, year: 2025, quarter: 3 },
    ],
  },
  {
    id: 23,
    name: "Anika Schneider",
    role: "Business Analyst",
    avatarUrl: dicebear("Anika Schneider"),
    activities: [
      { name: "[EDU] Requirements Engineering Course", category: "Education", date: "05-Mar-2025", points: 32, year: 2025, quarter: 1 },
      { name: "[REG] BA Community Meetup", category: "Public Speaking", date: "18-Sep-2025", points: 32, year: 2025, quarter: 3 },
    ],
  },
  {
    id: 24,
    name: "Felix Oduya",
    role: "Junior Developer",
    avatarUrl: dicebear("Felix Oduya"),
    activities: [
      { name: "[EDU] Clean Code Principles", category: "Education", date: "24-Apr-2025", points: 16, year: 2025, quarter: 2 },
      { name: "[LAB] Code Review Techniques Lab", category: "Education", date: "10-Sep-2025", points: 16, year: 2025, quarter: 3 },
    ],
  },
  {
    id: 25,
    name: "Hana Nakamura",
    role: "HR Technology Specialist",
    avatarUrl: dicebear("Hana Nakamura"),
    activities: [
      { name: "[EDU] HR Analytics Introduction", category: "Education", date: "07-May-2025", points: 16, year: 2025, quarter: 2 },
    ],
  },
  {
    id: 26,
    name: "Soren Nielsen",
    role: "Network Engineer",
    avatarUrl: dicebear("Soren Nielsen"),
    activities: [
      { name: "[REG] Network Security Conference", category: "Public Speaking", date: "02-Apr-2025", points: 48, year: 2025, quarter: 2 },
      { name: "[EDU] SDN Workshop", category: "Education", date: "16-Oct-2025", points: 32, year: 2025, quarter: 4 },
    ],
  },
  {
    id: 27,
    name: "Miriam Osei",
    role: "Digital Marketing Lead",
    avatarUrl: dicebear("Miriam Osei"),
    activities: [
      { name: "[REG] MarTech Summit Speaker", category: "Public Speaking", date: "12-Feb-2025", points: 48, year: 2025, quarter: 1 },
      { name: "[EDU] Digital Analytics Course", category: "Education", date: "04-Nov-2025", points: 32, year: 2025, quarter: 4 },
    ],
  },
  {
    id: 28,
    name: "Arjun Patel",
    role: "Blockchain Developer",
    avatarUrl: dicebear("Arjun Patel"),
    activities: [
      { name: "[UNI] Distributed Ledger Technology Lecture", category: "University Partnership", date: "09-Jun-2025", points: 48, year: 2025, quarter: 2 },
      { name: "[REG] Web3 Developers Conference", category: "Public Speaking", date: "21-Oct-2025", points: 32, year: 2025, quarter: 4 },
    ],
  },
  {
    id: 29,
    name: "Zoe Williams",
    role: "IT Project Manager",
    avatarUrl: dicebear("Zoe Williams"),
    activities: [
      { name: "[EDU] Project Management Fundamentals", category: "Education", date: "27-Mar-2025", points: 32, year: 2025, quarter: 1 },
    ],
  },
  {
    id: 30,
    name: "Ibrahim Hassan",
    role: "Systems Administrator",
    avatarUrl: dicebear("Ibrahim Hassan"),
    activities: [
      { name: "[LAB] Linux Administration Lab", category: "Education", date: "14-Aug-2025", points: 16, year: 2025, quarter: 3 },
    ],
  },
  {
    id: 31,
    name: "Elena Kozlov",
    role: "AI Ethics Researcher",
    avatarUrl: dicebear("Elena Kozlov"),
    activities: [
      { name: "[REG] Responsible AI Panel", category: "Public Speaking", date: "06-Jun-2025", points: 64, year: 2025, quarter: 2 },
      { name: "[UNI] AI Policy & Governance Seminar", category: "University Partnership", date: "15-Oct-2025", points: 64, year: 2025, quarter: 4 },
      { name: "[EDU] Ethics in Tech Workshop", category: "Education", date: "03-Dec-2025", points: 32, year: 2025, quarter: 4 },
    ],
  },
  {
    id: 32,
    name: "Tomás Herrera",
    role: "Full Stack Developer",
    avatarUrl: dicebear("Tomás Herrera"),
    activities: [
      { name: "[REG] JavaScript Summit Talk", category: "Public Speaking", date: "17-Apr-2025", points: 48, year: 2025, quarter: 2 },
      { name: "[LAB] Full Stack Bootcamp Mentor", category: "Education", date: "26-Nov-2025", points: 48, year: 2025, quarter: 4 },
    ],
  },
  {
    id: 33,
    name: "Akemi Watanabe",
    role: "Robotics Engineer",
    avatarUrl: dicebear("Akemi Watanabe"),
    activities: [
      { name: "[UNI] Robotics Engineering Program", category: "University Partnership", date: "22-May-2025", points: 64, year: 2025, quarter: 2 },
      { name: "[REG] Automation Industry Talk", category: "Public Speaking", date: "08-Nov-2025", points: 48, year: 2025, quarter: 4 },
    ],
  },
  {
    id: 34,
    name: "Pierre Fontaine",
    role: "Enterprise Architect",
    avatarUrl: dicebear("Pierre Fontaine"),
    activities: [
      { name: "[REG] Enterprise Integration Patterns Talk", category: "Public Speaking", date: "20-Mar-2025", points: 64, year: 2025, quarter: 1 },
      { name: "[UNI] Business Technology Lecture", category: "University Partnership", date: "11-Sep-2025", points: 48, year: 2025, quarter: 3 },
    ],
  },
  {
    id: 35,
    name: "Mei Lin",
    role: "Junior QA Engineer",
    avatarUrl: dicebear("Mei Lin"),
    activities: [
      { name: "[EDU] Manual Testing Fundamentals", category: "Education", date: "13-Jun-2025", points: 16, year: 2025, quarter: 2 },
    ],
  },
];

function buildParticipants(): Participant[] {
  const built = raw.map((p) => ({
    ...p,
    totalScore: p.activities.reduce((s, a) => s + a.points, 0),
    categoryStats: buildCategoryStats(p.activities),
    rank: 0,
  }));
  built.sort((a, b) => b.totalScore - a.totalScore);
  built.forEach((p, i) => { p.rank = i + 1; });
  return built;
}

export const participants: Participant[] = buildParticipants();
