const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleWare
app.use(
  cors({
    origin: [
      "http://localhost:5174",
      "http://localhost:5173",
      "https://ass-11-jwt.web.app",
      "https://ass-11-jwt.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// json middleware
const logger = (req, res, next) => {
  console.log("log info", req.method, req.url);
  next();
};

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  console.log("token in middleware", token);
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

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
  const allCommentsCollection = client
    .db("ass_11_jwt")
    .collection("allComments");
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

    //  Api for Auth
    app.post("/jwtS", logger, async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.TOKEN_SECRET, {
        expiresIn: "1h",
      });
      console.log(token);
      res
        .cookie("token", token, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
      // .cookie("token", token, {
      //   httpOnly: true,
      //   secure: true,
      //   sameSite: "none",
      // })
    });

    app.post("/logout", logger, async (req, res) => {
      const user = req.body;
      console.log("logout", user);
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

    app.get("/category", async (req, res) => {
      const result = await categoryCollection.find().toArray();
      res.send(result);
    });

    //allCommentsCollection
    app.get("/comments/:id", async (req, res) => {
      const ids = req.params.id;
      const query = { id: ids };
      const result = await allCommentsCollection.find(query).toArray();
      res.send(result);
    });

    // get blogs for wishlist / wishlistCollection
    app.get("/wishlistBlogs", logger, verifyToken, async (req, res) => {
      const email = req.query?.email;
      const query = { wishlist_email: email };
      // if (req.user.email !== req.query.email) {
      //   return res.status(403).send({ message: "forbidden access" });
      // }
      // let query = {};
      // if (req.query?.email) {
      //   query = { email: req.query.email };
      // }
      const result = await wishlistCollection.find(query).toArray();
      res.send(result);
    });

    // for home page / allBlogsCollection
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

    // for Details page /allBlogsCollection
    app.get("/detailsBlogs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await allBlogsCollection.findOne(query);
      res.send(result);
    });
    // Details page for wishlist // wishlistCollection
    app.get("/detailsWishlist/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await wishlistCollection.findOne(query);
      res.send(result);
    });

    // for Update page / wishlistCollection
    app.get("/updateBlog/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await wishlistCollection.findOne(query);
      console.log(id, result);
      res.send(result);
    });


// for featured Post / allBlogsCollection
    app.get("/tenBlogs", async (req, res) => {
        const result = await allBlogsCollection
          .find()
          .project({
            title: 1,
            photoURL: 1,
            displayName: 1,
            long_desc: 1,
            _id: 1,
          })
          .toArray();
        const sortedResult = result.sort((a, b) => b.long_desc.length - a.long_desc.length );
        const sliceResult = sortedResult.slice(0, 10);
        res.send(sliceResult);
    });
    
    // for all blog page / allBlogsCollection
    app.get("/allBlogs", async (req, res) => {
      const title = req.query.title || "";
      const category = req.query.category || "All";
      if (req.user?.email !== req.query?.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
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
    app.post("/allBlogs",  async (req, res) => {
      const data = req.body;
      console.log(data)
      const result = await allBlogsCollection.insertOne(data);
      res.send(result);
    });

    // post Wishlist blogs
    app.post("/wishlistBlogs",  async (req, res) => {
      const blogs = req.body;
      const result = await wishlistCollection.insertOne(blogs);
      res.send(result);
    });

    // Comment Collection for all
    app.post("/allComment", async (req, res) => {
      const comment = req.body;
      console.log(comment);
      const result = await allCommentsCollection.insertOne(comment);
      console.log(result);
      res.send(result);
    });

    // delete wishlist
    app.delete("/wishlistBlogs", async (req, res) => {
      const id = req.params.id;
      const result = await wishlistCollection.deleteOne(id);
      res.send(result);
    });

    // update blog
    app.put("/updateBlog/:id", async (req, res) => {
      const id = req.params.id;
      const blog = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateBlog = {
        $set: {
          title: blog.title,
          image: blog.image,
          short_desc: blog.short_desc,
          category: blog.category,
          long_desc: blog.long_desc,
          email: blog.email,
          photoURL: blog.photoURL,
          displayName: blog.displayName,
          postedTime: blog.postedTime,
        },
      };
      const result = await allBlogsCollection.updateOne(
        filter,
        updateBlog,
        options
      );
      console.log(id, blog, result);
      res.send(result);
    });

    // update blog for wishList
    app.put("/updateBlogWishlist/:id", async (req, res) => {
      const id = req.params.id;
      const blog = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateBlog = {
        $set: {
          title: blog.title,
          image: blog.image,
          short_desc: blog.short_desc,
          category: blog.category,
          long_desc: blog.long_desc,
          email: blog.email,
          postedTime: blog.postedTime,
        },
      };
      const result = await wishlistCollection.updateOne(
        filter,
        updateBlog,
        options
      );
      console.log(id, blog, result);
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
