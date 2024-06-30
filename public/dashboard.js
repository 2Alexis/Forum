document.addEventListener('DOMContentLoaded', function () {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
        alert('Accès interdit. Vous devez être un administrateur pour accéder à cette page.');
        window.location.href = 'home.html';
        return;
    }

    function loadUsers() {
        fetch('http://localhost:3000/users', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const usersContainer = document.getElementById('users-container');
                usersContainer.innerHTML = '';
                data.users.forEach(user => {
                    const userElement = document.createElement('div');
                    userElement.classList.add('user');
                    userElement.innerHTML = `
                        <p><strong>Nom d'utilisateur:</strong> ${user.username}</p>
                        <p><strong>Email:</strong> ${user.email}</p>
                        <p><strong>Statut:</strong> ${user.status}</p>
                        <button class="ban-user" data-user-id="${user.id}">Bannir</button>
                    `;
                    usersContainer.appendChild(userElement);
                });

                document.querySelectorAll('.ban-user').forEach(button => {
                    button.addEventListener('click', function () {
                        const userId = this.getAttribute('data-user-id');
                        fetch(`http://localhost:3000/admin/users/${userId}/ban`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${user.token}`
                            }
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                alert('Utilisateur banni avec succès.');
                                loadUsers();
                            } else {
                                alert('Erreur : ' + data.message);
                            }
                        })
                        .catch(error => console.error('Erreur:', error));
                    });
                });
            } else {
                alert('Erreur : ' + data.message);
            }
        })
        .catch(error => console.error('Erreur:', error));
    }

    function loadTopics() {
        fetch('http://localhost:3000/topics', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const topicsContainer = document.getElementById('topics-container');
                topicsContainer.innerHTML = '';
                data.topics.forEach(topic => {
                    const topicElement = document.createElement('div');
                    topicElement.classList.add('topic');
                    topicElement.innerHTML = `
                        <h3>${topic.title}</h3>
                        <p>${topic.body}</p>
                        <button class="edit-topic-state" data-topic-id="${topic.id}">Modifier l'état</button>
                        <button class="delete-topic" data-topic-id="${topic.id}">Supprimer</button>
                    `;
                    topicsContainer.appendChild(topicElement);
                });

                document.querySelectorAll('.edit-topic-state').forEach(button => {
                    button.addEventListener('click', function () {
                        const topicId = this.getAttribute('data-topic-id');
                        const newState = prompt('Entrez le nouvel état du topic:');
                        if (newState) {
                            fetch(`http://localhost:3000/admin/topics/${topicId}/state`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${user.token}`
                                },
                                body: JSON.stringify({ state: newState })
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    alert('État du topic modifié avec succès.');
                                    loadTopics();
                                } else {
                                    alert('Erreur : ' + data.message);
                                }
                            })
                            .catch(error => console.error('Erreur:', error));
                        }
                    });
                });

                document.querySelectorAll('.delete-topic').forEach(button => {
                    button.addEventListener('click', function () {
                        const topicId = this.getAttribute('data-topic-id');
                        fetch(`http://localhost:3000/admin/topics/${topicId}`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${user.token}`
                            }
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                alert('Topic supprimé avec succès.');
                                loadTopics();
                            } else {
                                alert('Erreur : ' + data.message);
                            }
                        })
                        .catch(error => console.error('Erreur:', error));
                    });
                });
            } else {
                alert('Erreur : ' + data.message);
            }
        })
        .catch(error => console.error('Erreur:', error));
    }

    function loadMessages() {
        fetch('http://localhost:3000/admin/messages', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const messagesContainer = document.getElementById('messages-container');
                messagesContainer.innerHTML = '';
                data.messages.forEach(message => {
                    const messageElement = document.createElement('div');
                    messageElement.classList.add('message');
                    messageElement.innerHTML = `
                        <p><strong>${message.username}:</strong> ${message.body}</p>
                        <button class="delete-message" data-message-id="${message.id}">Supprimer</button>
                    `;
                    messagesContainer.appendChild(messageElement);
                });

                document.querySelectorAll('.delete-message').forEach(button => {
                    button.addEventListener('click', function () {
                        const messageId = this.getAttribute('data-message-id');
                        fetch(`http://localhost:3000/admin/messages/${messageId}`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${user.token}`
                            }
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                alert('Message supprimé avec succès.');
                                loadMessages();
                            } else {
                                alert('Erreur : ' + data.message);
                            }
                        })
                        .catch(error => console.error('Erreur:', error));
                    });
                });
            } else {
                alert('Erreur : ' + data.message);
            }
        })
        .catch(error => console.error('Erreur:', error));
    }

    document.getElementById('logout').addEventListener('click', function () {
        localStorage.removeItem('user');
        alert('Vous avez été déconnecté.');
        window.location.href = 'login.html';
    });

    loadUsers();
    loadTopics();
    loadMessages();
});
