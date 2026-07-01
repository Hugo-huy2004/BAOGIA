import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'hugo-wishpax-super-secret-key-2024';

const token = jwt.sign(
  { id: '123456789012345678901234', role: 'admin' },
  JWT_SECRET,
  { expiresIn: '14d' }
);

const cookie = `jwt=${token}`;

async function test() {
  const res = await fetch('http://localhost:8081/api/utility-store/admin/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie
    },
    body: JSON.stringify({
      name: "Test Product", priceJoy: 10, productType: "general", stock: 0
    })
  });
  
  const data = await res.json();
  console.log("Create product:", res.status, data);
}

test();
