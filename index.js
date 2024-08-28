const express = require("express");
const passport = require("./handlers/googleSignInHandler");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const { Pool } = require("pg");
const dbConfig = require("./read_replica_config");
const NodeCache = require("node-cache");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { handleFormSubmission } = require("./handlers/trainingHandler");
const { internshipFormSubmission } = require("./handlers/internshipHandler");
const next = require("next");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const pool = new Pool(dbConfig);

app.set("view engine", "ejs");

// Middleware for parsing JSON and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

const JWT_SECRET = process.env.JWT_Secret_Key;
const cacheTTL = 60; // in seconds
const cache = new NodeCache({ stdTTL: cacheTTL });

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const dev = process.env.NODE_ENV !== "production";
const server = next({ dev });
const handle = server.getRequestHandler();

function isAuthenticated(req, res, next) {
  const token = req.cookies["userAdminToken"];
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error("Token verification failed:", err);
        return res.redirect("/login");
      } else {
        req.user = decoded;
        return next();
      }
    });
  } else {
    console.error("No token found");
    return res.redirect("/login");
  }
}

app.get("/", (req, res) => {
  if (req.isAuthenticated() || req.cookies["userAdminToken"]) {
    return res.redirect("/myDashboard");
  }
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  if (req.isAuthenticated() || req.cookies["userAdminToken"]) {
    return res.redirect("/myDashboard");
  }
  const error = req.query.error;
  res.render("login", { error });
});

app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  const bypassPaths = [
    "/login",
    "/error",
    "/auth/google",
    "/auth/google/callback",
    "/studentReport",
    "/StudentReportSample",
    "/api/student_report_scores/averages",
    "/api/student_report_scores/scores",
    "/api/student_report_scores/score-differences",
    "/api/student_report_user/user",
    "/api/student_report_user/data",
    "/api/student_report_user/data/student_comment_data"
  ];

  if (bypassPaths.includes(req.path)) {
    return next();
  }
  return isAuthenticated(req, res, next);
});

function loadRoutesFromDir(dir, baseRoute = "/api") {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      loadRoutesFromDir(fullPath, `${baseRoute}/${file}`);
    } else if (file.endsWith(".js")) {
      const routePath = `${baseRoute}/${file.split(".")[0]}`;
      const router = require(fullPath);

      if (typeof router === "function") {
        app.use(routePath, router);
      } else {
        console.error(`Invalid router object in file ${file}`);
      }
    }
  });
}

// Initialize routes from the main "routes" directory
const apiRoutesDir = path.join(__dirname, "routes");
loadRoutesFromDir(apiRoutesDir);

const viewsDir = path.join(__dirname, "views");
const viewFiles = fs.readdirSync(viewsDir);

viewFiles.forEach((file) => {
  if (file.endsWith(".ejs")) {
    const viewName = path.parse(file).name;
    if (viewName !== "adminPage") {
      const routePath = `/${viewName}`;
      app.get(routePath, (req, res) => {
        res.render(viewName, { user: req.user });
      });
    }
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT username, password, code, college_id, role FROM report.admins WHERE username = $1 AND password = $2",
      [username, password]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const token = jwt.sign(
        {
          email: user.username,
          code: user.code,
          college: user.college_id,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.cookie("userAdminToken", token, {
        httpOnly: false,
        maxAge: 3600000,
        path: "/", // Ensure the path is set to root
      });

      console.log("Login successful for user:", user.username);
      console.log("Saved college_id:", user.college_id);

      const redirectPath = user.role === "InternshipsAdmin" ? "/internshipsDashboard" :
                           user.role === "EmployabilityAdmin" ? "/employabilityReport" :
                           user.role === "SuperAdmin" ? "/employabilityReport" :
                           "/myDashboard";
                           
      return res.redirect(redirectPath);
    } else {
      return res.redirect("/login?error=invalid_credentials");
    }
  } catch (error) {
    return res.status(500).send("Internal Server Error");
  }
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get("/auth/google/callback", (req, res, next) => {
  passport.authenticate("google", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect("/login");
    }

    const userEmail = user.emails[0].value.toLowerCase().trim();
    pool.query(
      "SELECT username, code, college_id, role FROM report.admins WHERE username = $1",
      [userEmail],
      (err, result) => {
        if (err) {
          console.error("Error querying database:", err);
          return res.status(500).send("Internal Server Error");
        }

        if (result.rows.length > 0) {
          const { username, code, college_id, role } = result.rows[0];
          if (
            role === "masterAdmin" ||
            role === "collegeAdmin" ||
            role === "InternshipsAdmin"
          ) {
            const token = jwt.sign(
              { email: userEmail, code, college: college_id, role },
              JWT_SECRET,
              { expiresIn: "1h" }
            );

            res.cookie("userAdminToken", token, {
              httpOnly: false,
              maxAge: 3600000,
            });

            return res.redirect("/myDashboard");
          } else {
            return res.redirect("/login");
          }
        } else {
          return res.redirect("/login");
        }
      }
    );
  })(req, res, next);
});

app.get("/logout", (req, res) => {
  console.log("Logging out user");
  res.clearCookie("userAdminToken", { path: "/" });
  console.log("Cleared userAdminToken cookie");
  res.redirect("/login");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  return res.status(500).send("Something broke!");
});

app.post("/submit", upload.single("banner_image"), handleFormSubmission);
app.post("/internship_submit", upload.single("banner_image"), internshipFormSubmission);

app.get("/success", (req, res) => {
  res.render("trainingsDashboard", { user: req.user });
});

server.prepare().then(() => {
  app.all("/company/:path*", (req, res) => handle(req, res));
  app.all("/company", (req, res) => handle(req, res));
  app.all("/compare", (req, res) => handle(req, res));
  app.all("/myDashboard", (req, res) => handle(req, res));
  app.all("/_next/*", (req, res) => handle(req, res));
  app.all("/_next", (req, res) => handle(req, res));

  const port = process.env.PORT || 4004;
  app.listen(port, () => {
    console.log(`App listening on port ${port}`);
  });
});
