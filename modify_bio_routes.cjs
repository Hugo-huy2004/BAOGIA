const fs = require('fs');
let code = fs.readFileSync('server/routes/bioRoutes.js', 'utf8');

// Add new fields to POST /
code = code.replace(
  /hobbies = '',\n      avatarUrl = '',/g,
  `hobbies = '',
      height = '',
      weight = '',
      measurements = '',
      address = '',
      avatarUrl = '',`
);

code = code.replace(
  /hobbies,\n      avatarUrl/g,
  `hobbies,
      height,
      weight,
      measurements,
      address,
      avatarUrl`
);

// Add new fields to PUT /:id
code = code.replace(
  /hobbies, avatarUrl/g,
  `hobbies, height, weight, measurements, address, avatarUrl`
);

fs.writeFileSync('server/routes/bioRoutes.js', code, 'utf8');
console.log("Updated bioRoutes.js");
