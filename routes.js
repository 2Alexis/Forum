const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('./db');

// Middleware to check if user is an admin
function isAdmin(req, res, next) {
    const userId = req.body.user_id || req.query.user_id;
    const query = 'SELECT role FROM users WHERE id = 17';
    db.query(query, [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        if (results.length === 0 || results[0].role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Accès interdit' });
        }
        next();
    });
}

// Route to get all users
router.get('/users', isAdmin, (req, res) => {
    const query = 'SELECT id, username, email, profile_pic, status, role FROM users';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        res.status(200).json({ success: true, users: results });
    });
});

// Admin route to modify the state of a topic
router.put('/admin/topics/:id/state', isAdmin, (req, res) => {
    const topicId = req.params.id;
    const { state } = req.body;
    const query = 'UPDATE topics SET state = ? WHERE id = ?';
    db.query(query, [state, topicId], (err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        res.status(200).json({ success: true, message: 'État du topic modifié avec succès' });
    });
});

// Admin route to delete a topic
router.delete('/admin/topics/:id', isAdmin, (req, res) => {
    const topicId = req.params.id;
    const deleteMessagesQuery = 'DELETE FROM messages WHERE topic_id = ?';
    const deleteTopicQuery = 'DELETE FROM topics WHERE id = ?';
    db.query(deleteMessagesQuery, [topicId], (err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur lors de la suppression des messages' });
        }
        db.query(deleteTopicQuery, [topicId], (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Erreur serveur lors de la suppression du topic' });
            }
            res.status(200).json({ success: true, message: 'Topic et ses messages supprimés avec succès' });
        });
    });
});

// Admin route to delete a message
router.delete('/admin/messages/:id', isAdmin, (req, res) => {
    const messageId = req.params.id;
    const query = 'DELETE FROM messages WHERE id = ?';
    db.query(query, [messageId], (err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        res.status(200).json({ success: true, message: 'Message supprimé avec succès' });
    });
});

// Admin route to ban a user
router.put('/admin/users/:id/ban', isAdmin, (req, res) => {
    const userId = req.params.id;
    const query = 'UPDATE users SET banned = 1 WHERE id = ?';
    db.query(query, [userId], (err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        res.status(200).json({ success: true, message: 'Utilisateur banni avec succès' });
    });
});

// Route pour l'inscription
router.post('/register', (req, res) => {
    const { username, email, password, profile_pic } = req.body;
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
        return res.status(400).json({ success: false, message: 'Le nom d’utilisateur doit contenir uniquement des lettres et des chiffres' });
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
        return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, et un caractère spécial' });
    }
    const hashedPassword = bcrypt.hashSync(password, 8);
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
    const query = 'SELECT id, username, email, password, role FROM users WHERE username = ? OR email = ?';
    db.query(query, [identifier, identifier], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        if (results.length === 0) {
            return res.status(400).json({ success: false, message: 'Utilisateur non trouvé' });
        }
        const user = results[0];
        if (!bcrypt.compareSync(password, user.password)) {
            return res.status(400).json({ success: false, message: 'Mot de passe incorrect' });
        }
        res.status(200).json({ success: true, message: 'Connexion réussie', user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    });
});

// Route pour créer un topic
router.post('/create-topic', (req, res) => {
    const { title, body, tags, author_id, state } = req.body;
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
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const offset = (page - 1) * limit;
    const query = `
        SELECT t.*, u.username AS author_name, u.profile_pic AS author_profile_pic 
        FROM topics t 
        JOIN users u ON t.author_id = u.id 
        ORDER BY t.created_at DESC 
        LIMIT ? OFFSET ?
    `;
    db.query(query, [limit, offset], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des topics avec jointure:', err);
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        res.status(200).json({ success: true, topics: results });
    });
});

router.get('/topics/:id', (req, res) => {
    const topicId = req.params.id;
    const sortOrder = req.query.sortOrder || 'recent';
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    let messagesQuery;

    if (sortOrder === 'popular') {
        messagesQuery = `
            SELECT m.*, u.username, 
            IFNULL((SELECT SUM(CASE WHEN type = 'like' THEN 1 WHEN type = 'dislike' THEN -1 ELSE 0 END) 
                    FROM message_likes 
                    WHERE message_id = m.id), 0) AS popularity
            FROM messages m 
            JOIN users u ON m.user_id = u.id 
            WHERE m.topic_id = ? 
            ORDER BY popularity DESC
            LIMIT ? OFFSET ?
        `;
    } else {
        messagesQuery = `
            SELECT m.*, u.username, 
            IFNULL((SELECT SUM(CASE WHEN type = 'like' THEN 1 WHEN type = 'dislike' THEN -1 ELSE 0 END) 
                    FROM message_likes 
                    WHERE message_id = m.id), 0) AS popularity
            FROM messages m 
            JOIN users u ON m.user_id = u.id 
            WHERE m.topic_id = ? 
            ORDER BY m.created_at DESC
            LIMIT ? OFFSET ?
        `;
    }

    const topicQuery = `
        SELECT t.*, u.username AS author_name, u.profile_pic AS author_profile_pic 
        FROM topics t 
        JOIN users u ON t.author_id = u.id 
        WHERE t.id = ?
    `;

    db.query(topicQuery, [topicId], (err, topicResults) => {
        if (err) {
            console.error('Erreur lors de la récupération du topic:', err);
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        if (topicResults.length === 0) {
            return res.status(400).json({ success: false, message: 'Topic non trouvé' });
        }
        db.query(messagesQuery, [topicId, limit, offset], (err, messageResults) => {
            if (err) {
                console.error('Erreur lors de la récupération des messages:', err);
                return res.status(500).json({ success: false, message: 'Erreur serveur' });
            }
            res.status(200).json({ success: true, topic: topicResults[0], messages: messageResults });
        });
    });
});


// Route pour supprimer un topic et ses messages
router.delete('/topics/:id', (req, res) => {
    const topicId = req.params.id;
    const deleteMessagesQuery = 'DELETE FROM messages WHERE topic_id = ?';
    const deleteTopicQuery = 'DELETE FROM topics WHERE id = ?';
    db.query(deleteMessagesQuery, [topicId], (err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur lors de la suppression des messages' });
        }
        db.query(deleteTopicQuery, [topicId], (err) => {
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
    db.query(query, [messageId], (err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        res.status(200).json({ success: true, message: 'Message supprimé avec succès' });
    });
});

// Route pour liker ou disliker un message
router.post('/like-message', (req, res) => {
    const { user_id, message_id, type } = req.body;
    const likeValue = type === 'like' ? 1 : -1;

    const checkQuery = 'SELECT * FROM message_likes WHERE user_id = ? AND message_id = ?';
    db.query(checkQuery, [user_id, message_id], (err, results) => {
        if (err) {
            console.error('Erreur lors de la vérification des likes:', err);
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }

        if (results.length > 0) {
            const updateQuery = 'UPDATE message_likes SET type = ? WHERE user_id = ? AND message_id = ?';
            db.query(updateQuery, [type, user_id, message_id], (err) => {
                if (err) {
                    console.error('Erreur lors de la mise à jour du like:', err);
                    return res.status(500).json({ success: false, message: 'Erreur serveur' });
                }
                res.status(200).json({ success: true, message: 'Like mis à jour avec succès' });
            });
        } else {
            const insertQuery = 'INSERT INTO message_likes (user_id, message_id, type) VALUES (?, ?, ?)';
            db.query(insertQuery, [user_id, message_id, type], (err) => {
                if (err) {
                    console.error('Erreur lors de l\'insertion du like:', err);
                    return res.status(500).json({ success: false, message: 'Erreur serveur' });
                }
                res.status(201).json({ success: true, message: 'Like ajouté avec succès' });
            });
        }
    });
});

// Route pour ajouter un message à un topic
router.post('/messages', (req, res) => {
    const { topic_id, user_id, body } = req.body;
    const query = 'INSERT INTO messages (topic_id, user_id, body) VALUES (?, ?, ?)';
    db.query(query, [topic_id, user_id, body], (err, result) => {
        if (err) {
            console.error('Erreur lors de l\'ajout du message:', err);
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        res.status(201).json({ success: true, message: 'Message ajouté avec succès' });
    });
});

router.post('/like', (req, res) => {
    const { user_id, topic_id, type } = req.body;
    const likeValue = type === 'like' ? 1 : -1;

    const checkQuery = 'SELECT * FROM likes WHERE user_id = ? AND topic_id = ?';
    db.query(checkQuery, [user_id, topic_id], (err, results) => {
        if (err) {
            console.error('Erreur lors de la vérification des likes:', err);
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }

        if (results.length > 0) {
            // Mettre à jour le type de like
            const updateQuery = 'UPDATE likes SET type = ? WHERE user_id = ? AND topic_id = ?';
            db.query(updateQuery, [type, user_id, topic_id], (err) => {
                if (err) {
                    console.error('Erreur lors de la mise à jour du like:', err);
                    return res.status(500).json({ success: false, message: 'Erreur serveur' });
                }
                updateLikesCount(topic_id, likeValue, res);
            });
        } else {
            // Insérer un nouveau like
            const insertQuery = 'INSERT INTO likes (user_id, topic_id, type) VALUES (?, ?, ?)';
            db.query(insertQuery, [user_id, topic_id, type], (err) => {
                if (err) {
                    console.error('Erreur lors de l\'insertion du like:', err);
                    return res.status(500).json({ success: false, message: 'Erreur serveur' });
                }
                updateLikesCount(topic_id, likeValue, res);
            });
        }
    });
});

function updateLikesCount(topic_id, likeValue, res) {
    const updateCountQuery = 'UPDATE topics SET likes_count = likes_count + ? WHERE id = ?';
    db.query(updateCountQuery, [likeValue, topic_id], (err) => {
        if (err) {
            console.error('Erreur lors de la mise à jour du compteur de likes:', err);
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        return res.status(200).json({ success: true, message: 'Like mis à jour avec succès' });
    });
}

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

// Route pour récupérer les topics populaires
router.get('/popular-topics', (req, res) => {
    const query = 'SELECT * FROM topics WHERE likes_count > 0 OR comments_count > 0 ORDER BY likes_count DESC, comments_count DESC LIMIT 5';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        res.status(200).json({ success: true, topics: results });
    });
});

// Route pour créer une catégorie
router.post('/create-category', (req, res) => {
    const { name } = req.body;
    const query = 'INSERT INTO categories (name) VALUES (?)';
    db.query(query, [name], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        res.status(201).json({ success: true, message: 'Catégorie créée avec succès' });
    });
});

// Route pour récupérer toutes les catégories
router.get('/categories', (req, res) => {
    const query = 'SELECT * FROM categories';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        res.status(200).json({ success: true, categories: results });
    });
});

// Mise à jour de la route pour créer un topic pour inclure category_id
router.post('/create-topic', (req, res) => {
    const { title, body, tags, author_id, state, category_id } = req.body;
    const query = 'INSERT INTO topics (title, body, tags, author_id, state, category_id) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [title, body, tags, author_id, state, category_id], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        res.status(201).json({ success: true, message: 'Topic créé avec succès' });
    });
});

// Route pour récupérer les topics par catégorie
router.get('/topics/category/:category_id', (req, res) => {
    const categoryId = req.params.category_id;
    const query = 'SELECT * FROM topics WHERE category_id = ? ORDER BY created_at DESC';
    db.query(query, [categoryId], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        res.status(200).json({ success: true, topics: results });
    });
});

// Route pour obtenir les informations de l'utilisateur
router.get('/user/:id', (req, res) => {
    const userId = req.params.id;
    const query = 'SELECT id, username, email, biographie, profile_pic FROM users WHERE id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
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

// Route pour envoyer une demande d'ami
router.post('/send-friend-request', (req, res) => {
    const { requester_id, receiver_id } = req.body;
    const query = 'INSERT INTO friendships (requester_id, receiver_id, status) VALUES (?, ?, "pending")';
    db.query(query, [requester_id, receiver_id], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        res.status(201).json({ success: true, message: 'Demande d\'ami envoyée avec succès' });
    });
});

// Route pour accepter une demande d'ami
router.post('/accept-friend-request', (req, res) => {
    const { requester_id, receiver_id } = req.body;
    const query = 'UPDATE friendships SET status = "accepted" WHERE requester_id = ? AND receiver_id = ?';
    db.query(query, [requester_id, receiver_id], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        res.status(200).json({ success: true, message: 'Demande d\'ami acceptée avec succès' });
    });
});

// Route pour rejeter une demande d'ami
router.post('/reject-friend-request', (req, res) => {
    const { requester_id, receiver_id } = req.body;
    const query = 'UPDATE friendships SET status = "rejected" WHERE requester_id = ? AND receiver_id = ?';
    db.query(query, [requester_id, receiver_id], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        res.status(200).json({ success: true, message: 'Demande d\'ami rejetée avec succès' });
    });
});

// Route pour vérifier le statut de la relation d'amitié
router.get('/friendship-status', (req, res) => {
    const { user_id, other_user_id } = req.query;
    const query = 'SELECT status FROM friendships WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)';
    db.query(query, [user_id, other_user_id, other_user_id, user_id], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        if (results.length > 0) {
            res.status(200).json({ success: true, status: results[0].status });
        } else {
            res.status(200).json({ success: true, status: 'none' });
        }
    });
});

router.get('/friends/:user_id', (req, res) => {
    const userId = req.params.user_id;
    const query = `
        SELECT DISTINCT u.id, u.username, u.email, u.profile_pic 
        FROM friendships f
        JOIN users u ON (f.requester_id = u.id OR f.receiver_id = u.id)
        WHERE (f.requester_id = ? OR f.receiver_id = ?) AND u.id != ? AND f.status = 'accepted'
    `;
    db.query(query, [userId, userId, userId], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des amis:', err);
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        res.status(200).json({ success: true, friends: results });
    });
});

// Route pour récupérer les demandes d'amis en attente
router.get('/pending-friend-requests/:user_id', (req, res) => {
    const userId = req.params.user_id;
    const query = `
        SELECT f.*, u.username, u.profile_pic 
        FROM friendships f
        JOIN users u ON f.requester_id = u.id
        WHERE f.receiver_id = ? AND f.status = 'pending'
    `;
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des demandes d\'amis en attente:', err);
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        res.status(200).json({ success: true, requests: results });
    });
});

// Route pour supprimer un ami
router.post('/remove-friend', (req, res) => {
    const { user_id, friend_id } = req.body;
    const query = 'DELETE FROM friendships WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)';
    db.query(query, [user_id, friend_id, friend_id, user_id], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        res.status(200).json({ success: true, message: 'Ami supprimé avec succès' });
    });
});

// Route pour récupérer les topics privés des amis
router.get('/private-topics', (req, res) => {
    const { user_id, friend_id } = req.query;
    const query = `
        SELECT t.* 
        FROM topics t
        JOIN friendships f ON (f.requester_id = ? AND f.receiver_id = ? AND f.status = 'accepted') OR (f.requester_id = ? AND f.receiver_id = ? AND f.status = 'accepted')
        WHERE t.author_id = ?
    `;
    db.query(query, [user_id, friend_id, friend_id, user_id, friend_id], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        res.status(200).json({ success: true, topics: results });
    });
});

module.exports = router;

// Route pour créer une catégorie
router.post('/create-category', (req, res) => {
    const { name } = req.body;
    const query = 'INSERT INTO categories (name) VALUES (?)';
    db.query(query, [name], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        res.status(201).json({ success: true, message: 'Catégorie créée avec succès' });
    });
});

// Route pour récupérer toutes les catégories
router.get('/categories', (req, res) => {
    const query = 'SELECT * FROM categories';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        res.status(200).json({ success: true, categories: results });
    });
});
