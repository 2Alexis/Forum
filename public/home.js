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
            <li><a href="user.html?id=${user.id}" id="profile-link">Profil</a></li>
            <li><a href="#" id="logout">Déconnexion</a></li>
        `;

        document.getElementById('logout').addEventListener('click', function() {
            localStorage.removeItem('user');
            alert('Vous avez été déconnecté.');
            window.location.href = 'login.html';
        });
    }
});
