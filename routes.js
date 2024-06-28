const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('./db');

// Route pour l'inscription
router.post('/register', (req, res) => {
    const { username, email, password, profile_pic } = req.body;

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
    const query = 'INSERT INTO users (username, email, password, profile_pic) VALUES (?, ?, ?, ?)';
    db.query(query, [username, email, hashedPassword, profile_pic], (err, result) => {
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

        res.status(200).json({ success: true, message: 'Connexion réussie', user: { username: user.username, email: user.email } });
    });
});

// Route pour créer un topic
router.post('/create-topic', (req, res) => {
    const { title, body, tags, author_id, state } = req.body;

    // Insertion dans la base de données
    const query = 'INSERT INTO topics (title, body, tags, author_id, state) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [title, body, tags, author_id, state], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        res.status(201).json({ success: true, message: 'Topic créé avec succès' });
    });
});

// Route pour récupérer les topics avec pagination
router.get('/topics', (req, res) => {
    const page = parseInt(req.query.page) || 1; // Page par défaut à 1 si non spécifiée
    const limit = 6; // Limite de 6 topics par page
    const offset = (page - 1) * limit;

    const query = 'SELECT * FROM topics ORDER BY created_at DESC LIMIT ? OFFSET ?';
    db.query(query, [limit, offset], (err, results) => {
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

// Route pour mettre à jour un topic
router.put('/topics/:id', (req, res) => {
    const topicId = req.params.id;
    const { title, body } = req.body;

    const query = 'UPDATE topics SET title = ?, body = ? WHERE id = ?';
    db.query(query, [title, body, topicId], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }

        res.status(200).json({ success: true, message: 'Topic mis à jour avec succès' });
    });
});

// Route pour supprimer un topic et ses messages
router.delete('/topics/:id', (req, res) => {
    const topicId = req.params.id;

    const deleteMessagesQuery = 'DELETE FROM messages WHERE topic_id = ?';
    const deleteTopicQuery = 'DELETE FROM topics WHERE id = ?';

    db.query(deleteMessagesQuery, [topicId], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur lors de la suppression des messages' });
        }

        db.query(deleteTopicQuery, [topicId], (err, result) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Erreur serveur lors de la suppression du topic' });
            }

            res.status(200).json({ success: true, message: 'Topic et ses messages supprimés avec succès' });
        });
    });
});

// Route pour supprimer un message
router.delete('/messages/:id', (req, res) => {
    const messageId = req.params.id;

    const query = 'DELETE FROM messages WHERE id = ?';
    db.query(query, [messageId], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }

        res.status(200).json({ success: true, message: 'Message supprimé avec succès' });
    });
});

// Route pour liker un topic
router.post('/like', (req, res) => {
    const { user_id, topic_id, type } = req.body;

    // Vérifier si l'utilisateur a déjà liké ou disliké ce topic
    const checkQuery = 'SELECT * FROM likes WHERE user_id = ? AND topic_id = ?';
    db.query(checkQuery, [user_id, topic_id], (err, results) => {
        if (err) {
            console.error('Erreur lors de la vérification des likes:', err);
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }

        if (results.length > 0) {
            // Mettre à jour le type de like
            const updateQuery = 'UPDATE likes SET type = ? WHERE user_id = ? AND topic_id = ?';
            db.query(updateQuery, [type, user_id, topic_id], (err, result) => {
                if (err) {
                    console.error('Erreur lors de la mise à jour du like:', err);
                    return res.status(500).json({ success: false, message: 'Erreur serveur' });
                }
                return res.status(200).json({ success: true, message: 'Like mis à jour avec succès' });
            });
        } else {
            // Insérer un nouveau like
            const insertQuery = 'INSERT INTO likes (user_id, topic_id, type) VALUES (?, ?, ?)';
            db.query(insertQuery, [user_id, topic_id, type], (err, result) => {
                if (err) {
                    console.error('Erreur lors de l\'insertion du like:', err);
                    return res.status(500).json({ success: false, message: 'Erreur serveur' });
                }
                return res.status(201).json({ success: true, message: 'Like ajouté avec succès' });
            });
        }
    });
});

// Route pour récupérer les topics likés par un utilisateur
router.get('/liked-topics/:user_id', (req, res) => {
    const userId = req.params.user_id;

    const query = `
        SELECT t.* FROM topics t
        JOIN likes l ON t.id = l.topic_id
        WHERE l.user_id = ? AND l.type = 'like'
    `;
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des topics likés:', err);
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        res.status(200).json({ success: true, topics: results });
    });
});

// Route pour obtenir les informations de l'utilisateur
router.get('/user/:id', (req, res) => {
    const userId = req.params.id;

    const query = 'SELECT username, email, biographie, profile_pic, friendship_status, last_login FROM users WHERE id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }

        if (results.length === 0) {
            return res.status(400).json({ success: false, message: 'Utilisateur non trouvé' });
        }

        res.status(200).json({ success: true, user: results[0] });
    });
});

// Route pour mettre à jour les informations de l'utilisateur
router.put('/user/:id', (req, res) => {
    const userId = req.params.id;
    const { username, biographie, profile_pic } = req.body;

    const query = 'UPDATE users SET username = ?, biographie = ?, profile_pic = ? WHERE id = ?';
    db.query(query, [username, biographie, profile_pic, userId], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }

        res.status(200).json({ success: true, message: 'Informations mises à jour avec succès' });
    });
});

module.exports = router;
