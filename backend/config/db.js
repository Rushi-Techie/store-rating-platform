const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Pre-hashed passwords for in-memory mock fallback accounts
const ADMIN_HASH = bcrypt.hashSync('AdminPass123!', 10);
const USER_HASH = bcrypt.hashSync('UserPass123!', 10);
const STORE_HASH = bcrypt.hashSync('StorePass123!', 10);

// In-memory mock database state
const mockUsers = [
  { id: 1, name: "System Administrator Account", email: "admin@platform.com", password: ADMIN_HASH, address: "123 Admin Headquarter, Cityville", role: "admin" },
  { id: 2, name: "Regular Customer John Doe", email: "john@user.com", password: USER_HASH, address: "456 Customer Ave, Townsville", role: "user" },
  { id: 3, name: "Regular Customer Jane Smith", email: "jane@user.com", password: USER_HASH, address: "789 Shopper Boulevard, Tech City", role: "user" },
  { id: 4, name: "Gourmet Coffee Shop & Cafe", email: "gourmet@store.com", password: STORE_HASH, address: "123 Espresso Lane, Cityville", role: "store_owner" },
  { id: 5, name: "Supermarket Grocery Store", email: "grocer@store.com", password: STORE_HASH, address: "456 Market St, Townsville", role: "store_owner" },
  { id: 6, name: "Tech Electronics Outlet Store", email: "electronics@store.com", password: STORE_HASH, address: "789 Digital Way, Tech City", role: "store_owner" }
];

const mockRatings = [
  { id: 1, user_id: 2, store_id: 4, rating: 5 },
  { id: 2, user_id: 3, store_id: 4, rating: 4 },
  { id: 3, user_id: 2, store_id: 5, rating: 4 },
  { id: 4, user_id: 3, store_id: 5, rating: 3 },
  { id: 5, user_id: 2, store_id: 6, rating: 4 }
];

const databaseUrl = process.env.DATABASE_URL;

// Auto-activate mock mode on Vercel if no DATABASE_URL is set
const useMock = !databaseUrl;

let pool = null;
if (!useMock) {
  const poolConfig = databaseUrl
    ? {
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
      }
    : {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'store_rating_db',
      };
  pool = new Pool(poolConfig);
}

const mockQuery = async (text, params = []) => {
  const queryLower = text.toLowerCase();
  
  // SELECT * FROM users WHERE email = $1
  if (queryLower.includes("select * from users where email =") || queryLower.includes("email = $1")) {
    const email = params[0];
    const user = mockUsers.find(u => u.email === email);
    return { rows: user ? [user] : [] };
  }
  
  // SELECT id, name, email, address, role FROM users WHERE id = $1
  if (queryLower.includes("select") && queryLower.includes("from users where id =")) {
    const id = parseInt(params[0]);
    const user = mockUsers.find(u => u.id === id);
    return { rows: user ? [user] : [] };
  }
  
  // SELECT COUNT(*) AS count FROM users ...
  if (queryLower.includes("select count(*)")) {
    if (queryLower.includes("role = 'store_owner'")) {
      const count = mockUsers.filter(u => u.role === "store_owner").length;
      return { rows: [{ count }] };
    }
    if (queryLower.includes("from ratings")) {
      return { rows: [{ count: mockRatings.length }] };
    }
    return { rows: [{ count: mockUsers.length }] };
  }

  // SELECT id, name, email, address, role FROM users WHERE role = 'store_owner' / etc.
  if (queryLower.includes("select") && queryLower.includes("from users")) {
    if (queryLower.includes("role = 'store_owner'")) {
      const stores = mockUsers.filter(u => u.role === "store_owner");
      const storesWithRatings = stores.map(s => {
        const ratingsForStore = mockRatings.filter(r => r.store_id === s.id);
        const avg = ratingsForStore.length ? ratingsForStore.reduce((acc, curr) => acc + curr.rating, 0) / ratingsForStore.length : 0;
        return { ...s, rating: avg };
      });
      return { rows: storesWithRatings };
    }
    if (queryLower.includes("role in ('user', 'admin')") || queryLower.includes("role = $1")) {
      const filtered = mockUsers.filter(u => u.role === "user" || u.role === "admin");
      return { rows: filtered };
    }
    return { rows: mockUsers };
  }
  
  // INSERT INTO users
  if (queryLower.includes("insert into users")) {
    const [name, email, password, address, role] = params;
    const newId = mockUsers.length + 1;
    const newUser = { id: newId, name, email, password, address, role };
    mockUsers.push(newUser);
    return { rows: [newUser] };
  }

  // UPDATE users SET password
  if (queryLower.includes("update users set password =")) {
    const [password, id] = params;
    const user = mockUsers.find(u => u.id === parseInt(id));
    if (user) user.password = password;
    return { rows: [user] };
  }
  
  // SELECT AVG(rating)
  if (queryLower.includes("select avg(rating)")) {
    const storeId = parseInt(params[0]);
    const ratingsForStore = mockRatings.filter(r => r.store_id === storeId);
    const avg = ratingsForStore.length ? ratingsForStore.reduce((acc, curr) => acc + curr.rating, 0) / ratingsForStore.length : 0;
    return { rows: [{ rating: avg }] };
  }

  // SELECT rating FROM ratings WHERE user_id
  if (queryLower.includes("select rating from ratings where user_id =")) {
    const userId = parseInt(params[0]);
    const storeId = parseInt(params[1]);
    const r = mockRatings.find(rat => rat.user_id === userId && rat.store_id === storeId);
    return { rows: r ? [r] : [] };
  }

  // INSERT INTO ratings / UPDATE ratings
  if (queryLower.includes("insert into ratings")) {
    const [userId, storeId, rating] = params;
    const newRating = { id: mockRatings.length + 1, user_id: parseInt(userId), store_id: parseInt(storeId), rating: parseInt(rating) };
    mockRatings.push(newRating);
    return { rows: [newRating] };
  }

  if (queryLower.includes("update ratings set rating =")) {
    const [rating, userId, storeId] = params;
    const r = mockRatings.find(rat => rat.user_id === parseInt(userId) && rat.store_id === parseInt(storeId));
    if (r) r.rating = parseInt(rating);
    return { rows: [r] };
  }

  // JOIN users / review logs
  if (queryLower.includes("join users u")) {
    const storeId = parseInt(params[0]);
    const ratingsForStore = mockRatings.filter(r => r.store_id === storeId);
    const results = ratingsForStore.map(r => {
      const u = mockUsers.find(user => user.id === r.user_id);
      return {
        rating: r.rating,
        name: u ? u.name : "Anonymous User",
        email: u ? u.email : "anon@user.com",
        address: u ? u.address : "Unknown"
      };
    });
    return { rows: results };
  }
  
  return { rows: [] };
};

module.exports = {
  query: (text, params) => {
    if (useMock) {
      console.log("[Mock DB] Querying:", text, "with params:", params);
      return mockQuery(text, params);
    }
    return pool.query(text, params);
  },
  pool,
};
