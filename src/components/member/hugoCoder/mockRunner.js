/**
 * Mock Sandboxed Runner for PHP and SQL code simulation in browser terminal.
 */

const mockDatabase = {
  users: [
    { id: 1, username: "hugo_coder", email: "hugo@coder.com", role: "student", points: 120 },
    { id: 2, username: "wishpax", email: "wishpax@hugo.com", role: "admin", points: 950 },
    { id: 3, username: "john_doe", email: "john@doe.com", role: "student", points: 45 },
    { id: 4, username: "jane_smith", email: "jane@smith.com", role: "student", points: 280 }
  ],
  lessons: [
    { id: 101, title: "HTML Semantic", difficulty: "Dễ" },
    { id: 102, title: "CSS Grid Model", difficulty: "Trung bình" },
    { id: 103, title: "PHP PDO Connect", difficulty: "Khó" }
  ]
};

// Helper to format rows as a MySQL command-line ASCII table
function formatAsciiTable(columns, rows) {
  if (rows.length === 0) {
    return "Empty set (0.00 sec)";
  }

  // Calculate column widths
  const widths = {};
  columns.forEach(col => {
    widths[col] = col.length;
  });

  rows.forEach(row => {
    columns.forEach(col => {
      const val = String(row[col] !== undefined ? row[col] : "");
      if (val.length > widths[col]) {
        widths[col] = val.length;
      }
    });
  });

  // Build divider
  let divider = "+";
  columns.forEach(col => {
    divider += "-".repeat(widths[col] + 2) + "+";
  });

  let table = divider + "\n|";
  columns.forEach(col => {
    table += " " + col.padEnd(widths[col]) + " |";
  });
  table += "\n" + divider + "\n";

  rows.forEach(row => {
    table += "|";
    columns.forEach(col => {
      const val = String(row[col] !== undefined ? row[col] : "");
      table += " " + val.padEnd(widths[col]) + " |";
    });
    table += "\n";
  });

  table += divider + "\n" + rows.length + " rows in set (0.01 sec)";
  return table;
}

export function runMockSql(code) {
  const query = String(code || "").trim().replace(/\s+/g, " ");
  const queryLower = query.toLowerCase();

  if (!queryLower) {
    return "No query specified.";
  }

  // Check simple syntax errors
  if (queryLower.includes("select") && !queryLower.includes("from")) {
    return "ERROR 1064 (42000): You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'FROM' clause.";
  }

  // SELECT queries
  if (queryLower.startsWith("select")) {
    if (queryLower.includes("users")) {
      let resultRows = [...mockDatabase.users];
      // Simple WHERE filter logic (points)
      const pointsMatch = queryLower.match(/points\s*>\s*(\d+)/);
      if (pointsMatch) {
        const minPoints = parseInt(pointsMatch[1], 10);
        resultRows = resultRows.filter(u => u.points > minPoints);
      }
      
      const columns = ["id", "username", "email", "role", "points"];
      return formatAsciiTable(columns, resultRows);
    }

    if (queryLower.includes("lessons")) {
      const columns = ["id", "title", "difficulty"];
      return formatAsciiTable(columns, mockDatabase.lessons);
    }

    // Default SELECT
    return formatAsciiTable(["result"], [{ result: "SQL Sandbox Query Executed successfully!" }]);
  }

  // INSERT INTO queries
  if (queryLower.startsWith("insert into")) {
    const tableMatch = queryLower.match(/insert into\s+(\w+)/i);
    const tableName = tableMatch ? tableMatch[1].toLowerCase() : "";
    if (tableName === "users" || tableName === "lessons") {
      return `Query OK, 1 row affected (0.02 sec)\nDatabase updated in sandbox state.`;
    }
    return `ERROR 1146 (42S02): Table 'test_db.${tableName}' doesn't exist`;
  }

  // UPDATE queries
  if (queryLower.startsWith("update")) {
    const tableMatch = queryLower.match(/update\s+(\w+)/i);
    const tableName = tableMatch ? tableMatch[1].toLowerCase() : "";
    if (tableName === "users" || tableName === "lessons") {
      return `Query OK, 1 row affected (0.01 sec)\nRows matched: 1  Changed: 1  Warnings: 0`;
    }
    return `ERROR 1146 (42S02): Table 'test_db.${tableName}' doesn't exist`;
  }

  // DELETE queries
  if (queryLower.startsWith("delete")) {
    return `Query OK, 1 row affected (0.02 sec)`;
  }

  return `SQL Query executed in sandbox:\n> ${query}\nOutput: Query OK (0.00 sec).`;
}

export function runMockPhp(code) {
  // Simple check for missing semicolon
  const lines = code.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("echo") && !line.endsWith(";")) {
      return `PHP Parse error: syntax error, unexpected token ";", expecting ";" in index.php on line ${i + 1}`;
    }
  }

  // Extract raw PHP body (strip <?php and ?> tag)
  let body = code.replace(/<\?php/g, "").replace(/\?>/g, "").trim();
  
  let output = "";
  const variables = {};

  // Simple state machine parser for statements
  const statements = body.split(";");
  
  for (let stmt of statements) {
    stmt = stmt.trim();
    if (!stmt) continue;

    // 1. Variable assignments: $x = "hello" or $x = 5
    const assignMatch = stmt.match(/^\$(\w+)\s*=\s*['"]?([^'"]+)['"]?$/);
    if (assignMatch) {
      const varName = assignMatch[1];
      const value = assignMatch[2];
      variables[varName] = value;
      continue;
    }

    // 2. Simple echo of string: echo "Hello World"
    const echoStringMatch = stmt.match(/^echo\s+['"]([^'"]+)['"]$/);
    if (echoStringMatch) {
      output += echoStringMatch[1];
      continue;
    }

    // 3. Simple echo of variable: echo $username
    const echoVarMatch = stmt.match(/^echo\s+\$(\w+)$/);
    if (echoVarMatch) {
      const varName = echoVarMatch[1];
      output += variables[varName] !== undefined ? variables[varName] : "";
      continue;
    }

    // 4. Print structured arrays
    if (stmt.startsWith("print_r")) {
      output += `Array\n(\n`;
      Object.keys(variables).forEach(k => {
        output += `    [${k}] => ${variables[k]}\n`;
      });
      output += `)\n`;
      continue;
    }

    // 5. Simulated Database connections and query outputs
    if (stmt.includes("PDO") || stmt.includes("mysqli_connect")) {
      output += `[Database Connecting...] Connected to test_db successfully via localhost.\n`;
      continue;
    }
    if (stmt.includes("SELECT") || stmt.includes("query(")) {
      output += `Executing database query...\n`;
      output += formatAsciiTable(["id", "username", "email", "points"], mockDatabase.users);
      output += "\n";
      continue;
    }
  }

  if (!output) {
    output = "[PHP Sandbox execution completed with status 0 (no output generated)]";
  }

  return output;
}
