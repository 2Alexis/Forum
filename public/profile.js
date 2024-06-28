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
});

document.getElementById('logout').addEventListener('click', function() {
    localStorage.removeItem('user');
    alert('Vous avez été déconnecté.');
    window.location.href = 'login.html';
});