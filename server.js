
"use strict";

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const { createDatabase } = require("./src/database");

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize SQLite database
const db = createDatabase();

// Security headers and Content Security Policy
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"]
      }
    }
  })
);

// Request body limit
app.use(express.json({ limit: "20kb" }));

// API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please try again later."
  }
});

app.use("/api", apiLimiter);

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "InternshipHub API is running"
  });
});

// Get and search internship opportunities
app.get("/api/opportunities", (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();

    let records;

    if (search) {
      const term = `%${search}%`;

      records = db.prepare(`
        SELECT *
        FROM opportunities
        WHERE status = ?
        AND (
          title LIKE ?
          OR company LIKE ?
          OR location LIKE ?
          OR skills LIKE ?
        )
        ORDER BY id
      `).all("open", term, term, term, term);
    } else {
      records = db.prepare(`
        SELECT *
        FROM opportunities
        WHERE status = ?
        ORDER BY id
      `).all("open");
    }

    const data = records.map(row => ({
      id: row.id,
      title: row.title,
      company: row.company,
      location: row.location,
      workMode: row.work_mode,
      skills: JSON.parse(row.skills || "[]"),
      description: row.description,
      status: row.status,
      applyUrl: row.apply_url || ""
    }));

    res.json({ data });

  } catch (error) {
    next(error);
  }
});

// Get one internship
app.get("/api/opportunities/:id", (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        error: "Invalid opportunity ID"
      });
    }

    const row = db.prepare(`
      SELECT *
      FROM opportunities
      WHERE id = ? AND status = ?
    `).get(id, "open");

    if (!row) {
      return res.status(404).json({
        error: "Internship opportunity not found"
      });
    }

    res.json({
      data: {
        id: row.id,
        title: row.title,
        company: row.company,
        location: row.location,
        workMode: row.work_mode,
        skills: JSON.parse(row.skills || "[]"),
        description: row.description,
        status: row.status,
        applyUrl: row.apply_url || ""
      }
    });

  } catch (error) {
    next(error);
  }
});

// Validate application data on the server
function validateApplication(body) {
  const errors = {};

  const opportunityId = Number(body.opportunityId);
  const fullName = String(body.fullName || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();
  const coverLetter = String(body.coverLetter || "").trim();

  if (!Number.isInteger(opportunityId) || opportunityId < 1) {
    errors.opportunityId = "Please select a valid internship.";
  }

  if (fullName.length < 2 || fullName.length > 80) {
    errors.fullName = "Name must contain 2 to 80 characters.";
  }

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    errors.email = "Please enter a valid email address.";
  }

  if (phone.length > 20) {
    errors.phone = "Phone number is too long.";
  }

  if (coverLetter.length > 2000) {
    errors.coverLetter = "Cover letter cannot exceed 2000 characters.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: {
      opportunityId,
      fullName,
      email,
      phone,
      coverLetter
    }
  };
}

// Submit application
app.post("/api/applications", (req, res, next) => {
  try {
    const validation = validateApplication(req.body || {});

    if (!validation.valid) {
      return res.status(400).json({
        error: "Please correct the application details.",
        fields: validation.errors
      });
    }

    const {
      opportunityId,
      fullName,
      email,
      phone,
      coverLetter
    } = validation.data;

    const opportunity = db.prepare(`
      SELECT id
      FROM opportunities
      WHERE id = ? AND status = ?
    `).get(opportunityId, "open");

    if (!opportunity) {
      return res.status(404).json({
        error: "Internship opportunity not found or closed."
      });
    }

    const result = db.prepare(`
      INSERT INTO applications (
        opportunity_id,
        full_name,
        email,
        phone,
        cover_letter
      )
      VALUES (?, ?, ?, ?, ?)
    `).run(
      opportunityId,
      fullName,
      email,
      phone,
      coverLetter
    );

    res.status(201).json({
      message: "Application submitted successfully!",
      applicationId: Number(result.lastInsertRowid)
    });

  } catch (error) {
    next(error);
  }
});

// Frontend fallback
app.get("*", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "index.html")
  );
});

// Error handler
app.use((error, req, res, next) => {
  console.error("Application error:", error.message);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    error: "An internal server error occurred."
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`InternshipHub running on port ${PORT}`);
  });
}

module.exports = app;
