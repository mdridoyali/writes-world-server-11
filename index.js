const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleWare
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.ASS_DB_USER}:${process.env.ASS_DB_PASS}@cluster0.w9fev91.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  const categoryCollection = client.db("ass_11_jwt").collection("category");
  const allBlogsCollection = client.db("ass_11_jwt").collection("allBlogs");

  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    app.get("/category", async (req, res) => {
      const result = await categoryCollection.find().toArray();
      res.send(result);
    });

    app.get('/allBlogs', async (req, res) => {
      const title = req.query.title || ''; 
      const category = req.query.category || 'All'; 

      const query = {};
      if (title) {
        query.title = new RegExp(title, 'i'); 
      }
      if (category !== 'All') {
        query.category = category;
      }
      const blogs = await allBlogsCollection.find(query).toArray();
      res.send(blogs);
    });
    
    app.post("/allBlogs", async (req, res) => {
      const data = req.body;
      console.log(data);
      const result = await allBlogsCollection.insertOne(data)
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Crud is running...");
});

app.listen(port, () => {
  console.log(`Crud in running on port ${port}`);
});
