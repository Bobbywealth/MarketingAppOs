const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Mapping of usernames to client names (case-insensitive matching)
const manualMappings = {
  'antonellewhite': 'Antonelle White',
  'antoniamusic': 'Antonia Benedetto',
  'carson': 'Carson Leuders',
  'carsonleuders': 'Carson Leuders',
  'daleyoneilia18': 'Oneilia Daley',
  'eiandaniels': 'Eian Daniels',
  'hroyalfamily': 'H Royal Family',
  'lk1634': 'Luke Kornblatt',
  'pgkd2012': 'Michelle Bowens',
  'phamefashioninc': 'Withney Phame',
  'princewonda': 'Jerry Wonda',
  'smokingclassicsinc': 'AJ SmokingClassics',
  'tachina': 'Tachina',
  'info.suzibookings': 'Suzi',
  'rszn.jerkcenter': 'Jason',
  'testclient': 'AJ SmokingClassics',
};

(async () => {
  try {
    console.log('🔗 AUTO-LINKING CLIENT USERS TO CLIENT RECORDS');
    console.log('='.repeat(60));
    console.log('');

    // Get all unlinked client users
    const clientUsers = await pool.query(`
      SELECT id, username, role, client_id 
      FROM users 
      WHERE role = 'client' AND client_id IS NULL
      ORDER BY username
    `);

    // Get all clients
    const clients = await pool.query('SELECT id, name FROM clients ORDER BY name');
    
    // Create a map for quick lookup
    const clientMap = {};
    clients.rows.forEach(c => {
      clientMap[c.name.toLowerCase()] = c.id;
    });

    let linked = 0;
    let skipped = 0;
    const results = [];

    for (const user of clientUsers.rows) {
      const username = user.username.toLowerCase();
      
      // Try manual mapping first
      if (manualMappings[username]) {
        const clientName = manualMappings[username];
        const clientId = clientMap[clientName.toLowerCase()];
        
        if (clientId) {
          await pool.query(
            'UPDATE users SET client_id = $1 WHERE id = $2',
            [clientId, user.id]
          );
          
          console.log(`✅ ${user.username} → ${clientName}`);
          results.push({ username: user.username, clientName, status: 'linked' });
          linked++;
        } else {
          console.log(`⚠️  ${user.username} → ${clientName} (client not found)`);
          results.push({ username: user.username, clientName, status: 'client_not_found' });
          skipped++;
        }
      } else {
        // Try fuzzy matching (username contains part of client name or vice versa)
        let matched = false;
        
        for (const [clientName, clientId] of Object.entries(clientMap)) {
          const cleanClientName = clientName.replace(/[^a-z0-9]/g, '');
          const cleanUsername = username.replace(/[^a-z0-9]/g, '');
          
          if (cleanClientName.includes(cleanUsername) || cleanUsername.includes(cleanClientName)) {
            await pool.query(
              'UPDATE users SET client_id = $1 WHERE id = $2',
              [clientId, user.id]
            );
            
            console.log(`✅ ${user.username} → ${clients.rows.find(c => c.id === clientId).name} (auto-matched)`);
            results.push({ username: user.username, clientName: clients.rows.find(c => c.id === clientId).name, status: 'auto_matched' });
            linked++;
            matched = true;
            break;
          }
        }
        
        if (!matched) {
          console.log(`❌ ${user.username} - NO MATCH FOUND (needs manual linking)`);
          results.push({ username: user.username, clientName: null, status: 'no_match' });
          skipped++;
        }
      }
    }

    console.log('');
    console.log('='.repeat(60));
    console.log(`📊 SUMMARY: ${linked} linked, ${skipped} skipped`);
    console.log('');

    // Show users that need manual linking
    const needsManual = results.filter(r => r.status === 'no_match' || r.status === 'client_not_found');
    if (needsManual.length > 0) {
      console.log('⚠️  USERS NEEDING MANUAL LINKING:');
      needsManual.forEach(u => console.log(`   - ${u.username}`));
      console.log('');
      console.log('💡 Use the Team Management page to link these users manually.');
    }

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    await pool.end();
    process.exit(1);
  }
})();

