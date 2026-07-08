import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: 'server/.env' });

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const DOMAIN = 'hugowishpax.studio';

if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
  console.error('❌ Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ZONE_ID in .env');
  process.exit(1);
}

// DNS records for SendGrid
const DNS_RECORDS = [
  // CNAME records
  {
    type: 'CNAME',
    name: 'url441',
    content: 'sendgrid.net',
    ttl: 3600,
  },
  {
    type: 'CNAME',
    name: '110412634',
    content: 'sendgrid.net',
    ttl: 3600,
  },
  {
    type: 'CNAME',
    name: 'em6359',
    content: 'sendgrid.net',
    ttl: 3600,
  },
  {
    type: 'CNAME',
    name: 's1._domainkey',
    content: 'sendgrid.net',
    ttl: 3600,
  },
  {
    type: 'CNAME',
    name: 's2._domainkey',
    content: 'sendgrid.net',
    ttl: 3600,
  },
  // TXT record for DMARC
  {
    type: 'TXT',
    name: '_dmarc',
    content: 'v=DMARC1; p=quarantine; rua=mailto:support@hugowishpax.studio',
    ttl: 3600,
  },
];

async function addDNSRecord(record) {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: record.type,
          name: record.name === DOMAIN ? DOMAIN : `${record.name}.${DOMAIN}`,
          content: record.content,
          ttl: record.ttl,
          proxied: false,
        }),
      }
    );

    const data = await response.json();

    if (!data.success) {
      if (data.errors?.[0]?.code === 81053) {
        // Record already exists
        console.log(`⚠️  ${record.type} ${record.name} — already exists`);
        return true;
      }
      console.error(`❌ Failed to add ${record.type} ${record.name}:`, data.errors);
      return false;
    }

    console.log(`✅ ${record.type} ${record.name} → added`);
    return true;
  } catch (error) {
    console.error(`❌ Error adding ${record.type} ${record.name}:`, error.message);
    return false;
  }
}

async function setupDNS() {
  console.log('🚀 Setting up SendGrid DNS records for hugowishpax.studio...\n');

  const results = [];
  for (const record of DNS_RECORDS) {
    const success = await addDNSRecord(record);
    results.push(success);
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const successCount = results.filter(r => r).length;
  const totalCount = results.length;

  console.log(`\n✅ Setup complete: ${successCount}/${totalCount} records added`);

  if (successCount === totalCount) {
    console.log('\n🎉 All DNS records configured successfully!');
    console.log('⏳ DNS propagation may take up to 24 hours.');
  } else {
    console.log('\n⚠️  Some records failed. Check errors above.');
    process.exit(1);
  }
}

setupDNS();
