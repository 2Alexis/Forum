document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        // Redirection vers la page de connexion si l'utilisateur n'est pas connecté
        window.location.href = 'login.html';
        return;
    }

    fetch(`http://localhost:3000/user/${user.id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('username-display').textContent = data.user.username;
                document.getElementById('email-display').textContent = data.user.email;
                document.getElementById('biographie-display').textContent = data.user.biographie;
                document.getElementById('profile_pic').src = `${data.user.profile_pic}`;
                document.getElementById('friendship_status').textContent = data.user.friendship_status;
                document.getElementById('last_login').textContent = new Date(data.user.last_login).toLocaleString();

                document.getElementById('username').value = data.user.username;
                document.getElementById('email').textContent = data.user.email;
                document.getElementById('biographie').value = data.user.biographie;
                document.getElementById('profile_pic_input').value = data.user.profile_pic;
                loadFriends();
            } else {
                alert('Erreur : ' + data.message);
            }
        })
        .catch(error => console.error('Erreur:', error));

    document.getElementById('editProfileButton').addEventListener('click', function() {
        document.getElementById('profileDisplay').style.display = 'none';
        document.getElementById('profileEdit').style.display = 'block';
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
        const profileImages = [
            'profile1.png', 'profile2.png', 'profile3.png', 'profile4.png', 'profile5.png',
            'profile6.png', 'profile7.png', 'profile8.png', 'profile9.png', 'profile10.png',
            'profile11.png', 'profile12.png', 'profile13.png', 'profile14.png', 'profile15.png',
            'profile16.png', 'profile17.png', 'profile18.png', 'profile19.png', 'profile20.png'
        ];

        let currentProfileIndex = Math.floor(Math.random() * profileImages.length);
        const profileImageElement = document.getElementById('profile_pic');
        const profilePicInput = document.getElementById('profile_pic_input');

        function updateProfileImage() {
            profileImageElement.src = `${profileImages[currentProfileIndex]}`;
            profilePicInput.value = profileImages[currentProfileIndex];
        }

        updateProfileImage();

        document.getElementById('changeProfilePic').addEventListener('click', function() {
            currentProfileIndex = (currentProfileIndex + 1) % profileImages.length;
            updateProfileImage();
        });
    });

    function loadFriends() {
        fetch(`http://localhost:3000/friends/${user.id}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const friendsListContainer = document.getElementById('friendsListContainer');
                    friendsListContainer.innerHTML = '';
                    data.friends.forEach(friend => {
                        const friendItem = document.createElement('li');
                        friendItem.innerHTML = `
                            <img src="${friend.profile_pic}" alt="Profile Image" class="friend-pic">
                            <span>${friend.username}</span>
                            <button class="remove-friend" data-friend-id="${friend.id}">Supprimer</button>
                        `;
                        friendsListContainer.appendChild(friendItem);
                    });

                    document.querySelectorAll('.remove-friend').forEach(button => {
                        button.addEventListener('click', function() {
                            const friendId = this.getAttribute('data-friend-id');
                            showConfirmationModal(friendId);
                        });
                    });
                } else {
                    console.error('Erreur lors de la récupération des amis:', data.message);
                }
            })
            .catch(error => console.error('Erreur lors de la récupération des amis:', error));
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
                loadFriends();
            } else {
                alert('Erreur : ' + data.message);
            }
        })
        .catch(error => console.error('Erreur lors de la suppression de l\'ami:', error));
    }

    document.getElementById('logout').addEventListener('click', function() {
        localStorage.removeItem('user');
        alert('Vous avez été déconnecté.');
        window.location.href = 'login.html';
    });
});
