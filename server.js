const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const risikoRoutes = require('./routes/risikoRoutes');
const bcpRoutes = require('./routes/bcpRoutes');             
const perubahanRoutes = require('./routes/perubahanRoutes'); 
const tiketingRoutes = require('./routes/tiketingRoutes');
const konteksRoutes = require('./routes/konteksRoutes');
const pengetahuanRoutes = require('./routes/pengetahuanRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Main Endpoint
app.get('/', (req, res) => {
    res.send('API Sistem LDP Pemerintah Berjalan!');
});

// Routing Auth
app.use('/api/auth', authRoutes);

app.use('/api/risiko/konteks', konteksRoutes) ;
app.use('/api/risiko', risikoRoutes);

app.use('/api/bcp', bcpRoutes);   
app.use('/api/perubahan', perubahanRoutes); 
app.use('/api/tiketing', tiketingRoutes); 

app.use('/api/pengetahuan', pengetahuanRoutes);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server backend berjalan di http://localhost:${PORT}`);
});