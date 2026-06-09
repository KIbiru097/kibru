const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { testConnection, query } = require('./src/config/database');
const { createApolloServer } = require('./src/graphql/apollo-server');

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 4000;

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    server: 'CampusHub GraphQL API'
  });
});

// File upload endpoint
app.post('/upload', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const jwt = require('jsonwebtoken');
    try {
      jwt.verify(authHeader.substring(7), process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check content type
    const contentType = req.headers['content-type'] || '';
    if (!contentType.startsWith('multipart/form-data') && !contentType.startsWith('application/octet-stream')) {
      // Handle base64 JSON upload
      if (contentType.startsWith('application/json')) {
        const { filename, data, mimetype } = req.body;
        if (!filename || !data) {
          return res.status(400).json({ error: 'Missing filename or data' });
        }

        const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/jpg,image/webp').split(',');
        if (mimetype && !allowedTypes.includes(mimetype)) {
          return res.status(400).json({ error: 'File type not allowed' });
        }

        const buffer = Buffer.from(data, 'base64');
        const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10485760;
        if (buffer.length > maxSize) {
          return res.status(400).json({ error: 'File too large' });
        }

        const ext = path.extname(filename) || '.jpg';
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
        const filePath = path.join(uploadDir, uniqueName);
        fs.writeFileSync(filePath, buffer);

        return res.json({
          url: `/uploads/${uniqueName}`,
          filename: uniqueName,
          mimetype: mimetype || 'image/jpeg',
          size: buffer.length
        });
      }
      return res.status(400).json({ error: 'Unsupported content type' });
    }

    // Handle raw binary upload
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10485760;
      if (buffer.length > maxSize) {
        return res.status(400).json({ error: 'File too large' });
      }

      const ext = req.headers['x-file-ext'] || '.jpg';
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
      const filePath = path.join(uploadDir, uniqueName);
      fs.writeFileSync(filePath, buffer);

      res.json({
        url: `/uploads/${uniqueName}`,
        filename: uniqueName,
        mimetype: req.headers['x-file-type'] || 'image/jpeg',
        size: buffer.length
      });
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Start server with GraphQL
const startServer = async () => {
  const apolloServer = await createApolloServer();
  
  const { expressMiddleware } = require('@apollo/server/express4');
  
  app.use('/graphql', express.json(), expressMiddleware(apolloServer, {
    context: async ({ req }) => {
      const authHeader = req.headers.authorization || '';
      let user = null;
      
      if (authHeader.startsWith('Bearer ')) {
        try {
          const jwt = require('jsonwebtoken');
          const token = authHeader.substring(7);
          user = jwt.verify(token, process.env.JWT_SECRET);

          // Fetch user roles from database for RBAC
          const result = await query(
            `SELECT roles FROM user_roles WHERE user_id = $1`,
            [user.userId]
          ).catch(() => ({ rows: [] }));
          
          user.roles = result.rows.map(r => r.roles || r.role).filter(Boolean);
          if (user.roles.length === 0) user.roles = ['student'];
        } catch (error) {
          console.log('Invalid token:', error.message);
        }
      }
      
      return { user };
    },
  }));
  
  httpServer.listen(PORT, async () => {
    console.log(`\n=================================`);
    console.log(`CampusHub GraphQL Server`);
    console.log(`=================================`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log(`GraphQL: http://localhost:${PORT}/graphql`);
    console.log(`Health: http://localhost:${PORT}/health`);
    console.log(`Upload: http://localhost:${PORT}/upload`);
    console.log(`=================================\n`);
    
    await testConnection();
  });
};

startServer();
