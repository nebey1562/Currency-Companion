const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

// Connect to MongoDB (replace with your MongoDB cluster connection string)
mongoose.connect("mongodb+srv://21ad009:kezkez66@cluster0.28glt.mongodb.net/currency_companion?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.once("open", ()=> { console.log("Connected to MongoDB successfully")});
mongoose.connection.on("error", (err)=> { console.error("Error: ", err)});


const UserSchema = new mongoose.Schema({
  name: String,
  password: String,
  account_number: Number,
  account_balance: Number,
  enrollment_voice: String,
  voice_embeddings: [Number],
});

const User = mongoose.model("User", UserSchema, "users");

// API to deduct balance
app.get("/get-user", async (req, res) => {
    const { account_number } = req.query; // Get account_number from query params
  
    try {
      const user = await User.findOne({ account_number });
  
      if (!user) return res.status(404).json({ message: "User not found" });
  
      res.json({
        name: user.name,
        voice_embeddings: user.voice_embeddings,
        account_balance: user.account_balance
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  
app.post("/deduct-balance", async (req, res) => {
  const { account_number, amount } = req.body;
  console.log("Recieved request for ", account_number)

  try {
    const user = await User.findOne({ account_number });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.account_balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    user.account_balance -= amount;
    await user.save();

    res.json({ message: "Balance deducted successfully", account_balance: user.account_balance });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));