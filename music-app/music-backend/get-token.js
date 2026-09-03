const { generate } = require('youtube-po-token-generator');

console.log("Contacting YouTube servers... please wait...");

generate()
  .then((data) => {
    console.log("\nSUCCESS! Copy the tokens below:\n");
    console.log(JSON.stringify(data, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error("\nGeneration failed:", err.message);
    process.exit(1);
  });
