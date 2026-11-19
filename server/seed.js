// Run once: npm run seed  -> creates the admin user and fills the site with your resume data
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { Admin, Profile, Milestone, Skill, Project, Certification } from './models/index.js';

await mongoose.connect(process.env.MONGO_URI);
await Promise.all([Admin, Profile, Milestone, Skill, Project, Certification].map((M) => M.deleteMany({})));

await Admin.create({ email: process.env.ADMIN_EMAIL, password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10) });

await Profile.create({
  name: 'Prajwal Mogaveera', title: 'Software Developer',
  roles: ['Frontend Developer', 'MERN Stack Developer', 'React.js Builder'],
  tagline: 'I turn business workflows into fast, friendly interfaces.',
  summary: 'Software Developer with 2+ years of experience building responsive, scalable web applications using the MERN stack (React.js, Node.js, MongoDB). Skilled in developing reusable UI components and integrating REST APIs to deliver efficient, user-focused enterprise solutions.',
  location: 'Yelachenahalli, Bengaluru', email: 'prajjumogaveera2001@gmail.com', phone: '9632906738',
  linkedin: 'https://linkedin.com/in/prajwal-mogaveera-0a9128252', github: 'https://github.com/Prajju-123', photo: '',
  softSkills: ['Communication', 'Problem Solving', 'Teamwork', 'Team Building'],
  languages: ['English', 'Hindi', 'Kannada'], hobbies: ['Cricket', 'Badminton'],
});

await Milestone.insertMany([
  { order: 1, kind: 'education', title: 'SSLC', org: 'Holy Rosary English Medium School', place: 'Kundapura', from: '2016', to: '', grade: '78.88%', story: 'Where the road begins.' },
  { order: 2, kind: 'education', title: 'PUC (PCMB)', org: 'R N Shetty PU College', place: 'Kundapura', from: '2016', to: '2018', grade: '66%', story: 'Physics, chemistry, maths, biology and a first taste of problem solving.' },
  { order: 3, kind: 'education', title: 'BCA', org: "Bhandarkars' Arts and Science College", place: 'Kundapura', from: '2019', to: '2022', grade: 'CGPA 7.42', story: 'First lines of code. Websites, databases and a lasting curiosity.' },
  { order: 4, kind: 'education', title: 'MCA', org: 'St Aloysius Institute of Management and Technology', place: 'Mangaluru', from: '2022', to: '2024', grade: 'CGPA 7.75', story: 'Went deeper: full stack projects, Python, and the MERN stack.' },
  { order: 5, kind: 'work', title: 'MERN Stack Developer', org: 'Zieers Systems Private Limited', place: 'Bengaluru', from: 'April 2024', to: 'August 2024', story: 'The first job, and the first product shipped to real users.', points: ['Built a scalable e-commerce platform using React.js, Node.js and MongoDB Atlas, covering frontend and server-side development.'] },
  { order: 6, kind: 'work', title: 'Frontend Developer', org: 'Kaapicat Beverages Private Limited', place: 'Bengaluru', from: 'September 2024', to: 'Present', story: 'Today: building enterprise web apps people use every day.', points: ['Develop responsive, reusable user interfaces with React.js for enterprise business web applications.', 'Integrate REST APIs to display real-time data and improve application performance.', 'Collaborate with backend teams to streamline data flow between modules and improve overall system performance.'] },
]);

await Skill.insertMany([
  { order: 1, category: 'Frontend', items: ['React.js', 'Angular', 'JavaScript', 'HTML', 'CSS', 'Bootstrap'] },
  { order: 2, category: 'Backend & Languages', items: ['Node.js', 'PHP', 'Python (Django)', 'Java', 'JavaScript', 'C', 'C++', 'C#', 'VB.NET', 'REST APIs'] },
  { order: 3, category: 'Databases & Tools', items: ['MongoDB', 'MySQL', 'PostgreSQL', 'Firebase', 'DBMS', 'Android Studio', 'Tableau'] },
]);

await Project.insertMany([
  { order: 1, title: 'HRMS', role: 'Frontend Developer', description: 'Responsive HR management interface covering employee profiles, attendance, leave management, payroll views and role-based dashboards.', tech: ['React.js'] },
  { order: 2, title: 'CRM Drive', role: 'Frontend Developer', description: 'Dashboard-style CRM tool for tracking leads, contacts and deals, with dynamic filtering, search, pipeline views and REST API integration for real-time data.', tech: ['React.js', 'REST APIs'] },
  { order: 3, title: 'AERP', role: 'Frontend Developer', description: 'Enterprise resource planning modules for inventory, procurement and reporting, with responsive dashboards that visualize business metrics.', tech: ['React.js'] },
  { order: 4, title: 'Supra Diary Software Products', role: 'MERN Stack Developer', description: 'Scalable e-commerce platform with server-side logic for product management, order processing and payment integration, backed by an efficient database design.', tech: ['React.js', 'Node.js', 'MongoDB Atlas'] },
  { order: 5, title: 'Scholarship Management System', role: 'Full Stack Developer', description: 'Web platform for managing scholarships, with a Python backend for processing applications and database interactions.', tech: ['Python'] },
  { order: 6, title: 'Style House Clothing Website', role: 'Frontend Developer', description: 'Dynamic, responsive e-commerce website with JavaScript functionality for an enhanced user experience.', tech: ['HTML', 'CSS', 'JavaScript'] },
]);

await Certification.insertMany([
  { order: 1, title: 'Computer Vision in Python: Face Detection and Image Processing', issuer: 'Udemy' },
  { order: 2, title: 'Tableau Visualization Tool', issuer: 'Springboard' },
]);

console.log('Seeded. Admin:', process.env.ADMIN_EMAIL);
await mongoose.disconnect();
