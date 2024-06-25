document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');

    if (userId) {
        fetch(`http://localhost:3000/user/${userId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const user = data.user;
                    document.getElementById('username').textContent = user.username;
                    document.getElementById('email').textContent = user.email;
                    document.getElementById('biographie').textContent = user.biographie;
                    document.getElementById('profile_pic').textContent = user.profile_pic;
                    document.getElementById('friendship_status').textContent = user.friendship_status;
                    document.getElementById('last_login').textContent = user.last_login;
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
            });
    } else {
        alert('Utilisateur non trouvé');
    }
});

function editField(field) {
    const value = document.getElementById(field).textContent;
    const newValue = prompt(`Modifier ${field}:`, value);

    if (newValue !== null && newValue !== value) {
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('id');

        fetch(`http://localhost:3000/user/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ [field]: newValue })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById(field).textContent = newValue;
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
        });
    }
}
