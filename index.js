const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('./routes');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configurer CORS pour accepter les requêtes de http://127.0.0.1:5500
app.use(cors({
    origin: 'http://127.0.0.1:5500'
}));

// Utiliser les routes définies
app.use('/', routes);

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

app.listen(3000, () => {
    console.log('Serveur démarré sur le port 3000');
});
