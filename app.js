const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fetch = require("node-fetch");
const session = require("express-session");

const app = express();

app.use(
  session({
    secret: "your_secret_key_here", // Replace with a secure secret key
    resave: false,
    saveUninitialized: true,
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Add this line to parse JSON data

app.use(cors());

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("pages/login");
});

app.get("/customers", (req, res) => {
  const accessToken = req.session.accessToken;

  if (!accessToken) {
    return res.redirect("/");
  }

  const options = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  async function getData() {
    const url =
      "https://qa2.sunbasedata.com/sunbase/portal/api/assignment.jsp?cmd=get_customer_list";
    try {
      const response = await fetch(url, options);
      const jsonResponse = await response.json();
      res.render("pages/customers", {
        userData: jsonResponse,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).send("Error fetching data");
    }
  }

  getData();
});

app.get("/add-customer", (req, res) => {
  res.render("pages/add_customer");
});

app.post("/login", async (req, res) => {
  const loginId = req.body.login_id;
  const password = req.body.password;

  const apiUrl =
    "https://qa2.sunbasedata.com/sunbase/portal/api/assignment_auth.jsp";

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {},
      body: JSON.stringify({ login_id: loginId, password: password }),
    });

    if (response.ok) {
      const data = await response.json();
      const accessToken = data.access_token;
      req.session.accessToken = accessToken;
      res.redirect("/customers");
    } else {
      // Handle the case when the API returns an error status code
      console.error("Error making API request:", response.statusText);
      res
        .status(response.status)
        .json({ error: "An error occurred while processing your request" });
    }

    // Assuming the API returns a successful response, redirect to "/customers"
  } catch (error) {
    console.error("Error making API request:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
});

app.post("/add-customer", async (req, res) => {
  const { firstName, lastName, street, address, city, state, email, phone } =
    req.body;

  const accessToken = req.session.accessToken;

  if (!accessToken) {
    return res.redirect("/");
  }

  const customerData = {
    first_name: firstName,
    last_name: lastName,
    street,
    address,
    city,
    state,
    email,
    phone,
  };

  console.log(JSON.stringify(customerData));

  try {
    const response = await fetch(
      "https://qa2.sunbasedata.com/sunbase/portal/api/assignment.jsp?cmd=create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(customerData),
      }
    );

    if (response.ok) {
      res.redirect("/customers");
    } else {
      const errorResponse = await response.json();
      res.render("pages/addcustomer", {
        error: errorResponse.message || "Error adding customer.",
      });
    }
  } catch (error) {
    console.error("Error adding customer:", error);
    res.render("pages/add_customer", { error: "Error adding customer." });
  }
});

app.post("/api/delete-user", async (req, res) => {
  const { uuid } = req.body;
  console.log(req.body);

  const accessToken = req.session.accessToken;

  if (!accessToken) {
    return res.redirect("/");
  }

  try {
    const response = await fetch(
      `https://qa2.sunbasedata.com/sunbase/portal/api/assignment.jsp?cmd=delete&uuid=${uuid}`,
      {
        method: "POST",
        headers: {
          // Replace 'YOUR_ACCESS_TOKEN' with your actual access token
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.ok) {
      // Deletion was successful
      res.json({ success: true });
    } else {
      // There was an error during deletion
      res
        .status(response.status)
        .json({ success: false, message: "Failed to delete user." });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Error deleting user." });
  }
});

app.post("/api/edit-user", async (req, res) => {
  try {
    const user = req.body; // The user object is already parsed by bodyParser

    const accessToken = req.session.accessToken;

    if (!accessToken) {
      return res.redirect("/");
    }

    const apiEndpoint = `https://qa2.sunbasedata.com/sunbase/portal/api/assignment.jsp?cmd=update&uuid=${req.body.uuid}`;

    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(req.body),
    });

    if (response.ok) {
      // Update was successful
      res.json({ success: true });
    } else {
      // There was an error during the update
      res
        .status(response.status)
        .json({ success: false, message: "Failed to update user." });
    }
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, message: "Error updating user." });
  }
});

app.listen("3000", () => console.log("listening on Port 3000"));
