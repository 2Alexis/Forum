document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    const currentUser = JSON.parse(localStorage.getItem('user'));

    if (!userId) {
        alert('Utilisateur non trouvé.');
        window.location.href = 'home.html';
        return;
    }

    fetch(`http://localhost:3000/user/${userId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const user = data.user;
                const userProfileContainer = document.getElementById('user-profile-container');
                userProfileContainer.innerHTML = `
                    <h1>Profil de ${user.username}</h1>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Biographie:</strong> ${user.biographie}</p>
                    <img src="${user.profile_pic}" alt="Profile Picture">
                `;
                checkFriendshipStatus(currentUser.id, userId);
            } else {
                alert('Erreur : ' + data.message);
                window.location.href = 'home.html';
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            alert('Erreur lors du chargement du profil.');
            window.location.href = 'home.html';
        });

    function checkFriendshipStatus(currentUserId, userId) {
        fetch(`http://localhost:3000/friendship-status?user_id=${currentUserId}&other_user_id=${userId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const status = data.status;
                    if (status === 'none') {
                        document.getElementById('send-friend-request').style.display = 'block';
                    } else if (status === 'pending' && currentUserId != userId) {
                        document.getElementById('accept-friend-request').style.display = 'block';
                        document.getElementById('reject-friend-request').style.display = 'block';
                    } else if (status === 'accepted') {
                        document.getElementById('private-topics-container').style.display = 'block';
                        loadPrivateTopics(currentUserId, userId);
                    }
                } else {
                    alert('Erreur lors de la vérification du statut d\'ami.');
                }
            })
            .catch(error => console.error('Erreur:', error));
    }

    document.getElementById('send-friend-request').addEventListener('click', function() {
        fetch('http://localhost:3000/send-friend-request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ requester_id: currentUser.id, receiver_id: userId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Demande d\'ami envoyée avec succès.');
                document.getElementById('send-friend-request').style.display = 'none';
            } else {
                alert('Erreur : ' + data.message);
            }
        })
        .catch(error => console.error('Erreur:', error));
    });

    document.getElementById('accept-friend-request').addEventListener('click', function() {
        fetch('http://localhost:3000/accept-friend-request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ requester_id: userId, receiver_id: currentUser.id })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Demande d\'ami acceptée avec succès.');
                document.getElementById('accept-friend-request').style.display = 'none';
                document.getElementById('reject-friend-request').style.display = 'none';
                document.getElementById('private-topics-container').style.display = 'block';
                loadPrivateTopics(currentUser.id, userId);
            } else {
                alert('Erreur : ' + data.message);
            }
        })
        .catch(error => console.error('Erreur:', error));
    });

    document.getElementById('reject-friend-request').addEventListener('click', function() {
        fetch('http://localhost:3000/reject-friend-request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ requester_id: userId, receiver_id: currentUser.id })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Demande d\'ami rejetée.');
                document.getElementById('accept-friend-request').style.display = 'none';
                document.getElementById('reject-friend-request').style.display = 'none';
            } else {
                alert('Erreur : ' + data.message);
            }
        })
        .catch(error => console.error('Erreur:', error));
    });

    function loadPrivateTopics(currentUserId, userId) {
        fetch(`http://localhost:3000/private-topics?user_id=${currentUserId}&friend_id=${userId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const privateTopicsContainer = document.getElementById('private-topics');
                    privateTopicsContainer.innerHTML = '';
                    data.topics.forEach(topic => {
                        const topicElement = document.createElement('div');
                        topicElement.classList.add('topic');
                        topicElement.innerHTML = `
                            <h2><a href="topic.html?id=${topic.id}">${topic.title}</a></h2>
                            <p>${topic.body}</p>
                            <p><strong>Tags:</strong> ${topic.tags}</p>
                            <p><strong>Created at:</strong> ${new Date(topic.created_at).toLocaleString()}</p>
                        `;
                        privateTopicsContainer.appendChild(topicElement);
                    });
                } else {
                    alert('Erreur lors du chargement des topics privés.');
                }
            })
            .catch(error => console.error('Erreur:', error));
    }
});
