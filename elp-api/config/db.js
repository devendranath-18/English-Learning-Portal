const mysql = require("mysql2");

const db_config = {
  host: "localhost",
  user: "root",
  password: "",
  database: "english_learning_portal"
};

let connection;

function handleDisconnect() {
  connection = mysql.createConnection(db_config);

  connection.connect((err) => {
    if (err) {
      console.error("Database connection failed, retrying in 2 seconds...");
      setTimeout(handleDisconnect, 2000);
    } else {
      console.log("MySQL Connected Successfully");
    }
  });

  connection.on("error", (err) => {
    console.error("Database error:", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST" || err.fatal) {
      console.log("Reconnecting database...");
      handleDisconnect();
    } else {
      console.error("Non-fatal DB error occurred.");
    }
  });
}

handleDisconnect();

// Export a proxy/wrapper object to maintain reference safety across imports
const dbWrapper = {
  query: (sql, params, callback) => {
    if (typeof params === "function") {
      return connection.query(sql, params);
    }
    return connection.query(sql, params, callback);
  },
  beginTransaction: (callback) => connection.beginTransaction(callback),
  commit: (callback) => connection.commit(callback),
  rollback: (callback) => connection.rollback(callback),
  end: (callback) => connection.end(callback)
};

module.exports = dbWrapper;