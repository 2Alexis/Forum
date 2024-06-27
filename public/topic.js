document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        alert('Vous devez être connecté pour ajouter un message.');
        window.location.href = 'login.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const topicId = urlParams.get('id');

    fetch(`http://localhost:3000/topics/${topicId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('topic-title').textContent = data.topic.title;
                document.getElementById('topic-body').textContent = data.topic.body;

                // Si l'utilisateur est le créateur du topic, afficher les boutons de modification et de suppression
                if (user.id === data.topic.author_id) { // Vérifiez si l'utilisateur est l'auteur du topic
                    const adminControls = document.createElement('div');
                    adminControls.innerHTML = `
                        <button id="edit-topic">Modifier le Topic</button>
                        <button id="delete-topic">Supprimer le Topic</button>
                    `;
                    document.getElementById('topic-body').after(adminControls);

                    document.getElementById('edit-topic').addEventListener('click', () => {
                        // Ajouter les fonctionnalités de modification ici
                    });

                    document.getElementById('delete-topic').addEventListener('click', () => {
                        fetch(`http://localhost:3000/topics/${topicId}`, {
                            method: 'DELETE'
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                alert('Topic supprimé avec succès.');
                                window.location.href = 'home.html';
                            } else {
                                alert('Erreur : ' + data.message);
                            }
                        })
                        .catch(error => console.error('Erreur:', error));
                    });
                }

                const messagesContainer = document.getElementById('messages-container');
                data.messages.forEach(message => {
                    const messageElement = document.createElement('div');
                    messageElement.classList.add('message');
                    messageElement.innerHTML = `
                        <p><strong>${message.username}:</strong> ${message.body}</p>
                        <p><em>Posté le ${new Date(message.created_at).toLocaleString()}</em></p>
                    `;

                    if (user.id === data.topic.author_id || user.id === message.user_id) { // Vérifiez si l'utilisateur peut supprimer le message
                        messageElement.insertAdjacentHTML('beforeend', `
                            <button class="delete-message" data-message-id="${message.id}">Supprimer</button>
                        `);
                    }

                    messagesContainer.appendChild(messageElement);
                });

                document.querySelectorAll('.delete-message').forEach(button => {
                    button.addEventListener('click', function() {
                        const messageId = this.getAttribute('data-message-id');
                        
                        fetch(`http://localhost:3000/messages/${messageId}`, {
                            method: 'DELETE'
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                alert('Message supprimé avec succès.');
                                location.reload();
                            } else {
                                alert('Erreur : ' + data.message);
                            }
                        })
                        .catch(error => console.error('Erreur:', error));
                    });
                });
            } else {
                alert(data.message);
            }
        })
        .catch(error => console.error('Erreur:', error));

    document.getElementById('addMessageForm').addEventListener('submit', function(event) {
        event.preventDefault();
        
        const body = document.getElementById('message-body').value;

        fetch('http://localhost:3000/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ topic_id: topicId, user_id: user.id, body })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Message ajouté avec succès !');
                location.reload(); // Recharger la page pour voir le nouveau message
            } else {
                alert('Erreur : ' + data.message);
            }
        })
        .catch(error => console.error('Erreur:', error));
    });

    document.getElementById('logout').addEventListener('click', function() {
        localStorage.removeItem('user');
        alert('Vous avez été déconnecté.');
        window.location.href = 'login.html';
    });
});
