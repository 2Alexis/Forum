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

                const messagesContainer = document.getElementById('messages-container');
                data.messages.forEach(message => {
                    const messageElement = document.createElement('div');
                    messageElement.classList.add('message');
                    messageElement.innerHTML = `
                        <p><strong>${message.username}:</strong> ${message.body}</p>
                        <p><em>Posté le ${new Date(message.created_at).toLocaleString()}</em></p>
                    `;
                    messagesContainer.appendChild(messageElement);
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
