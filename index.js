const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 3530;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gffyd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Main function to connect to MongoDB and set up routes
async function run() {
  try {
    // Connect the client to the server
    await client.connect();

    // Define the campaign collection
    const campaignCollection = client.db('crowdcubedb').collection('campaign');
    const userCollection = client.db('crowdcubedb').collection('users');

    app.get('/campaign', async (req, res) => {
        const cursor = campaignCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })

    app.get("/campaigns", async (req, res) => {
        try {
          const campaigns = await campaignCollection.find().toArray();
          res.send(campaigns);
        } catch (error) {
          res.status(500).send({ error: "Failed to fetch campaigns" });
        }
      });

      app.get('/campaign/:id', async (req, res) => {
        try {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await campaignCollection.findOne(query);
            if (!result) {
                return res.status(404).send({ message: "Campaign not found" });
            }
            res.send(result);
        } catch (error) {
            res.status(500).send({ error: "Failed to fetch campaign details" });
        }
    });
    
      

    // Route to handle adding a new campaign
    app.post('/campaign', async (req, res) => {
      const newCampaign = req.body;
      console.log('Adding New Campaign', newCampaign);
      const result = await campaignCollection.insertOne(newCampaign);
      res.send(result);
    });

    app.delete('/campaign/:id', async (req, res) =>{
        const id = req.params.id;
        const query ={_id: new ObjectId(id)}
        const result = await campaignCollection.deleteOne(query);
        res.send(result);
    })

    // Users Related Api
    app.post('/users', async(req,res)=>{
        const newUser = req.body;
        console.log('create new user', newUser);
        const result = await userCollection.insertOne(newUser);
        res.send(result);
    })



    // Route to confirm the server is running
    app.get('/', (req, res) => {
      res.send('Hello Boss, I am running');
    });

    // Confirm successful connection to MongoDB
    await client.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
  } catch (error) {
    console.error('Error in MongoDB connection or setup:', error);
  }
}

// Run the application
run().catch(console.dir);

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await client.close();
  process.exit(0);
});
