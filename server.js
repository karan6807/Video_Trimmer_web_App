const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

const SUPPORTED_FORMATS = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm'];


app.use(cors());
app.use(express.json());

// Multer setup to store uploaded files in "uploads" folder
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// API: Upload and trim video
app.post('/trim', upload.single('video'), (req, res) => {
    const { startTime, endTime } = req.body;
    const inputPath = req.file.path;
    const ext = path.extname(inputPath).toLowerCase();
    if (!SUPPORTED_FORMATS.includes(ext)) {
        return res.status(400).json({ error: `Unsupported format: ${ext}. Supported formats: ${SUPPORTED_FORMATS.join(', ')}` });
    }

    const outputFilename = `trimmed-${Date.now()}.mp4`;
    const outputPath = path.join('trimmed', outputFilename);

    ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(endTime - startTime)
        .output(outputPath)
        .on('end', () => {
            console.log('🎉 Trimmed successfully!');
            // Send URL path for frontend to access trimmed video
            res.json({ message: 'Video trimmed!', trimmedVideo: `/trimmed/${outputFilename}` });
        })
        .on('error', (err) => {
            console.error('❌ FFmpeg error:', err);
            res.status(500).json({ error: 'Failed to trim video' });
        })
        .run();
});

// Serve trimmed files statically from /trimmed URL
app.use('/trimmed', express.static('trimmed'));

// Serve index.html and other static files from project root
app.use(express.static(__dirname));

// Optional: Serve index.html when visiting root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
