const App = require("./app");
const PORT = process.env.PORT || 8080;

App.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
