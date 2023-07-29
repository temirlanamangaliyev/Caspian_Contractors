import Web3 from "web3";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";

dotenv.config();

const app = express();
const port = 3001;
const mongoUrl = process.env.MONGO_URI;
const infuraApiKey = process.env.INFURA_API_KEY; // Get ur own INFURA_API_KEY
const usdtContractAddress = "0xdac17f958d2ee523a2206206994597c13d831ec7"; // Set as example

mongoose
  .connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

const web3 = new Web3(`https://mainnet.infura.io/v3/${infuraApiKey}`);

const ethereumEventLogSchema = new mongoose.Schema({
  address: { type: String, required: false },
  blockHash: { type: String, required: false },
  data: { type: String, required: false },
  removed: { type: Boolean, required: false },
  topics: { type: [String], required: false },
  transactionHash: { type: String, required: false },
});

const EthereumEventLogModel = mongoose.model(
  "EthereumEventLog",
  ethereumEventLogSchema
);

async function parseUSDTTransfers(fromBlockNumber, toBlockNumber) {
  const filter = {
    address: usdtContractAddress,
    fromBlock: fromBlockNumber,
    toBlock: toBlockNumber,
    topics: [web3.utils.sha3("Transfer(address,address,uint256)")],
  };

  const logs = await web3.eth.getPastLogs(filter);

  return logs;
}

app.get("/usdtTransfers", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 10;

  try {
    const totalLogs = await EthereumEventLogModel.countDocuments(); // Get total count for pagination
    const logs = await EthereumEventLogModel.find()
      .skip((page - 1) * perPage) // Skip documents based on the page number
      .limit(perPage); // Limit the number of documents per page

    res.json({
      logs,
      currentPage: page,
      totalPages: Math.ceil(totalLogs / perPage),
      totalLogs,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/usdtTransfers/sync", async (req, res) => {
  try {
    const fromBlockNumber = parseInt(req.query.fromBlock);
    const toBlockNumber = parseInt(req.query.toBlock);

    if (isNaN(fromBlockNumber) || isNaN(toBlockNumber)) {
      return res.status(400).json({ error: "Invalid block numbers" });
    }

    const eventsData = await parseUSDTTransfers(fromBlockNumber, toBlockNumber);

    await EthereumEventLogModel.insertMany(eventsData);
    console.log("Data with logs inserted successfully");

    res.sendStatus(200);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
