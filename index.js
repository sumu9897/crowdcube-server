const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3530;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gffyd.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("crowdcubedb");
    const campaignCollection = db.collection("campaign");
    const donationCollection = db.collection("donated");
    const userCollection = db.collection("users");

    // ----------- Campaign Endpoints -----------
    // Get all campaigns or filter by userEmail
    app.get("/campaign", async (req, res) => {
      const email = req.query.userEmail;
      try {
        const query = email ? { userEmail: email } : {};
        const campaigns = await campaignCollection.find(query).toArray();
        res.send(campaigns);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch campaigns" });
      }
    });

    // Get campaign by ID
    app.get("/campaign/:id", async (req, res) => {
      try {
        const campaign = await campaignCollection.findOne({
          _id: new ObjectId(req.params.id),
        });
        if (!campaign) return res.status(404).send({ error: "Campaign not found" });
        res.send(campaign);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch campaign" });
      }
    });

    // Add a new campaign
    app.post("/campaign", async (req, res) => {
      try {
        const result = await campaignCollection.insertOne(req.body);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to add campaign" });
      }
    });

    // Update campaign
    app.put("/campaign/:id", async (req, res) => {
      try {
        const updatedData = req.body;

        // Ensure `deadline` is stored as a Date object if needed
        if (updatedData.deadline) {
          updatedData.deadline = new Date(updatedData.deadline);
        }

        const result = await campaignCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: updatedData }
        );

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to update campaign" });
      }
    });

    // Delete campaign
    app.delete("/campaign/:id", async (req, res) => {
      try {
        const result = await campaignCollection.deleteOne({
          _id: new ObjectId(req.params.id),
        });
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to delete campaign" });
      }
    });

    // Get campaigns for a specific user
    app.get("/user/campaigns", async (req, res) => {
      const email = req.query.email;
      try {
        const campaigns = await campaignCollection.find({ userEmail: email }).toArray();
        res.send(campaigns);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch user campaigns" });
      }
    });

    // ----------- Donation Endpoints -----------

    // Add a donation
    app.post("/donate", async (req, res) => {
        try {
        const donation = req.body;
        console.log("Received donation:", donation);
    
        const result = await donationCollection.insertOne(donation);
        res.send(result);
        } catch (error) {
        res.status(500).send({ error: "Failed to add donation" });
        }
    });
  


    // Get donations by user email
    app.get("/myDonations", async (req, res) => {
        const email = req.query.email;
        try {
          const donations = await donationCollection.find({ userEmail: email }).toArray();
          res.send(donations);
        } catch (error) {
          res.status(500).send({ error: "Failed to fetch donations" });
        }
      });

      

    // ----------- User Endpoints -----------
    // Add or update a user
    app.put("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const update = { $set: user };
      const options = { upsert: true };
      try {
        const result = await userCollection.updateOne(query, update, options);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to upsert user" });
      }
    });

    // Get user by email
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      try {
        const user = await userCollection.findOne({ email });
        res.send(user);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch user" });
      }
    });

    // ----------- Health Check -----------
    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error("Error in MongoDB connection or setup:", error);
  }
}

run().catch(console.dir);

// Server listening
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  await client.close();
  process.exit(0);
});
