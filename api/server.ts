import app from "./app/index";
import { config } from "dotenv";

config();
const PORT = process.env.PORT || 3000;
const TITLE = process.env.TITLE || "Express API";

app.listen(PORT, () => {
  console.log(`🚀 ${TITLE} listening on port ${PORT}`);
});
