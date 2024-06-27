document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));

    const navbar = document.querySelector('nav ul');

    if (!user) {
        // Si l'utilisateur n'est pas connecté, afficher les boutons de connexion et d'inscription
        navbar.innerHTML = `
            <li><a href="home.html">Accueil</a></li>
            <li><a href="create-topic.html">Créer un Topic</a></li>
            <li><a href="login.html">Connexion</a></li>
            <li><a href="index.html">Inscription</a></li>
        `;
    } else {
        // Si l'utilisateur est connecté, afficher les informations du profil et le bouton de déconnexion
        navbar.innerHTML = `
            <li><a href="home.html">Accueil</a></li>
            <li><a href="create-topic.html">Créer un Topic</a></li>
            <li class="dropdown">
                <a href="#" id="profile-link">Profil</a>
                <div class="dropdown-content" id="profile-dropdown">
                    <h2>Informations du profil</h2>
                    <p>Nom d'utilisateur : ${user.username}</p>
                    <p>Email : ${user.email}</p>
                </div>
            </li>
            <li><a href="#" id="logout">Déconnexion</a></li>
        `;

        document.getElementById('logout').addEventListener('click', function() {
            localStorage.removeItem('user');
            alert('Vous avez été déconnecté.');
            window.location.href = 'login.html';
        });
    }

    // Récupérer et afficher les topics
    fetch('http://localhost:3000/topics')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const topicsContainer = document.createElement('div');
                topicsContainer.id = 'topics-container';
                document.body.appendChild(topicsContainer);

                data.topics.forEach(topic => {
                    const topicElement = document.createElement('div');
                    topicElement.classList.add('topic');
                    topicElement.innerHTML = `
                        <h2>${topic.title}</h2>
                        <p>${topic.body}</p>
                        <p><strong>Tags:</strong> ${topic.tags}</p>
                        <p><strong>Author:</strong> ${topic.author}</p>
                        <p><strong>Created at:</strong> ${new Date(topic.created_at).toLocaleString()}</p>
                    `;
                    topicsContainer.appendChild(topicElement);
                });
            } else {
                console.error('Failed to load topics:', data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
});
