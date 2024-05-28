document.getElementById('registerForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    fetch('http://localhost:3000/register', { // URL complète vers le serveur backend
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
            window.location.href = 'login.html'; // Redirige vers la page de connexion
        } else {
            alert('Erreur : ' + data.message);
        }
    })
    .catch(error => console.error('Erreur:', error));
});
