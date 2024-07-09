document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = new URLSearchParams(window.location.search).get('id'); // Get the user ID from the URL
    const friendsPerPage = 5;
    let allFriends = [];

    if (!user) {
        // Redirection vers la page de connexion si l'utilisateur n'est pas connecté
        window.location.href = 'login.html';
        return;
    }

    const profileImages = [
        'profile1.png', 'profile2.png', 'profile3.png', 'profile4.png', 'profile5.png',
        'profile6.png', 'profile7.png', 'profile8.png', 'profile9.png', 'profile10.png',
        'profile11.png', 'profile12.png', 'profile13.png', 'profile14.png', 'profile15.png',
        'profile16.png', 'profile17.png', 'profile18.png', 'profile19.png', 'profile20.png'
    ];

    let currentProfileIndex = 0;
    const profileImageElement = document.getElementById('profile_pic');
    const profilePicInput = document.getElementById('profile_pic_input');
    const profilePicPreview = document.getElementById('profile_pic_preview');

    function updateProfileImage() {
        profileImageElement.src = profileImages[currentProfileIndex];
        profilePicInput.value = profileImages[currentProfileIndex];
        profilePicPreview.src = profileImages[currentProfileIndex]; // Update the preview image
    }

    fetch(`http://localhost:3000/user/${userId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const isOwner = user.id === data.user.id;

                document.getElementById('username-display').textContent = data.user.username;
                document.getElementById('biographie-display').textContent = data.user.biographie;
                document.getElementById('profile_pic').src = data.user.profile_pic;
                document.getElementById('profile_pic_preview').src = data.user.profile_pic; // Set initial preview image
                document.getElementById('last_login').textContent = new Date(data.user.last_login).toLocaleString();
                document.getElementById('messages-count').textContent = data.user.messages_count;
                document.getElementById('topics-count').textContent = data.user.topics_count;

                if (isOwner) {
                    document.getElementById('email-display').textContent = data.user.email;
                    document.getElementById('username').value = data.user.username;
                    document.getElementById('email').textContent = data.user.email;
                    document.getElementById('biographie').value = data.user.biographie;
                    document.getElementById('profile_pic_input').value = data.user.profile_pic;
                    document.getElementById('editProfileButton').style.display = 'block';
                } else {
                    document.getElementById('email-display').parentElement.style.display = 'none';
                    document.getElementById('editProfileButton').style.display = 'none';
                }

                // Fetch friendship status
                fetch(`http://localhost:3000/friendship-status?user_id=${user.id}&other_user_id=${userId}`)
                    .then(response => response.json())
                    .then(friendshipData => {
                        if (friendshipData.success) {
                            document.getElementById('friendship_status').textContent = friendshipData.status;
                            if (!isOwner && friendshipData.status === 'none') {
                                document.getElementById('addFriendButton').style.display = 'block';
                            }
                        } else {
                            console.error('Erreur lors de la vérification du statut d\'amitié:', friendshipData.message);
                        }
                    })
                    .catch(error => console.error('Erreur:', error));

                loadFriends(userId); // Load friends for the current page
            } else {
                alert('Erreur : ' + data.message);
            }
        })
        .catch(error => console.error('Erreur:', error));

    document.getElementById('editProfileButton').addEventListener('click', function() {
        document.getElementById('profileDisplay').style.display = 'none';
        document.getElementById('profileEdit').style.display = 'flex';
        document.getElementById('friendsListContainer').style.display = 'none'; // Hide friends list
    });

    document.getElementById('updateProfileForm').addEventListener('submit', function(event) {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const biographie = document.getElementById('biographie').value;
        const profile_pic = document.getElementById('profile_pic_input').value;

        fetch(`http://localhost:3000/user/${user.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, biographie, profile_pic })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Profil mis à jour avec succès !');
                location.reload();
            } else {
                alert('Erreur : ' + data.message);
            }
        })
        .catch(error => console.error('Erreur:', error));
    });

    document.getElementById('changeProfilePic').addEventListener('click', function() {
        currentProfileIndex = (currentProfileIndex + 1) % profileImages.length;
        updateProfileImage();
    });

    document.getElementById('addFriendButton').addEventListener('click', function() {
        fetch('http://localhost:3000/send-friend-request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ requester_id: user.id, receiver_id: userId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Demande d\'ami envoyée avec succès !');
                document.getElementById('addFriendButton').style.display = 'none';
                document.getElementById('friendship_status').textContent = 'pending';
            } else {
                alert('Erreur : ' + data.message);
            }
        })
        .catch(error => console.error('Erreur:', error));
    });

    function loadFriends(userId) {
        fetch(`http://localhost:3000/friends/${userId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    allFriends = data.friends;
                    displayFriends();
                } else {
                    console.error('Erreur lors de la récupération des amis:', data.message);
                }
            })
            .catch(error => console.error('Erreur lors de la récupération des amis:', error));
    }

    function displayFriends() {
        const friendsListContainer = document.getElementById('friendsListContainer');
        friendsListContainer.innerHTML = '';

        const friendsToDisplay = allFriends.slice(0, friendsPerPage);

        friendsToDisplay.forEach(friend => {
            const friendItem = document.createElement('div');
            friendItem.classList.add('friend');

            friendItem.innerHTML = `
            <div id="friend-container">
                <div id="left-friend">
                    <img src="${friend.profile_pic}" alt="Profile Image" class="friend-pic">
                    <span>${friend.username}</span>
                </div>
                <button class="remove-friend" id="white-button" data-friend-id="${friend.id}">
                    <img src="break.png" id="break">
                </button>
            </div>
            `;
            friendsListContainer.appendChild(friendItem);
        });

        document.querySelectorAll('.remove-friend').forEach(button => {
            button.addEventListener('click', function() {
                const friendId = this.getAttribute('data-friend-id');
                showConfirmationModal(friendId);
            });
        });

        document.getElementById('loadMoreFriends').style.display = allFriends.length > friendsPerPage ? 'block' : 'none';
        document.getElementById('showLessFriends').style.display = 'none'; // Hide the "Voir moins" button initially
    }

    document.getElementById('loadMoreFriends').addEventListener('click', function() {
        const friendsListContainer = document.getElementById('friendsListContainer');
        friendsListContainer.classList.add('expanded');
        displayAllFriends();
    });

    document.getElementById('showLessFriends').addEventListener('click', function() {
        const friendsListContainer = document.getElementById('friendsListContainer');
        friendsListContainer.classList.remove('expanded');
        displayFriends();
    });

    function displayAllFriends() {
        const friendsListContainer = document.getElementById('friendsListContainer');
        friendsListContainer.innerHTML = '';

        allFriends.forEach(friend => {
            const friendItem = document.createElement('div');
            friendItem.classList.add('friend');

            friendItem.innerHTML = `
            <div id="friend-container">
                <div id="left-friend">
                    <img src="${friend.profile_pic}" alt="Profile Image" class="friend-pic">
                    <span>${friend.username}</span>
                </div>
                <button class="remove-friend" id="white-button" data-friend-id="${friend.id}">
                    <img src="break.png" id="break">
                </button>
            </div>
            `;
            friendsListContainer.appendChild(friendItem);
        });

        document.querySelectorAll('.remove-friend').forEach(button => {
            button.addEventListener('click', function() {
                const friendId = this.getAttribute('data-friend-id');
                showConfirmationModal(friendId);
            });
        });

        document.getElementById('loadMoreFriends').style.display = 'none';
        document.getElementById('showLessFriends').style.display = allFriends.length > friendsPerPage ? 'block' : 'none';
    }

    function showConfirmationModal(friendId) {
        const modal = document.getElementById('confirmModal');
        const confirmDeleteButton = document.getElementById('confirmDelete');
        const cancelDeleteButton = document.getElementById('cancelDelete');
        const closeModalButton = document.querySelector('.close');

        modal.style.display = 'block';

        closeModalButton.onclick = function() {
            modal.style.display = 'none';
        }

        cancelDeleteButton.onclick = function() {
            modal.style.display = 'none';
        }

        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        }

        confirmDeleteButton.onclick = function() {
            removeFriend(friendId);
            modal.style.display = 'none';
        }
    }

    function removeFriend(friendId) {
        fetch('http://localhost:3000/remove-friend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: user.id, friend_id: friendId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Ami supprimé avec succès !');
                loadFriends(userId); // Reload friends
            } else {
                alert('Erreur : ' + data.message);
            }
        })
        .catch(error => console.error('Erreur lors de la suppression de l\'ami:', error));
    }

    document.getElementById('logoutButton').addEventListener('click', function() {
        localStorage.removeItem('user');
        alert('Vous avez été déconnecté.');
        window.location.href = 'login.html';
    });
});
