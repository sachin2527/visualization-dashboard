const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();  

const app = express(); 
app.use(bodyParser.json());
app.use(cors());

const connectionString = 'mongodb+srv://chaudhary2527:db.dashboard@cluster1.siqxiw3.mongodb.net/visualizationDb';

// Connect to MongoDB using the environment variable
mongoose.connect(connectionString, { 
  useNewUrlParser: true,
  useUnifiedTopology: true,
 })
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.log(err));

// Schema and Model
const dataSchema = new mongoose.Schema({
    id: Number,
    end_year: Number,
    intensity: Number,
    sector: String,
    topic: String,
    insight: String,
    url: String,
    region: String,
    start_year: String,
    impact: Number,
    added: String,
    published: String,
    country: String
});

// Define your Mongoose model
const DataModel = mongoose.model('Datum', dataSchema);

// API to get data
app.get('/api/data', async (req, res) => {
  try {
    const data = await DataModel.find({});
    res.json(data);
  } catch (error) {
    res.status(500).send(error);
  }
});

     

// Start server
app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
