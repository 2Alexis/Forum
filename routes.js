const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('./db');

// Route pour l'inscription
router.post('/register', (req, res) => {
    const { username, email, password } = req.body;

    // Vérification des contraintes
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
        return res.status(400).json({ success: false, message: 'Le nom d’utilisateur doit contenir uniquement des lettres et des chiffres' });
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
        return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, et un caractère spécial' });
    }

    // Hash du mot de passe
    const hashedPassword = bcrypt.hashSync(password, 8);

    // Insertion dans la base de données
    const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    db.query(query, [username, email, hashedPassword], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: 'Le nom d’utilisateur ou l’adresse mail est déjà utilisé' });
            }
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        res.status(201).json({ success: true, message: 'Utilisateur inscrit avec succès' });
    });
});

// Route pour la connexion
router.post('/login', (req, res) => {
    const { identifier, password } = req.body;

    const query = 'SELECT * FROM users WHERE username = ? OR email = ?';
    db.query(query, [identifier, identifier], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }

        if (results.length === 0) {
            return res.status(400).json({ success: false, message: 'Utilisateur non trouvé' });
        }

        const user = results[0];

        // Vérification du mot de passe
        if (!bcrypt.compareSync(password, user.password)) {
            return res.status(400).json({ success: false, message: 'Mot de passe incorrect' });
        }

        res.status(200).json({ success: true, message: 'Connexion réussie', user: { id: user.id, username: user.username, email: user.email } });
    });
});

// Route pour créer un topic
router.post('/create-topic', (req, res) => {
    const { title, body, tags, author, state } = req.body;

    // Insertion dans la base de données
    const query = 'INSERT INTO topics (title, body, tags, author, state) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [title, body, tags, author, state], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        res.status(201).json({ success: true, message: 'Topic créé avec succès' });
    });
});

// Route pour récupérer tous les topics
router.get('/topics', (req, res) => {
    const query = 'SELECT * FROM topics ORDER BY created_at DESC';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        res.status(200).json({ success: true, topics: results });
    });
});

// Route pour récupérer un topic avec ses messages
router.get('/topics/:id', (req, res) => {
    const topicId = req.params.id;

    const topicQuery = 'SELECT * FROM topics WHERE id = ?';
    const messagesQuery = `
        SELECT m.*, u.username 
        FROM messages m 
        JOIN users u ON m.user_id = u.id 
        WHERE m.topic_id = ? 
        ORDER BY m.created_at ASC
    `;

    db.query(topicQuery, [topicId], (err, topicResults) => {
        if (err) {
            console.error('Erreur lors de la récupération du topic:', err);
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }

        if (topicResults.length === 0) {
            return res.status(400).json({ success: false, message: 'Topic non trouvé' });
        }

        db.query(messagesQuery, [topicId], (err, messageResults) => {
            if (err) {
                console.error('Erreur lors de la récupération des messages:', err);
                return res.status(500).json({ success: false, message: 'Erreur serveur' });
            }

            res.status(200).json({ success: true, topic: topicResults[0], messages: messageResults });
        });
    });
});

// Route pour ajouter un message
router.post('/messages', (req, res) => {
    const { topic_id, user_id, body } = req.body;

    console.log('Données reçues pour ajouter un message:', { topic_id, user_id, body });

    const query = 'INSERT INTO messages (topic_id, user_id, body) VALUES (?, ?, ?)';
    db.query(query, [topic_id, user_id, body], (err, result) => {
        if (err) {
            console.error('Erreur lors de l\'insertion du message:', err);
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        res.status(201).json({ success: true, message: 'Message ajouté avec succès' });
    });
});

module.exports = router;
