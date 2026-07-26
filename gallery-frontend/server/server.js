import express from 'express';
import cors from 'cors';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Load artwork data
const artworkData = JSON.parse(readFileSync(join(__dirname, 'artworks.json'), 'utf-8'));

// Images directory
const IMAGES_DIR = join(__dirname, '../../data/images');

// Filter out artworks whose image files don't exist
const missingImages = new Set();
artworkData.artworks = artworkData.artworks.filter(artwork => {
  if (!artwork.image_url) return true
  const filename = artwork.image_url.replace('/images/', '')
  const exists = existsSync(join(IMAGES_DIR, filename))
  if (!exists) {
    missingImages.add(filename)
    return false
  }
  return true
})

if (missingImages.size > 0) {
  console.log(`[Filter] Excluded ${missingImages.size} artworks with missing images:`)
  for (const f of missingImages) console.log(`  - ${f}`)
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve static images from data/images folder
app.use('/images', express.static(join(__dirname, '../../data/images')));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Mock Supabase REST API endpoint
// GET /rest/v1/artworks?is_published=eq.true&region=eq.东南亚
app.get('/rest/v1/artworks', (req, res) => {
  const { is_published, select, order, region } = req.query;

  let artworks = [...artworkData.artworks];

  // Filter by is_published if specified
  if (is_published === 'true') {
    artworks = artworks.filter(a => a.is_published === true);
  }

  // Filter by region if specified (e.g., region=eq.东南亚)
  if (region && region.startsWith('eq.')) {
    const regionValue = region.substring(3);
    artworks = artworks.filter(a => a.region === regionValue);
  }

  // Sort by sort_order
  if (order) {
    const orderField = order.split('.')[0];
    const orderDirection = order.includes('.desc') ? -1 : 1;
    artworks.sort((a, b) => (a[orderField] - b[orderField]) * orderDirection);
  } else {
    artworks.sort((a, b) => a.sort_order - b.sort_order);
  }

  // Return in Supabase format
  res.json({
    data: artworks,
    count: artworks.length
  });
});

// Single artwork by inventory number
app.get('/rest/v1/artworks:inventory_number', (req, res) => {
  const { inventory_number } = req.params;
  const artwork = artworkData.artworks.find(a => a.inventory_number === inventory_number);

  if (!artwork) {
    return res.status(404).json({ error: 'Artwork not found' });
  }

  res.json({ data: artwork });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║           ArtStore API Server Started                   ║
╠══════════════════════════════════════════════════════════╣
║  Local API:     http://localhost:${PORT}                   ║
║  Artworks API:  http://localhost:${PORT}/rest/v1/artworks   ║
║  Total Items:   ${artworkData.artworks.length} artworks                    ║
╚══════════════════════════════════════════════════════════╝
  `);
});