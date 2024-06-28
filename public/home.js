document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    let currentPage = 1;
    const navbar = document.querySelector('nav ul');

    if (!user) {
        // Si l'utilisateur n'est pas connecté, afficher les boutons de connexion et d'inscription
        navbar.innerHTML = `
            <li><a href="home.html">Accueil</a></li>
            <li><a href="login.html">Connexion</a></li>
            <li><a href="index.html">Inscription</a></li>
        `;
    } else {
        // Si l'utilisateur est connecté, afficher les informations du profil et le bouton de déconnexion
        navbar.innerHTML = `
            <li><a href="home.html">Accueil</a></li>
            <li class="dropdown">
                <a href="#">Catégories</a>
                <div class="dropdown-content" id="categories-dropdown">
                    <!-- Les catégories seront insérées ici -->
                </div>
            </li>
            <li><a href="profile.html?id=${user.id}" id="profile-link">Profil</a></li>
            <li><a href="#" id="logout">Déconnexion</a></li>
        `;

        document.getElementById('logout').addEventListener('click', function() {
            localStorage.removeItem('user');
            alert('Vous avez été déconnecté.');
            window.location.href = 'login.html';
        });
    }

    function loadCategories() {
        fetch('http://localhost:3000/categories')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const categoriesDropdown = document.getElementById('categories-dropdown');
                    data.categories.forEach(category => {
                        const categoryElement = document.createElement('a');
                        categoryElement.href = `#`;
                        categoryElement.textContent = category.name;
                        categoryElement.addEventListener('click', () => {
                            loadTopicsByCategory(category.id);
                        });
                        categoriesDropdown.appendChild(categoryElement);
                    });
                } else {
                    console.error('Failed to load categories:', data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    function loadTopics(page) {
        fetch(`http://localhost:3000/topics?page=${page}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const topicsContainer = document.getElementById('topics-container');
                    topicsContainer.innerHTML = ''; // Clear existing topics
                    data.topics.forEach(topic => {
                        const topicElement = document.createElement('div');
                        topicElement.classList.add('topic');
                        topicElement.innerHTML = `
                            <h2><a href="topic.html?id=${topic.id}">${topic.title}</a></h2>
                            <p>${topic.body}</p>
                            <p><strong>Tags:</strong> ${topic.tags}</p>
                            <p><strong>Author:</strong> ${topic.author}</p>
                            <p><strong>Created at:</strong> ${new Date(topic.created_at).toLocaleString()}</p>
                            <button class="like-button" data-topic-id="${topic.id}" data-type="like">Like</button>
                            <button class="dislike-button" data-topic-id="${topic.id}" data-type="dislike">Dislike</button>
                        `;
                        topicsContainer.appendChild(topicElement);
                    });
                    document.querySelectorAll('.like-button, .dislike-button').forEach(button => {
                        button.addEventListener('click', function() {
                            const topicId = this.getAttribute('data-topic-id');
                            const type = this.getAttribute('data-type');
                            fetch('http://localhost:3000/like', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ user_id: user.id, topic_id: topicId, type })
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    alert(`${type === 'like' ? 'Liked' : 'Disliked'} successfully!`);
                                    loadTopics(currentPage); // Reload topics
                                } else {
                                    alert('Erreur : ' + data.message);
                                }
                            })
                            .catch(error => console.error('Erreur:', error));
                        });
                    });
                } else {
                    console.error('Failed to load topics:', data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    function loadTopicsByCategory(categoryId) {
        fetch(`http://localhost:3000/topics/category/${categoryId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const topicsContainer = document.getElementById('topics-container');
                    topicsContainer.innerHTML = ''; // Clear existing topics
                    data.topics.forEach(topic => {
                        const topicElement = document.createElement('div');
                        topicElement.classList.add('topic');
                        topicElement.innerHTML = `
                            <h2><a href="topic.html?id=${topic.id}">${topic.title}</a></h2>
                            <p>${topic.body}</p>
                            <p><strong>Tags:</strong> ${topic.tags}</p>
                            <p><strong>Author:</strong> ${topic.author}</p>
                            <p><strong>Created at:</strong> ${new Date(topic.created_at).toLocaleString()}</p>
                            <button class="like-button" data-topic-id="${topic.id}" data-type="like">Like</button>
                            <button class="dislike-button" data-topic-id="${topic.id}" data-type="dislike">Dislike</button>
                        `;
                        topicsContainer.appendChild(topicElement);
                    });
                    document.querySelectorAll('.like-button, .dislike-button').forEach(button => {
                        button.addEventListener('click', function() {
                            const topicId = this.getAttribute('data-topic-id');
                            const type = this.getAttribute('data-type');
                            fetch('http://localhost:3000/like', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ user_id: user.id, topic_id: topicId, type })
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    alert(`${type === 'like' ? 'Liked' : 'Disliked'} successfully!`);
                                    loadTopicsByCategory(categoryId); // Reload topics
                                } else {
                                    alert('Erreur : ' + data.message);
                                }
                            })
                            .catch(error => console.error('Erreur:', error));
                        });
                    });
                } else {
                    console.error('Failed to load topics:', data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    document.getElementById('prev-page').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            loadTopics(currentPage);
        }
    });

    document.getElementById('next-page').addEventListener('click', function() {
        currentPage++;
        loadTopics(currentPage);
    });

    loadTopics(currentPage); // Load initial topics

    function loadPopularTopics() {
        fetch('http://localhost:3000/popular-topics')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const popularTopicsContainer = document.getElementById('bot-left-container');
                    popularTopicsContainer.innerHTML = ''; // Clear existing topics
                    data.topics.forEach(topic => {
                        const topicElement = document.createElement('div');
                        topicElement.classList.add('topic');
                        topicElement.innerHTML = `
                            <h2><a href="topic.html?id=${topic.id}">${topic.title}</a></h2>
                            <p>${topic.body}</p>
                            <p><strong>Tags:</strong> ${topic.tags}</p>
                            <p><strong>Likes:</strong> ${topic.likes_count}</p>
                            <p><strong>Comments:</strong> ${topic.comments_count}</p>
                        `;
                        popularTopicsContainer.appendChild(topicElement);
                    });
                } else {
                    console.error('Failed to load popular topics:', data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    loadPopularTopics(); // Load popular topics

    // Récupérer et afficher les topics likés
    fetch(`http://localhost:3000/liked-topics/${user.id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const likedTopicsContainer = document.getElementById('liked-topics-container');
                if (data.topics.length > 0) {
                    const topic = data.topics[0];
                    likedTopicsContainer.innerHTML = `
                        <h2><a href="topic.html?id=${topic.id}">${topic.title}</a></h2>
                    `;
                } else {
                    likedTopicsContainer.innerHTML = '<p>Vous n\'avez aimé aucun topic.</p>';
                }
            } else {
                console.error('Failed to load liked topics:', data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });

    document.getElementById('show-all-liked-topics').addEventListener('click', function() {
        fetch(`http://localhost:3000/liked-topics/${user.id}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    let topicsList = '';
                    data.topics.forEach(topic => {
                        topicsList += `
                            <div>
                                <h2><a href="topic.html?id=${topic.id}">${topic.title}</a></h2>
                                <p>${topic.body}</p>
                            </div>
                        `;
                    });
                    const popup = document.createElement('div');
                    popup.classList.add('popup');
                    popup.innerHTML = `
                        <div class="popup-content">
                            <span class="close-button">&times;</span>
                            ${topicsList}
                        </div>
                    `;
                    document.body.appendChild(popup);
                    document.querySelector('.close-button').addEventListener('click', function() {
                        document.body.removeChild(popup);
                    });
                } else {
                    console.error('Failed to load liked topics:', data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    });

    loadCategories(); // Load categories into the dropdown menu
});
