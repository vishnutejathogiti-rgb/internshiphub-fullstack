
const { DatabaseSync } = require("node:sqlite");

const seed = [
  {
    title: "Frontend Developer Intern",
    company: "Demo Technology",
    location: "Hyderabad, India",
    workMode: "hybrid",
    skills: ["HTML", "CSS", "JavaScript"],
    description: "Build responsive websites and learn frontend development."
  },
  {
    title: "Data Analyst Intern",
    company: "Demo Analytics",
    location: "Remote",
    workMode: "remote",
    skills: ["Python", "SQL", "Excel"],
    description: "Analyze data and prepare reports."
  },
  {
    title: "Backend Developer Intern",
    company: "Demo Software",
    location: "Bengaluru, India",
    workMode: "onsite",
    skills: ["Node.js", "REST API", "SQL"],
    description: "Learn backend development and database integration."
  },
  {
    title: "Digital Marketing Intern",
    company: "Demo Media",
    location: "Remote",
    workMode: "remote",
    skills: ["SEO", "Content", "Analytics"],
    description: "Help plan digital campaigns."
  },
  {
    title: "UI/UX Design Intern",
    company: "Demo Creative",
    location: "Hyderabad, India",
    workMode: "hybrid",
    skills: ["Figma", "Design", "Prototyping"],
    description: "Create user-friendly interfaces."
  }
];

function createDatabase(file = "internshiphub.db") {
  const db = new DatabaseSync(file);

  db.exec("PRAGMA foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS opportunities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      location TEXT NOT NULL,
      work_mode TEXT NOT NULL,
      skills TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      apply_url TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      opportunity_id INTEGER NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      cover_letter TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (opportunity_id)
        REFERENCES opportunities(id)
    );
  `);

  const count = db.prepare(
    "SELECT COUNT(*) AS total FROM opportunities"
  ).get();

  if (count.total === 0) {
    const insert = db.prepare(`
      INSERT INTO opportunities
      (title, company, location, work_mode, skills, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const job of seed) {
      insert.run(
        job.title,
        job.company,
        job.location,
        job.workMode,
        JSON.stringify(job.skills),
        job.description
      );
    }
  }

  return db;
}

module.exports = { createDatabase };
