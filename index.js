const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
  const wishlistCollection = client
    .db("ass_11_jwt")
    .collection("wishlistBlogs");

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

    // get blogs for wishlist
    app.get("/wishlistBlogs", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.email = email;
      }
      const result = await wishlistCollection.find(query).toArray();
      res.send(result);
    });
    // for home page
    app.get("/blogsForHome", async (req, res) => {
      const result = await allBlogsCollection
        .find()
        .sort({ postedTime: -1 })
        .limit(6)
        .toArray();
      const formattedResult = result.map((blog) => {
        const postedTime = new Date(blog.postedTime);
        const formattedPostedTime = postedTime.toLocaleString("en-US", {
          year: "2-digit",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
        return {
          ...blog,
          postedTime: formattedPostedTime,
        };
      });

      res.send(formattedResult);
    });

    // for Details page
    app.get("/detailsBlogs/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await allBlogsCollection.findOne(query);
      // console.log(result);
      res.send(result);
    });
    // Details page for wishlist
    app.get("/detailsWishlist/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await wishlistCollection.findOne(query);
      console.log(result);
      res.send(result);
    });

    // get data for details route
    //  app.get("/product/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const result = await productsCollection.findOne(query);
    //   res.send(result);
    // });

    // for all blog page
    app.get("/allBlogs", async (req, res) => {
      const title = req.query.title || "";
      const category = req.query.category || "All";
      const query = {};
      if (title) {
        query.title = new RegExp(title, "i");
      }
      if (category !== "All") {
        query.category = category;
      }
      const result = await allBlogsCollection.find(query).toArray();
      const formattedResult = result.map((blog) => {
        const postedTime = new Date(blog.postedTime);
        const formattedPostedTime = postedTime.toLocaleString("en-US", {
          year: "2-digit",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
        return {
          ...blog,
          postedTime: formattedPostedTime,
        };
      });
      res.send(formattedResult);
    });

    // post all blogs
    app.post("/allBlogs", async (req, res) => {
      const data = req.body;
      console.log(data);
      const result = await allBlogsCollection.insertOne(data);
      res.send(result);
    });

    // post Wishlist blogs
    app.post("/wishlistBlogs", async (req, res) => {
      const blogs = req.body;
      const result = await wishlistCollection.insertOne(blogs);
      console.log(result);
      res.send(result);
    });

    // delete wishlist
    app.delete("/wishlistBlogs", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const result = await wishlistCollection.deleteOne(id) ;
      console.log(result);
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
