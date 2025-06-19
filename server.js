require("dotenv").config();
const express = require("express");
const db = require("./databaseUtil");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("API is running");
});

//POST  /addSchool

app.post("/addSchool", (req, res) => {
  const { name, address, latitude, longitude } = req.body;

  //Validation

  if (!name || !address || !latitude || !longitude) {
    return res.status(400).json({ Message: "All fields are required." });
  }

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return res
      .status(400)
      .json({ Message: "Latitude and Longitude must be numbers." });
  }
  const query =
    "INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)";
  db.query(query, [name, address, latitude, longitude], (err, result) => {
    if (err) {
      console.error("Error adding school:", err);
      return res.status(500).json({ message: "Database error." });
    }
    console.log(name, address, latitude, longitude);
    res.status(201).json({
      message: "School added successfully",
      schoolId: result.insertId,
    });
  });
});

// Utility: Haversine distance
function getDistance(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// GET /listSchools
app.get("/listSchools", (req, res) => {
  const userLat = parseFloat(req.query.latitude);
  const userLon = parseFloat(req.query.longitude);

  if (isNaN(userLat) || isNaN(userLon)) {
    return res
      .status(400)
      .json({ message: "Valid latitude and longitude are required." });
  }

  db.query("SELECT * FROM schools", (err, results) => {
    if (err) {
      console.error("Error fetching schools:", err);
      return res.status(500).json({ message: "Database error." });
    }

    const sortedSchools = results
      .map((school) => ({
        ...school,
        distance: getDistance(
          userLat,
          userLon,
          school.latitude,
          school.longitude
        ),
      }))
      .sort((a, b) => a.distance - b.distance);
    res.json(sortedSchools);
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
