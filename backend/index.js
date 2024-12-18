const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const archiver = require('archiver');
const {
  v4: uuidv4
} = require('uuid');

const app = express();
const PORT = 5000;
const corsOptions = {
  origin: 'https://img-process-client.vercel.app',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // If you need to allow cookies or auth headers
};
app.use(cors(corsOptions));
const storage = multer.memoryStorage();
const upload = multer({
  storage
});
async function processImage(fileBuffer, originalName, tempFolder) {
  try {
    const isFeature = originalName.toLowerCase().includes('feature');
    const newWidth = isFeature ? 1270 : 1015;
    let formattedFileName = originalName.trim();
    formattedFileName = formattedFileName.replace(/\s+/g, '-');
    formattedFileName = path.parse(formattedFileName).name + '.webp'; 
    const outputPath = path.join(tempFolder, formattedFileName);

    let quality = 80;
    let outputBuffer;

    do {
      outputBuffer = await sharp(fileBuffer)
        .resize({
          width: newWidth
        })
        .webp({
          quality
        })
        .toBuffer();

      if (outputBuffer.length > 200 * 1024) {
        quality -= 10;
      }
    } while (outputBuffer.length > 200 * 1024 && quality > 10);
    fs.writeFileSync(outputPath, outputBuffer);
    return {
      fileName: formattedFileName,
      size: outputBuffer.length
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
}

function createZip(tempFolder, userId) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(path.join(tempFolder, `${userId}.zip`));
    const archive = archiver('zip', {
      zlib: {
        level: 9
      }
    });

    archive.pipe(output);
    archive.directory(tempFolder, false);
    archive.finalize();

    output.on('close', () => resolve());
    output.on('error', (err) => reject(err));
  });
}

app.get('/', (req, res) => {
  res.send('CORS is configured!');
});
app.post('/upload', upload.array('images', 10), async (req, res) => {
  try {
    const { files } = req;
    if (!files || files.length === 0) {
      return res.status(400).json({
        message: 'No images uploaded.'
      });
    }
    const userId = uuidv4();
    const tempFolder = path.join(__dirname, 'temp', userId);
    if (!fs.existsSync(tempFolder)) {
      fs.mkdirSync(tempFolder, { recursive: true });
    }

    const results = [];
    for (let file of files) {
      const result = await processImage(file.buffer, file.originalname, tempFolder);
      results.push(result);
    }

    res.status(200).json({
      message: 'Images processed successfully.',
      results,
      userId: userId,
      downloadLink: `/download/${userId}`, 
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error processing images.',
      error
    });
  }
});

app.get('/download/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const tempFolder = path.join(__dirname, 'temp', userId);

    if (!fs.existsSync(tempFolder)) {
      return res.status(404).send('User folder not found.');
    }

    const zipFilePath = path.join(tempFolder, `${userId}.zip`);
    await createZip(tempFolder, userId);

    res.download(zipFilePath, `${userId}.zip`, (err) => {
      if (err) {
        console.error('Error downloading ZIP:', err);
        return;
      }
    });
  } catch (error) {
    console.error('Error creating ZIP:', error);
    res.status(500).send('Error creating ZIP');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
