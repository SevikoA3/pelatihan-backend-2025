import express from 'express';
const app = express();

import userRoutes from './user.js';

app.use(express.json());
app.use(userRoutes);

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
