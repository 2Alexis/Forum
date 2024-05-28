document.addEventListener('DOMContentLoaded', function() {
    // Récupérer les informations de l'utilisateur connecté
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        alert('Vous devez être connecté pour créer un topic.');
        window.location.href = 'login.html';
        return;
    }
    
    document.getElementById('author').value = user.username;

    document.getElementById('createTopicForm').addEventListener('submit', function (event) {
        event.preventDefault();

        const title = document.getElementById('title').value;
        const body = document.getElementById('body').value;
        const tags = document.getElementById('tags').value;
        const author = document.getElementById('author').value;
        const state = document.getElementById('state').value;

        fetch('http://localhost:3000/create-topic', { // URL complète vers le serveur backend
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, body, tags, author, state })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Topic créé avec succès !');
                window.location.href = 'home.html'; // Redirige vers la page d'accueil
            } else {
                alert('Erreur : ' + data.message);
            }
        })
        .catch(error => console.error('Erreur:', error));
    });
});
