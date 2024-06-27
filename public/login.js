document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const identifier = document.getElementById('identifier').value;
    const password = document.getElementById('password').value;

    fetch('http://localhost:3000/login', { // URL complète vers le serveur backend
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ identifier, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Connexion réussie !');
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = 'home.html'; // Redirige vers la page d'accueil
        } else {
            alert('Erreur : ' + data.message);
        }
    })
    .catch(error => console.error('Erreur:', error));
});