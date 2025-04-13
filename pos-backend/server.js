const express = require('express');

const app = express();

const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello from POS Backend!');
});

app.listen(PORT, () => {
    console.log('Backend server running on http://localhost:' + PORT);
})