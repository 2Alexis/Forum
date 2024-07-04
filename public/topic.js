document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        alert('Vous devez être connecté pour ajouter un message.');
        window.location.href = 'login.html';
        return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const topicId = urlParams.get('id');
    const sortOrderSelect = document.getElementById('sort-order');
    let currentPage = 1;

    function loadTopicAndMessages(sortOrder = 'recent', page = 1) {
        fetch(`http://localhost:3000/topics/${topicId}?sortOrder=${sortOrder}&page=${page}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const topic = data.topic;
                    document.getElementById('topic-title').textContent = topic.title;
                    document.getElementById('topic-body').textContent = topic.body;
                    document.getElementById('topic-author-pic').src = topic.author_profile_pic;
                    document.getElementById('topic-author-name').textContent = `${topic.author_name}`;
                    document.getElementById('topic-created-at').textContent = `Posté le: ${new Date(topic.created_at).toLocaleString()}`;

                    // Vérifiez si les boutons d'administration existent déjà
                    let adminControls = document.getElementById('admin-controls');
                    if (user.id === topic.author_id && !adminControls) {
                        adminControls = document.createElement('div');
                        adminControls.id = 'admin-controls';
                        adminControls.innerHTML = `
                            <button id="edit-topic">Modifier le Topic</button>
                            <button id="delete-topic">Supprimer le Topic</button>
                        `;
                        document.getElementById('topic-body').after(adminControls);

                        document.getElementById('edit-topic').addEventListener('click', () => {
                            const currentBody = document.getElementById('topic-body').textContent;
                            const editForm = document.createElement('div');
                            editForm.innerHTML = `
                                <textarea id="edit-body">${currentBody}</textarea>
                                <button id="save-edit">Enregistrer</button>
                                <button id="cancel-edit">Annuler</button>
                            `;
                            document.getElementById('topic-body').replaceWith(editForm);

                            document.getElementById('save-edit').addEventListener('click', () => {
                                const newBody = document.getElementById('edit-body').value.trim();
                                if (!newBody) {
                                    alert('Le corps du message ne peut pas être vide.');
                                    return;
                                }

                                fetch(`http://localhost:3000/topics/${topicId}`, {
                                    method: 'PUT',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ body: newBody })
                                })
                                .then(response => response.json())
                                .then(data => {
                                    if (data.success) {
                                        alert('Topic mis à jour avec succès !');
                                        loadTopicAndMessages(sortOrderSelect.value, currentPage);
                                    } else {
                                        alert('Erreur : ' + data.message);
                                    }
                                })
                                .catch(error => console.error('Erreur:', error));
                            });

                            document.getElementById('cancel-edit').addEventListener('click', () => {
                                loadTopicAndMessages(sortOrderSelect.value, currentPage);
                            });
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
                    messagesContainer.innerHTML = '';
                    data.messages.forEach(message => {
                        const messageElement = document.createElement('div');
                        messageElement.classList.add('message');
                        messageElement.innerHTML = `
                            <div id="message-header">
                                <img class="profile-pic" src="${message.profile_pic}" alt="Profile Picture">
                                <p>${message.username}</p>
                            </div>
                            <div id="message">
                                <p id="message-text">${message.body}</p>
                            </div>
                            <p><em>Posté le ${new Date(message.created_at).toLocaleString()}</em></p>
                            <p id="popularite"><strong>Popularité:</strong> ${message.popularity || 0}</p>
                            <div id="likes">
                            <button class="like-button" data-message-id="${message.id}" data-type="like">Like</button>
                            <button class="dislike-button" data-message-id="${message.id}" data-type="dislike">Dislike</button>
                            </div>
                        `;

                        if (user.id === topic.author_id || user.id === message.user_id) {
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
                                    loadTopicAndMessages(sortOrderSelect.value, currentPage);
                                } else {
                                    alert('Erreur : ' + data.message);
                                }
                            })
                            .catch(error => console.error('Erreur:', error));
                        });
                    });

                    document.querySelectorAll('.like-button, .dislike-button').forEach(button => {
                        button.addEventListener('click', function() {
                            const messageId = this.getAttribute('data-message-id');
                            const type = this.getAttribute('data-type');
                            fetch('http://localhost:3000/like-message', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ user_id: user.id, message_id: messageId, type })
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    loadTopicAndMessages(sortOrderSelect.value, currentPage);
                                } else {
                                    alert('Erreur : ' + data.message);
                                }
                            })
                            .catch(error => console.error('Erreur:', error));
                        });
                    });

                    // Manage pagination buttons
                    const prevPageButton = document.getElementById('prev-page');
                    const nextPageButton = document.getElementById('next-page');

                    // Show or hide previous page button
                    if (page > 1) {
                        prevPageButton.style.display = 'inline-block';
                    } else {
                        prevPageButton.style.display = 'none';
                    }

                    // Show or hide next page button
                    if (data.messages.length === 10) {
                        nextPageButton.style.display = 'inline-block';
                    } else {
                        nextPageButton.style.display = 'none';
                    }
                } else {
                    alert(data.message);
                }
            })
            .catch(error => console.error('Erreur:', error));
    }

    sortOrderSelect.addEventListener('change', function() {
        loadTopicAndMessages(this.value, currentPage);
    });

    document.getElementById('addMessageForm').addEventListener('submit', function(event) {
        event.preventDefault();

        const body = document.getElementById('message-body').value.trim();
        if (!body) {
            alert('Le corps du message ne peut pas être vide.');
            return;
        }

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
                document.getElementById('message-body').value = ''; // Clear the input field
                loadTopicAndMessages(sortOrderSelect.value, currentPage);
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

    document.getElementById('prev-page').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            loadTopicAndMessages(sortOrderSelect.value, currentPage);
        }
    });

    document.getElementById('next-page').addEventListener('click', function() {
        currentPage++;
        loadTopicAndMessages(sortOrderSelect.value, currentPage);
    });

    loadTopicAndMessages();
});
