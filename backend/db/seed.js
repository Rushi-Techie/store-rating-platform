const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seed() {
  console.log('Starting database seeding...');
  
  try {
    // Read schema.sql
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    
    // Execute schema to drop and create tables
    await pool.query(schemaSql);
    console.log('Tables created successfully.');

    // Hash passwords
    const adminPasswordHash = await bcrypt.hash('AdminPass123!', 10);
    const userPasswordHash = await bcrypt.hash('UserPass123!', 10);
    const storePasswordHash = await bcrypt.hash('StorePass123!', 10);

    // Insert users (Admins, Users, Store Owners)
    // Validate that names are between 20 and 60 characters
    const users = [
      {
        name: 'System Administrator Account', // 28 chars
        email: 'admin@platform.com',
        password_hash: adminPasswordHash,
        address: '100 Main HQ Admin Tower, Tech City',
        role: 'admin'
      },
      {
        name: 'Regular Customer John Doe', // 25 chars
        email: 'john@user.com',
        password_hash: userPasswordHash,
        address: '202 Maple Avenue, Springfield Heights',
        role: 'user'
      },
      {
        name: 'Regular Customer Jane Smith', // 27 chars
        email: 'jane@user.com',
        password_hash: userPasswordHash,
        address: '305 Oak Road, Shelbyville Fields',
        role: 'user'
      },
      {
        name: 'Gourmet Coffee Shop & Cafe', // 26 chars
        email: 'gourmet@store.com',
        password_hash: storePasswordHash,
        address: '12 Coffee Lane, Roaster District',
        role: 'store_owner'
      },
      {
        name: 'Supermarket Grocery Store', // 25 chars
        email: 'grocer@store.com',
        password_hash: storePasswordHash,
        address: '77 Marketplace Boulevard, Central Town',
        role: 'store_owner'
      },
      {
        name: 'Tech Electronics Outlet Store', // 29 chars
        email: 'electronics@store.com',
        password_hash: storePasswordHash,
        address: '90 Silicon Way, Tech Business Park',
        role: 'store_owner'
      }
    ];

    const insertedUsers = [];
    for (const u of users) {
      const res = await pool.query(
        `INSERT INTO users (name, email, password_hash, address, role) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id, name, role`,
        [u.name, u.email, u.password_hash, u.address, u.role]
      );
      insertedUsers.push(res.rows[0]);
    }
    console.log('Users seeded:', insertedUsers.length);

    // Map users to IDs for rating insertions
    const johnId = insertedUsers.find(u => u.name.includes('John')).id;
    const janeId = insertedUsers.find(u => u.name.includes('Jane')).id;
    
    const coffeeId = insertedUsers.find(u => u.name.includes('Coffee')).id;
    const grocerId = insertedUsers.find(u => u.name.includes('Grocery')).id;
    const techId = insertedUsers.find(u => u.name.includes('Tech')).id;

    // Insert ratings
    const ratings = [
      { user_id: johnId, store_id: coffeeId, rating: 5 },
      { user_id: johnId, store_id: grocerId, rating: 4 },
      { user_id: janeId, store_id: coffeeId, rating: 4 },
      { user_id: janeId, store_id: techId, rating: 2 }
    ];

    for (const r of ratings) {
      await pool.query(
        `INSERT INTO ratings (user_id, store_id, rating) VALUES ($1, $2, $3)`,
        [r.user_id, r.store_id, r.rating]
      );
    }
    console.log('Ratings seeded:', ratings.length);
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await pool.end();
  }
}

seed();
