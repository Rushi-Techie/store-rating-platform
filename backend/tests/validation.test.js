const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

async function runTests() {
  console.log('--- RUNNING DB CONSTRAINT VALIDATION TESTS ---');
  let testsPassed = 0;
  let testsFailed = 0;

  // Helper to log test results
  const assert = (condition, message) => {
    if (condition) {
      console.log(`[PASS] ${message}`);
      testsPassed++;
    } else {
      console.error(`[FAIL] ${message}`);
      testsFailed++;
    }
  };

  try {
    // Test 1: Name length < 20 check constraint
    try {
      const passwordHash = await bcrypt.hash('TestPass123!', 10);
      await pool.query(
        `INSERT INTO users (name, email, password_hash, address, role)
         VALUES ($1, $2, $3, $4, $5)`,
        ['Short Name', 'short@test.com', passwordHash, '123 Test St', 'user']
      );
      assert(false, 'Database allowed inserting a user with name length < 20 characters.');
    } catch (err) {
      assert(
        err.message.includes('check constraint') || err.message.includes('violates check constraint'),
        `Database successfully blocked name < 20 chars. Error: ${err.message}`
      );
    }

    // Test 2: Name length > 60 length constraint (via VARCHAR(60))
    try {
      const longName = 'A'.repeat(61);
      const passwordHash = await bcrypt.hash('TestPass123!', 10);
      await pool.query(
        `INSERT INTO users (name, email, password_hash, address, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [longName, 'long@test.com', passwordHash, '123 Test St', 'user']
      );
      assert(false, 'Database allowed inserting a user with name length > 60 characters.');
    } catch (err) {
      assert(
        err.message.includes('value too long') || err.message.includes('too long for type'),
        `Database successfully blocked name > 60 chars. Error: ${err.message}`
      );
    }

    // Test 3: Valid user insertion
    let testUserId = null;
    try {
      const validName = 'Test User Account Name Valid'; // 28 chars
      const passwordHash = await bcrypt.hash('TestPass123!', 10);
      const res = await pool.query(
        `INSERT INTO users (name, email, password_hash, address, role)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [validName, 'valid@test.com', passwordHash, '123 Test St, Tech Park', 'user']
      );
      testUserId = res.rows[0].id;
      assert(testUserId > 0, 'Database successfully inserted a user meeting all schema criteria.');
    } catch (err) {
      assert(false, `Failed to insert valid user: ${err.message}`);
    }

    // Clean up valid user
    if (testUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
      console.log('Test user cleaned up.');
    }

  } catch (globalErr) {
    console.error('Fatal test runner error:', globalErr);
  } finally {
    await pool.end();
    console.log(`\n--- TEST RUN SUMMARY: ${testsPassed} passed, ${testsFailed} failed ---`);
    process.exit(testsFailed > 0 ? 1 : 0);
  }
}

runTests();
