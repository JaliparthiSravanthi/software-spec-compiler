import { EvaluationItem } from "./types";

export const EVALUATION_SUITE: EvaluationItem[] = [
  // 10 Real Product Prompts
  {
    id: "prod_crm",
    title: "Enriched CRM System",
    category: "standard",
    complexity: "Complex",
    expectedRoles: ["Admin", "Manager", "SalesAgent"],
    expectedEntities: ["clients", "deals", "communications"],
    prompt: "Build a robust CRM with login, contacts, a sales funnel pipeline dashboard, role-based access for agents and managers, and a premium plan with Stripe payments validation. Admin roles can access critical business intelligence graphs."
  },
  {
    id: "prod_lms",
    title: "Learning Hub Academy",
    category: "standard",
    complexity: "Complex",
    expectedRoles: ["Admin", "Instructor", "Student"],
    expectedEntities: ["courses", "enrollments", "lessons", "submissions"],
    prompt: "Create an e-learning course catalog system. Students can enroll in lectures and submit assignments. Instructors can publish modules, upload reference materials, and grade homework. Admin audits enrollment billing charts."
  },
  {
    id: "prod_inventory",
    title: "Bento Warehouse Manager",
    category: "standard",
    complexity: "Medium",
    expectedRoles: ["Admin", "WarehouseStaff"],
    expectedEntities: ["inventory_items", "suppliers", "stock_logs"],
    prompt: "An inventory tracker for multiple warehousing depots. Warehouse staff can log items, adjust stock count, assign categories, and generate low-stock alerts. Admin roles manage supplier directories and purchase logs."
  },
  {
    id: "prod_bugtrack",
    title: "Sentry Bug Tracker",
    category: "standard",
    complexity: "Medium",
    expectedRoles: ["Admin", "Developer", "QA_Tester"],
    expectedEntities: ["tickets", "projects", "comments"],
    prompt: "A bug and ticket tracking software. QA testers submit bug tickets with urgency tags. Developers assign tickets to themselves and mark status as resolved. Managers view epic timeline tracking and team productivity speed run sheets."
  },
  {
    id: "prod_medspa",
    title: "Glow Medical Clinic Portal",
    category: "standard",
    complexity: "Medium",
    expectedRoles: ["Patient", "Doctor", "FrontDesk"],
    expectedEntities: ["appointments", "prescriptions", "patient_records"],
    prompt: "A medical clinic dashboard where patients can book skincare appointment slots and upload history. Doctors can record patient charts and write prescription notes securely. FrontDesk manages cancellation slots."
  },
  {
    id: "prod_hr",
    title: "PeopleOps HR Portal",
    category: "standard",
    complexity: "Complex",
    expectedRoles: ["HR_Manager", "Employee"],
    expectedEntities: ["employees", "time_off_requests", "payrolls"],
    prompt: "An HR portal tracking timesheets, employees, and payrolls. Employees request annual leave and view historical pay slips. HR managers approve leave requests and submit monthly payroll payouts."
  },
  {
    id: "prod_ecom",
    title: "Aura Boutique Storefront",
    category: "standard",
    complexity: "Complex",
    expectedRoles: ["Admin", "Shopper"],
    expectedEntities: ["products", "cart_items", "orders", "reviews"],
    prompt: "An e-commerce store with an interactive cart, listing products with tags and dynamic search filters. Users can place orders. Admin dashboard manages product pricing tiers and tracks revenue statistics."
  },
  {
    id: "prod_workout",
    title: "FitPulse Gym Engine",
    category: "standard",
    complexity: "Simple",
    expectedRoles: ["Trainer", "Client"],
    expectedEntities: ["workouts", "routines", "progress_logs"],
    prompt: "A workout dashboard where personal trainers build routines and assign them to clients. Clients log weight repetitions and check off daily hydration goals with streaks tracker."
  },
  {
    id: "prod_realestate",
    title: "Haven Estate Platform",
    category: "standard",
    complexity: "Medium",
    expectedRoles: ["Agent", "Buyer"],
    expectedEntities: ["listings", "leads", "viewings"],
    prompt: "A housing real estate directory. Agents lists houses with pricing, media links, and open-house calendars. Buyers can filter listings by dimensions or zip code, and book viewing sessions."
  },
  {
    id: "prod_saas",
    title: "Sentry Log Platform",
    category: "standard",
    complexity: "Complex",
    expectedRoles: ["Admin", "Developer"],
    expectedEntities: ["projects", "log_buckets", "api_keys"],
    prompt: "A SaaS developer analytics platform capturing application runtime logs. Developers register code bases, generate API keys, and monitor logs. Admin handles user quotas and lists Stripe accounts."
  },

  // 10 Edge Cases
  {
    id: "edge_vague_1",
    title: "Vague: 'make a cool startup'",
    category: "edge-case",
    complexity: "Simple",
    expectedRoles: ["Admin", "User"],
    expectedEntities: ["ideas", "feedbacks"],
    prompt: "I want a cool software startup platform. It should have some dashboard, visual metrics, cards, and allow people to login and click cool buttons to do actions."
  },
  {
    id: "edge_vague_2",
    title: "Vague: 'just a black screen'",
    category: "edge-case",
    complexity: "Simple",
    expectedRoles: ["Admin"],
    expectedEntities: ["system_nodes"],
    prompt: "Make me a simple terminal dark environment to store system node configs."
  },
  {
    id: "edge_conflict_1",
    title: "Conflict: Read-only Write page",
    category: "edge-case",
    complexity: "Medium",
    expectedRoles: ["Guest", "Editor"],
    expectedEntities: ["documents"],
    prompt: "An document hub that is strictly READ-ONLY and accepts zero user form inputs or database saves, but guests must have access to a form page where they write documents directly to the ledger database."
  },
  {
    id: "edge_conflict_2",
    title: "Conflict: Invisible Admin Page",
    category: "edge-case",
    complexity: "Medium",
    expectedRoles: ["Admin", "Guest"],
    expectedEntities: ["reports"],
    prompt: "Build an system where Admins manage reports, but Admins are completely restricted from accessing any routes and guests can view and delete all admin logs."
  },
  {
    id: "edge_incomplete_1",
    title: "Incomplete: 'ecom platform...'",
    category: "edge-case",
    complexity: "Medium",
    expectedRoles: ["Shopper"],
    expectedEntities: ["carts"],
    prompt: "Create an e-commerce platform that"
  },
  {
    id: "edge_incomplete_2",
    title: "Incomplete: 'a calendar app with'",
    category: "edge-case",
    complexity: "Simple",
    expectedRoles: ["Organizer"],
    expectedEntities: ["events"],
    prompt: "A beautiful interactive reservation calendar app with"
  },
  {
    id: "edge_vague_3",
    title: "Vague: 'something like netflix'",
    category: "edge-case",
    complexity: "Medium",
    expectedRoles: ["Viewer", "Admin"],
    expectedEntities: ["movies", "watchlist"],
    prompt: "A platform like netflix but for software tutorials."
  },
  {
    id: "edge_conflict_3",
    title: "Conflict: Unlimited limit caps",
    category: "edge-case",
    complexity: "Medium",
    expectedRoles: ["User"],
    expectedEntities: ["records"],
    prompt: "Create a system where users can store unlimited items, but are strict gated to exactly 5 items maximum ever."
  },
  {
    id: "edge_vague_4",
    title: "Vague: 'Calculator with roles'",
    category: "edge-case",
    complexity: "Simple",
    expectedRoles: ["Mathematician", "Student"],
    expectedEntities: ["equations"],
    prompt: "A system with standard math calculator layout and strict role base permissions on equations history."
  },
  {
    id: "edge_incomplete_3",
    title: "Incomplete: CRM where user is",
    category: "edge-case",
    complexity: "Medium",
    expectedRoles: ["Admin"],
    expectedEntities: ["companies"],
    prompt: "Build a CRM where users can add business leads but"
  }
];
