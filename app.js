const express = require('express');
const { BlobServiceClient } = require('@azure/storage-blob');
const { ComputerVisionClient } = require('@azure/cognitiveservices-computervision');
const { DefaultAzureCredential } = require('@azure/identity');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = 3000;

// Azure Cognitive Services credentials
const endpoint = process.env.AZURE_COMPUTER_VISION_ENDPOINT;

// Authenticating using DefaultAzureCredential (Azure Identity library)
const credentials = new DefaultAzureCredential();

// Providing the credentials and endpoint to the Computer Vision client
const computerVisionClient = new ComputerVisionClient(credentials, endpoint);


// Azure Blob Storage credentials
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = 'images'; // Change this to your container name

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

// Multer setup for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Endpoint to upload an image and analyze it
app.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    // console.log(req.body);
    // console.log(req.file);
    if (!req.file) {
      res.status(400).send('No image uploaded');
      return;
    }
    
    const file = req.file.buffer;
    // console.log(file);
    const fileName = req.file.originalname;


    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    await blockBlobClient.upload(file, file.length);

    const imageUrl = blockBlobClient.url;

    // Analyze the uploaded image using Azure Cognitive Services
    const analysis = await computerVisionClient.analyzeImage(imageUrl, {
      visualFeatures: ['Categories', 'Description', 'Color'],
      details: ['Celebrities']
    });

    res.json(analysis);
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
